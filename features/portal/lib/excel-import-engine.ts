import * as XLSX from "xlsx"

export type DetectedColumn = {
  name: string
  index: number
  type: "string" | "number" | "date" | "mixed"
  sampleValues: unknown[]
  isFormula: boolean
  isMerged: boolean
  autoCategory: AutoCategory
  maxScore: number
}

export type AutoCategory =
  | "studentName"
  | "studentId"
  | "section"
  | "grade"
  | "skip"
  | "unknown"

export type MergedHeaderGroup = {
  startCol: number
  endCol: number
  label: string
}

export type AutoMapping = {
  studentNameCol?: string
  studentIdCol?: string
  sectionCol?: string
  gradeCols: Array<{ sourceName: string; gradeCategory: string; maxScore: number }>
  skipCols: string[]
}

export type SheetAnalysis = {
  sheetName: string
  headerRow: number
  totalRows: number
  totalDataRows: number
  columns: DetectedColumn[]
  previewRows: Record<string, unknown>[]
  hasMergedHeaders: boolean
  mergedHeaderGroups: MergedHeaderGroup[]
  confidence: number
  autoMapping: AutoMapping
}

export type WorkbookAnalysis = {
  sheets: SheetAnalysis[]
  totalSheets: number
}

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: AutoCategory }> = [
  { pattern: /\b(name|student|student name|full name|student name)\b/i, category: "studentName" },
  { pattern: /\b(id|student id|student no|student number|no\.?|number|i\.?d)\b/i, category: "studentId" },
  { pattern: /\b(section|sec|class|year level|year)\b/i, category: "section" },
  { pattern: /\b(remarks|remark|comment|notes|note|passed|failed|status)\b/i, category: "skip" },
]

const GRADE_PATTERNS: Array<{ pattern: RegExp; gradeCategory: string }> = [
  { pattern: /\b(lab quiz|lab quizzes|exercise|exercises)\b/i, gradeCategory: "Exercises" },
  { pattern: /\b(work attitude|attitude|lab activity|lab activities)\b/i, gradeCategory: "Work Attitude" },
  { pattern: /\b(project|proj|pro|capstone|mco)\b/i, gradeCategory: "Project" },
  { pattern: /\b(quiz|quizzes|q\d)\b/i, gradeCategory: "Quizzes" },
  { pattern: /\b(exam|midterm|final|prelim|midterm exam|final exam)\b/i, gradeCategory: "Exam" },
  { pattern: /\b(assignment|assign|hw|homework|task)\b/i, gradeCategory: "Assignments" },
  { pattern: /\b(performance|recitation|recit|seatwork|sw)\b/i, gradeCategory: "Performance" },
  { pattern: /\b(activity|activities|act)\b/i, gradeCategory: "Assignments" },
  { pattern: /\b(attendance|attend|atten|att|participation|participate)\b/i, gradeCategory: "Attendance" },
  { pattern: /\b(lab|laboratory|practical|lab work)\b/i, gradeCategory: "Exercises" },
  { pattern: /\b(grade|score|total|average|percentage|rating)\b/i, gradeCategory: "Computed" },
]

export function analyzeWorkbook(buffer: Buffer): WorkbookAnalysis {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellFormula: true,
    cellDates: true,
  })

  const sheetNames = workbook.SheetNames
  const sheets: SheetAnalysis[] = []

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const sheet = analyzeSheet(sheetName, worksheet)
    sheets.push(sheet)
  }

  return { sheets, totalSheets: sheets.length }
}

function analyzeSheet(sheetName: string, worksheet: XLSX.WorkSheet): SheetAnalysis {
  const ref = worksheet["!ref"]
  if (!ref) {
    return {
      sheetName,
      headerRow: 0,
      totalRows: 0,
      totalDataRows: 0,
      columns: [],
      previewRows: [],
      hasMergedHeaders: false,
      mergedHeaderGroups: [],
      confidence: 0,
      autoMapping: { gradeCols: [], skipCols: [] },
    }
  }

  const range = XLSX.utils.decode_range(ref)
  const totalRows = range.e.r - range.s.r + 1
  const merges = worksheet["!merges"] || []

  const headerRow = detectHeaderRow(worksheet, range)
  const mergedHeaderGroups = detectMergedHeaders(worksheet, merges, headerRow)

  const columns = detectColumns(worksheet, range, headerRow, merges, mergedHeaderGroups)

  const dataStartRow = headerRow + 1
  const dataRows: Record<string, unknown>[] = []
  const maxPreview = 50

  for (let r = dataStartRow; r <= range.e.r && dataRows.length < maxPreview; r++) {
    const row: Record<string, unknown> = {}
    let hasData = false
    for (const col of columns) {
      const cellAddress = XLSX.utils.encode_cell({ r, c: col.index })
      const cell = worksheet[cellAddress]
      if (cell !== undefined) {
        row[col.name] = cell.v ?? cell.w ?? ""
        if (cell.v !== undefined && cell.v !== null && cell.v !== "") {
          hasData = true
        }
      } else {
        row[col.name] = ""
      }
    }
    if (hasData) dataRows.push(row)
  }

  const autoMapping = buildAutoMapping(columns)
  const confidence = computeConfidence(columns, autoMapping)

  return {
    sheetName,
    headerRow: headerRow + 1,
    totalRows,
    totalDataRows: dataRows.length,
    columns,
    previewRows: dataRows,
    hasMergedHeaders: mergedHeaderGroups.length > 0,
    mergedHeaderGroups,
    confidence,
    autoMapping,
  }
}

function buildAutoMapping(columns: DetectedColumn[]): AutoMapping {
  let studentNameCol: string | undefined
  let studentIdCol: string | undefined
  let sectionCol: string | undefined
  const gradeCols: AutoMapping["gradeCols"] = []
  const skipCols: string[] = []

  for (const col of columns) {
    if (col.autoCategory === "studentName" && !studentNameCol) {
      studentNameCol = col.name
    } else if (col.autoCategory === "studentId" && !studentIdCol) {
      studentIdCol = col.name
    } else if (col.autoCategory === "section" && !sectionCol) {
      sectionCol = col.name
    } else if (col.autoCategory === "skip") {
      skipCols.push(col.name)
    } else if (col.autoCategory === "grade") {
      gradeCols.push({
        sourceName: col.name,
        gradeCategory: inferGradeCategory(col.name),
        maxScore: col.maxScore,
      })
    }
  }

  return { studentNameCol, studentIdCol, sectionCol, gradeCols, skipCols }
}

function computeConfidence(columns: DetectedColumn[], mapping: AutoMapping): number {
  if (columns.length === 0) return 0
  let score = 0
  let maxScore = 0

  for (const col of columns) {
    maxScore += 10
    if (col.autoCategory === "studentName") score += 15
    else if (col.autoCategory === "studentId") score += 10
    else if (col.autoCategory === "grade" && col.type === "number") score += 8
    else if (col.autoCategory === "grade") score += 5
    else if (col.autoCategory === "section") score += 5
    else if (col.autoCategory === "skip") score += 3
    else score -= 5
  }

  if (!mapping.studentNameCol && !mapping.studentIdCol) score -= 20
  if (mapping.gradeCols.length === 0) score -= 30

  return Math.round(Math.max(0, Math.min(100, (score / Math.max(maxScore, 1)) * 100)))
}

function detectHeaderRow(worksheet: XLSX.WorkSheet, range: XLSX.Range): number {
  let bestRow = range.s.r
  let maxCells = 0

  for (let r = range.s.r; r <= Math.min(range.s.r + 5, range.e.r); r++) {
    let nonEmpty = 0
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r, c })]
      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
        nonEmpty++
      }
    }
    if (nonEmpty > maxCells) {
      maxCells = nonEmpty
      bestRow = r
    }
  }

  return bestRow
}

function detectMergedHeaders(
  worksheet: XLSX.WorkSheet,
  merges: XLSX.Range[],
  headerRow: number
): MergedHeaderGroup[] {
  const groups: MergedHeaderGroup[] = []

  for (const merge of merges) {
    if (merge.s.r <= headerRow && merge.e.r >= headerRow) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c: merge.s.c })]
      const label = cell?.v?.toString() ?? ""
      groups.push({
        startCol: merge.s.c,
        endCol: merge.e.c,
        label,
      })
    }
  }

  return groups
}

function detectColumns(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  headerRow: number,
  merges: XLSX.Range[],
  mergedHeaderGroups: MergedHeaderGroup[]
): DetectedColumn[] {
  const columns: DetectedColumn[] = []

  const mergedCols = new Set<number>()
  for (const group of mergedHeaderGroups) {
    for (let c = group.startCol; c <= group.endCol; c++) {
      mergedCols.add(c)
    }
  }

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c })
    const cell = worksheet[cellAddress]
    const rawName = cell?.v?.toString()?.trim()

    if (!rawName) continue

    const uniqueName = makeUniqueName(rawName, columns.map((col) => col.name))

    const sampleValues: unknown[] = []
    let isNumeric = true
    let isDate = true
    let isFormula = false
    let maxVal = 0

    for (let r = headerRow + 1; r <= Math.min(headerRow + 10, range.e.r); r++) {
      const dataCell = worksheet[XLSX.utils.encode_cell({ r, c })]
      if (dataCell) {
        const val = dataCell.v
        if (val !== undefined && val !== null && val !== "") {
          sampleValues.push(val)
          if (typeof val === "number") {
            maxVal = Math.max(maxVal, val)
          } else {
            isNumeric = false
          }
          if (!(val instanceof Date) && typeof val !== "number") {
            isDate = false
          }
          if (typeof dataCell.f === "string") {
            isFormula = true
          }
        }
      } else {
        isNumeric = false
        isDate = false
      }
    }

    const isMerged = mergedCols.has(c)
    const type = isNumeric ? "number" : isDate ? "date" : sampleValues.length > 0 ? "mixed" : "string"
    const autoCategory = inferAutoCategory(rawName, sampleValues)

    columns.push({
      name: uniqueName,
      index: c,
      type,
      sampleValues: sampleValues.slice(0, 3),
      isFormula,
      isMerged,
      autoCategory,
      maxScore: autoCategory === "grade" ? Math.max(Math.ceil(maxVal * 1.2), 100) : 100,
    })
  }

  return columns
}

function makeUniqueName(baseName: string, existing: string[]): string {
  if (!existing.includes(baseName)) return baseName
  let i = 2
  while (existing.includes(`${baseName}_${i}`)) {
    i++
  }
  return `${baseName}_${i}`
}

function inferAutoCategory(name: string, sampleValues: unknown[]): AutoCategory {
  const lower = name.toLowerCase().trim()

  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(lower)) return category
  }

  const allNumeric = sampleValues.length > 0 && sampleValues.every((v) => typeof v === "number")
  if (allNumeric) return "grade"

  return "unknown"
}

export function inferGradeCategory(columnName: string): string {
  const lower = columnName.toLowerCase().trim()

  for (const { pattern, gradeCategory } of GRADE_PATTERNS) {
    if (pattern.test(lower)) return gradeCategory
  }

  return "Custom"
}

export function parseColumnValuesForImport(
  worksheet: XLSX.WorkSheet,
  headerRow: number,
  columnIndex: number
): { values: (number | string)[]; maxScore: number } {
  const ref = worksheet["!ref"]
  if (!ref) return { values: [], maxScore: 100 }
  const range = XLSX.utils.decode_range(ref)
  const values: (number | string)[] = []
  let maxVal = 0

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r, c: columnIndex })]
    if (cell && cell.v !== undefined && cell.v !== null) {
      const v = typeof cell.v === "number" ? cell.v : Number(cell.v)
      if (!isNaN(v as number)) {
        values.push(v as number)
        maxVal = Math.max(maxVal, v as number)
      } else {
        values.push(cell.v.toString())
      }
    }
  }

  return { values, maxScore: Math.max(Math.ceil(maxVal * 1.2), 100) }
}
