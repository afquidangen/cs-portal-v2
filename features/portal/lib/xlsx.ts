"use client"

type ZipEntry = {
  name: string
  compressionMethod: number
  compressedSize: number
  localHeaderOffset: number
}

export type XlsxSheet = {
  name: string
  rows: {
    rowNumber: number
    cells: Record<string, string>
  }[]
}

export type ImportedScheduleRow = {
  day: string
  time: string
  subject: string
  room: string
  instructor: string
  section: string
}

const textDecoder = new TextDecoder("utf-8")

function readUInt16(view: DataView, offset: number) {
  return view.getUint16(offset, true)
}

function readUInt32(view: DataView, offset: number) {
  return view.getUint32(offset, true)
}

function findEndOfCentralDirectory(view: DataView) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (readUInt32(view, offset) === 0x06054b50) return offset
  }

  throw new Error("The uploaded file is not a readable .xlsx workbook.")
}

async function inflateRaw(bytes: Uint8Array) {
  if (!("DecompressionStream" in globalThis)) {
    throw new Error("This browser cannot read compressed .xlsx files.")
  }

  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const stream = new Blob([buffer]).stream().pipeThrough(
    new DecompressionStream("deflate-raw")
  )
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function unzipWorkbook(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const directoryOffset = readUInt32(view, findEndOfCentralDirectory(view) + 16)
  const entries: ZipEntry[] = []
  let offset = directoryOffset

  while (offset < view.byteLength && readUInt32(view, offset) === 0x02014b50) {
    const compressionMethod = readUInt16(view, offset + 10)
    const compressedSize = readUInt32(view, offset + 20)
    const fileNameLength = readUInt16(view, offset + 28)
    const extraLength = readUInt16(view, offset + 30)
    const commentLength = readUInt16(view, offset + 32)
    const localHeaderOffset = readUInt32(view, offset + 42)
    const name = textDecoder.decode(
      bytes.slice(offset + 46, offset + 46 + fileNameLength)
    )

    entries.push({
      name,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    })

    offset += 46 + fileNameLength + extraLength + commentLength
  }

  const files: Record<string, string> = {}

  for (const entry of entries) {
    const localOffset = entry.localHeaderOffset
    if (readUInt32(view, localOffset) !== 0x04034b50) continue

    const fileNameLength = readUInt16(view, localOffset + 26)
    const extraLength = readUInt16(view, localOffset + 28)
    const dataStart = localOffset + 30 + fileNameLength + extraLength
    const compressedBytes = bytes.slice(
      dataStart,
      dataStart + entry.compressedSize
    )
    const fileBytes =
      entry.compressionMethod === 0
        ? compressedBytes
        : entry.compressionMethod === 8
          ? await inflateRaw(compressedBytes)
          : null

    if (fileBytes) files[entry.name] = textDecoder.decode(fileBytes)
  }

  return files
}

function parseXml(xml: string) {
  return new DOMParser().parseFromString(xml, "application/xml")
}

function normalizeWorkbookTarget(target: string) {
  if (target.startsWith("/")) return target.slice(1)
  if (target.startsWith("xl/")) return target
  return `xl/${target}`.replaceAll("\\", "/")
}

function getSharedStrings(files: Record<string, string>) {
  const xml = files["xl/sharedStrings.xml"]
  if (!xml) return []

  return Array.from(parseXml(xml).getElementsByTagName("si")).map((item) =>
    item.textContent?.trim() ?? ""
  )
}

function getCellColumn(reference: string) {
  return reference.replace(/[0-9]/g, "")
}

function getCellValue(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t")
  const rawValue = cell.getElementsByTagName("v")[0]?.textContent ?? ""

  if (type === "s") return sharedStrings[Number(rawValue)] ?? ""
  if (type === "inlineStr") return cell.textContent?.trim() ?? ""

  return rawValue.trim()
}

function parseRows(sheetXml: string, sharedStrings: string[]) {
  const document = parseXml(sheetXml)

  return Array.from(document.getElementsByTagName("row")).map((row) => {
    const cells: Record<string, string> = {}

    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      const reference = cell.getAttribute("r")
      if (!reference) return
      cells[getCellColumn(reference)] = getCellValue(cell, sharedStrings)
    })

    return {
      rowNumber: Number(row.getAttribute("r") ?? 0),
      cells,
    }
  })
}

export async function readXlsxWorkbook(file: File): Promise<XlsxSheet[]> {
  const files = await unzipWorkbook(await file.arrayBuffer())
  const workbookXml = files["xl/workbook.xml"]
  const relsXml = files["xl/_rels/workbook.xml.rels"]

  if (!workbookXml || !relsXml) {
    throw new Error("The uploaded workbook is missing required .xlsx metadata.")
  }

  const sharedStrings = getSharedStrings(files)
  const rels = new Map<string, string>()

  Array.from(parseXml(relsXml).getElementsByTagName("Relationship")).forEach(
    (relationship) => {
      const id = relationship.getAttribute("Id")
      const target = relationship.getAttribute("Target")
      if (id && target) rels.set(id, normalizeWorkbookTarget(target))
    }
  )

  return Array.from(parseXml(workbookXml).getElementsByTagName("sheet"))
    .map((sheet) => {
      const id = sheet.getAttribute("r:id")
      const target = id ? rels.get(id) : undefined
      const xml = target ? files[target] : undefined

      if (!xml) return null

      return {
        name: sheet.getAttribute("name") ?? target ?? "Sheet",
        rows: parseRows(xml, sharedStrings),
      }
    })
    .filter((sheet): sheet is XlsxSheet => Boolean(sheet))
}

function toNumber(value?: string) {
  if (!value) return undefined
  const cleaned = value.replace(/,/g, "").trim()
  if (!cleaned || cleaned.startsWith("#")) return undefined
  const numeric = Number(cleaned)
  return Number.isFinite(numeric) ? numeric : undefined
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "")
}

export async function parseScheduleWorkbook(file: File) {
  const sheet = (await readXlsxWorkbook(file))[0]
  if (!sheet) return []

  const headerRow = sheet.rows.find((row) =>
    Object.values(row.cells).some((cell) => normalizeHeader(cell) === "section")
  )

  if (!headerRow) return []

  const headerMap = new Map<string, string>()
  Object.entries(headerRow.cells).forEach(([column, value]) => {
    headerMap.set(normalizeHeader(value), column)
  })

  const read = (cells: Record<string, string>, header: string) =>
    cells[headerMap.get(header) ?? ""]?.trim() ?? ""

  return sheet.rows
    .filter((row) => row.rowNumber > headerRow.rowNumber)
    .map((row): ImportedScheduleRow | null => {
      const section = read(row.cells, "section")
      const subject = read(row.cells, "subject")
      const instructor = read(row.cells, "instructor")
      const day = read(row.cells, "day")
      const time = read(row.cells, "time")
      const room = read(row.cells, "room")

      if (!section || !subject) return null

      return {
        day: day || "TBA",
        time: time || "TBA",
        subject,
        room: room || "TBA",
        instructor: instructor || "TBA",
        section,
      }
    })
    .filter((row): row is ImportedScheduleRow => Boolean(row))
}
