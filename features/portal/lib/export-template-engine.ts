import ExcelJS from "exceljs"
import path from "path"
import fs from "fs"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { usersRepository } from "@/features/portal/repositories/users.repository"
import { gradeCategoryMatches } from "@/features/portal/lib/grade-engine"
import type { GradeRecord } from "@/lib/types/grade"
import type { GradeColumn } from "@/lib/types/grade-column"

const TEMPLATES_DIR = path.join(process.cwd(), "templates")
const TEMPLATE_FILE = "2SSY2526 CS4A IAS Class Record (gsheetv4.2).xlsx"

const HEADER_CELLS: Record<string, Array<{ row: number; col: number; key: string }>> = {
  "CLASS RECORD": [
    { row: 2, col: 2, key: "subject" },
    { row: 2, col: 4, key: "courseNo" },
    { row: 2, col: 15, key: "section" },
    { row: 2, col: 21, key: "semester" },
    { row: 2, col: 25, key: "units" },
    { row: 2, col: 30, key: "ay" },
    { row: 2, col: 33, key: "dean" },
    { row: 2, col: 43, key: "faculty" },
    { row: 2, col: 55, key: "campus" },
    { row: 2, col: 63, key: "address" },
  ],
  "GS MID": [
    { row: 5, col: 2, key: "courseNo" },
    { row: 5, col: 7, key: "section" },
    { row: 5, col: 12, key: "semester" },
    { row: 5, col: 17, key: "units" },
    { row: 6, col: 2, key: "subject" },
    { row: 6, col: 12, key: "ay" },
  ],
  "GS FIN": [
    { row: 5, col: 2, key: "courseNo" },
    { row: 5, col: 6, key: "section" },
    { row: 5, col: 11, key: "semester" },
    { row: 5, col: 16, key: "units" },
    { row: 6, col: 2, key: "subject" },
    { row: 6, col: 11, key: "ay" },
  ],
  "REPORTS OF GRADE": [
    { row: 7, col: 3, key: "courseNo" },
    { row: 7, col: 8, key: "section" },
    { row: 7, col: 12, key: "semester" },
    { row: 7, col: 15, key: "ay" },
    { row: 8, col: 3, key: "subject" },
    { row: 8, col: 12, key: "units" },
  ],
}

interface TemplateCategory {
  alias: string
  itemColumns: number[]
  psCol?: number
  wsCol?: number
}

interface TemplatePeriodMap {
  categories: TemplateCategory[]
  examCol?: number
  csCol?: number
  totalCol?: number
  labTotalCol?: number
  absencesCol?: number
  attendanceCol?: number
  labAbsencesCol?: number
  labAttendanceCol?: number
  periodGradeCol?: number
  transmutedCol?: number
  remarksCol?: number
  labStartCol?: number
  labEndCol?: number
  attendanceStartCol?: number
  attendanceEndCol?: number
}

const CATEGORY_LABEL_REGEX = /\s*-?\s*\d+%\s*$/

function scanTemplateColumnMap(sheet: ExcelJS.Worksheet, startCol: number, endCol: number): TemplatePeriodMap {
  const map: TemplatePeriodMap = { categories: [] }

  const row7Lbl = (c: number): unknown => sheet.getCell(7, c).value
  const row9Val = (c: number): unknown => sheet.getCell(9, c).value

  let col = startCol
  while (col <= endCol) {
    const label = row7Lbl(col)
    if (label == null) {
      col++
      continue
    }

    let regionEnd = col
    while (regionEnd < endCol && row7Lbl(regionEnd + 1) === label) {
      regionEnd++
    }

    if (typeof label === "number") {
      if (label === 1) {
        if (map.labStartCol != null) map.labTotalCol = col
        else map.totalCol = col
      }
      col = regionEnd + 1
      continue
    }

    const rawLabel = String(label)
    const baseName = rawLabel.replace(CATEGORY_LABEL_REGEX, "").trim().toLowerCase()
    const normalized = baseName.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")

    if (normalized === "cs" || normalized === "mg" || normalized === "fg") {
      if (normalized === "cs") map.csCol = col
      else map.periodGradeCol = col
      col = regionEnd + 1
      continue
    }

    if (normalized === "transmuted") {
      map.transmutedCol = col
      col = regionEnd + 1
      continue
    }

    if (normalized === "remarks") {
      map.remarksCol = col
      col = regionEnd + 1
      continue
    }

    if (gradeCategoryMatches("exam", normalized)) {
      map.examCol = col
      col = regionEnd + 1
      continue
    }

    if (gradeCategoryMatches("attendance", normalized) || ["atten", "attend"].includes(normalized)) {
      map.attendanceStartCol = col
      map.attendanceEndCol = regionEnd
      for (let c = col; c <= regionEnd; c++) {
        const r9 = row9Val(c)
        if (r9 === "ABS") {
          if (map.labStartCol && c >= map.labStartCol) map.labAbsencesCol = c
          else map.absencesCol = c
        } else if (r9 === "ATT") {
          if (map.labStartCol && c >= map.labStartCol) map.labAttendanceCol = c
          else map.attendanceCol = c
        }
      }
      col = regionEnd + 1
      continue
    }

    const cat: TemplateCategory = {
      alias: normalized === "recitation" ? "performance recitation" : normalized,
      itemColumns: [],
    }
    for (let c = col; c <= regionEnd; c++) {
      const r9 = row9Val(c)
      if (typeof r9 === "number" && r9 >= 1 && r9 <= 10) {
        cat.itemColumns.push(c)
      } else if (r9 === "PS") {
        cat.psCol = c
      } else if (r9 === "WS") {
        cat.wsCol = c
      } else if (r9 === "PRO") {
        if (!cat.itemColumns.includes(c)) cat.itemColumns.push(c)
      }
    }
    map.categories.push(cat)

    if (
      gradeCategoryMatches("exercise", normalized) ||
      gradeCategoryMatches("work attitude", normalized) ||
      gradeCategoryMatches("project", normalized)
    ) {
      if (!map.labStartCol) map.labStartCol = col
      map.labEndCol = regionEnd
    }

    col = regionEnd + 1
  }

  if (map.labEndCol == null && map.labStartCol != null) {
    map.labEndCol = endCol
  }

  return map
}

function scoreKey(colName: string, gradingPeriod?: string): string {
  return gradingPeriod && gradingPeriod !== "both"
    ? `${gradingPeriod}_${colName}`
    : colName
}

function getAbsences(grade: GradeRecord, period: string): number {
  for (const [key, val] of Object.entries(grade.scores ?? {})) {
    if (key.startsWith(`${period}_absences_`)) {
      return Number(val) || 0
    }
  }
  return 0
}

function populateHeader(sheet: ExcelJS.Worksheet, sheetName: string, data: Record<string, string>): void {
  const cells = HEADER_CELLS[sheetName] ?? []
  for (const cell of cells) {
    const val = data[cell.key]
    if (val) {
      sheet.getCell(cell.row, cell.col).value = val
    }
  }
}

function populatePeriodSection(
  sheet: ExcelJS.Worksheet,
  grade: GradeRecord,
  columns: GradeColumn[],
  rowIdx: number,
  periodMap: TemplatePeriodMap,
  period: "midterm" | "final",
): void {
  const grouped: Record<string, GradeColumn[]> = {}

  for (const col of columns) {
    const matchesPeriod = !col.gradingPeriod || col.gradingPeriod === period || col.gradingPeriod === "both"
    if (!matchesPeriod) continue

    if (!grouped[col.category]) grouped[col.category] = []
    grouped[col.category].push(col)
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.order - b.order)
  }

  const absences = getAbsences(grade, period)

  for (const cat of periodMap.categories) {
    const items: GradeColumn[] = []
    for (const ck of Object.keys(grouped)) {
      if (gradeCategoryMatches(cat.alias, ck)) {
        items.push(...grouped[ck])
      }
    }
    if (items.length === 0) continue
    items.sort((a, b) => a.order - b.order)
    for (let j = 0; j < items.length && j < cat.itemColumns.length; j++) {
      const targetCol = cat.itemColumns[j]
      const key = scoreKey(items[j].name, items[j].gradingPeriod)
      const score = grade.scores?.[key] ?? grade.scores?.[items[j].name]
      sheet.getCell(rowIdx, targetCol).value = score ?? null
    }
  }

  if (periodMap.examCol != null) {
    const examItems: GradeColumn[] = []
    for (const ck of Object.keys(grouped)) {
      if (gradeCategoryMatches("exam", ck)) {
        examItems.push(...grouped[ck])
      }
    }
    if (examItems.length > 0) {
      const key = scoreKey(examItems[0].name, examItems[0].gradingPeriod)
      const examScore = grade.scores?.[key] ?? grade.scores?.[examItems[0].name]
      sheet.getCell(rowIdx, periodMap.examCol).value = examScore ?? null
    }
  }

  if (periodMap.absencesCol != null) {
    sheet.getCell(rowIdx, periodMap.absencesCol).value = absences || null
  }

  if (periodMap.labAbsencesCol != null) {
    const labAbsences = getAbsences(grade, period)
    sheet.getCell(rowIdx, periodMap.labAbsencesCol).value = labAbsences || null
  }

  if (period === "midterm") {
    if (periodMap.csCol != null) sheet.getCell(rowIdx, periodMap.csCol).value = grade.midtermClassStanding ?? null
    if (periodMap.examCol != null) {
      sheet.getCell(rowIdx, periodMap.examCol + 1).value = grade.midtermExam ?? null
    }
    if (periodMap.totalCol != null) sheet.getCell(rowIdx, periodMap.totalCol).value = grade.midtermGrade ?? null
    if (periodMap.periodGradeCol != null) sheet.getCell(rowIdx, periodMap.periodGradeCol).value = grade.midtermGrade ?? null
    if (periodMap.transmutedCol != null) sheet.getCell(rowIdx, periodMap.transmutedCol).value = grade.midtermTransmuted ?? null
    if (periodMap.remarksCol != null) sheet.getCell(rowIdx, periodMap.remarksCol).value = grade.midtermRemarks ?? ""
    if (periodMap.labTotalCol != null) sheet.getCell(rowIdx, periodMap.labTotalCol).value = grade.midtermLaboratoryGrade ?? null
  } else {
    if (periodMap.csCol != null) sheet.getCell(rowIdx, periodMap.csCol).value = grade.finalClassStanding ?? null
    if (periodMap.examCol != null) {
      sheet.getCell(rowIdx, periodMap.examCol + 1).value = grade.finalExam ?? null
    }
    if (periodMap.totalCol != null) sheet.getCell(rowIdx, periodMap.totalCol).value = grade.tentativeFinalGrade ?? null
    if (periodMap.periodGradeCol != null) sheet.getCell(rowIdx, periodMap.periodGradeCol).value = grade.tentativeFinalGrade ?? null
    if (periodMap.transmutedCol != null) sheet.getCell(rowIdx, periodMap.transmutedCol).value = grade.finalTransmuted ?? null
    if (periodMap.remarksCol != null) sheet.getCell(rowIdx, periodMap.remarksCol).value = grade.finalRemarks ?? ""
    if (periodMap.labTotalCol != null) sheet.getCell(rowIdx, periodMap.labTotalCol).value = grade.finalLaboratoryGrade ?? null
  }
}

function formatStudentName(name: string): string {
  if (!name || name.includes(",")) return name
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return name
  const lastName = parts.pop()!
  return `${lastName}, ${parts.join(" ")}`
}

function populateHPSRow(
  sheet: ExcelJS.Worksheet,
  columns: GradeColumn[],
  periodMap: TemplatePeriodMap,
  period: "midterm" | "final",
): void {
  const hpsRow = 5
  const grouped: Record<string, GradeColumn[]> = {}

  for (const col of columns) {
    const matchesPeriod = !col.gradingPeriod || col.gradingPeriod === period || col.gradingPeriod === "both"
    if (!matchesPeriod) continue

    if (!grouped[col.category]) grouped[col.category] = []
    grouped[col.category].push(col)
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.order - b.order)
  }

  for (const cat of periodMap.categories) {
    const items: GradeColumn[] = []
    for (const ck of Object.keys(grouped)) {
      if (gradeCategoryMatches(cat.alias, ck)) {
        items.push(...grouped[ck])
      }
    }
    if (items.length === 0) continue
    items.sort((a, b) => a.order - b.order)
    for (let j = 0; j < items.length && j < cat.itemColumns.length; j++) {
      sheet.getCell(hpsRow, cat.itemColumns[j]).value = items[j].maxScore ?? 0
    }
  }

  if (periodMap.examCol != null) {
    const examItems: GradeColumn[] = []
    for (const ck of Object.keys(grouped)) {
      if (gradeCategoryMatches("exam", ck)) {
        examItems.push(...grouped[ck])
      }
    }
    if (examItems.length > 0) {
      sheet.getCell(hpsRow, periodMap.examCol).value = examItems[0].maxScore ?? 0
    }
  }
}

export async function exportTemplate(classId: string, section?: string | null): Promise<Buffer> {
  try {
    return await exportTemplateImpl(classId, section)
  } catch (err) {
    console.error("[exportTemplate] Error:", err instanceof Error ? err.stack ?? err.message : String(err))
    throw err
  }
}

async function exportTemplateImpl(classId: string, section?: string | null): Promise<Buffer> {
  const templatePath = path.join(TEMPLATES_DIR, TEMPLATE_FILE)

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      "Template file not found. Please ensure the official Excel template is placed in the templates/ folder."
    )
  }

  let [grades, columns, schedulesData] = await Promise.all([
    gradesRepository.findAll({ classId }) as Promise<GradeRecord[]>,
    gradeColumnRepository.findByClass(classId) as Promise<GradeColumn[]>,
    schedulesRepository.findAll({ id: classId }) as Promise<Record<string, unknown>[]>,
  ])

  // Build sex lookup map and sort key map from student records
  const studentIds = [...new Set(grades.map((g) => g.studentId).filter(Boolean))] as string[]
  const sexMap = new Map<string, string>()
  const studentSortMap = new Map<string, string>()
  if (studentIds.length > 0) {
    const students = (await usersRepository.findAll({ id: { $in: studentIds } })) as Array<{
      id: string
      sex?: string
      firstName?: string
      lastName?: string
      name?: string
    }>
    for (const s of students) {
      if (s.sex) sexMap.set(s.id, s.sex)
      const key = (s.lastName ?? s.name?.split(" ").pop() ?? "").toLowerCase()
      studentSortMap.set(s.id, key)
    }
  }

  if (section) {
    grades = grades.filter((g) => g.section === section)
  }

  grades.sort((a, b) => {
    const aKey = studentSortMap.get(a.studentId) ?? (a.student ?? "").toLowerCase()
    const bKey = studentSortMap.get(b.studentId) ?? (b.student ?? "").toLowerCase()
    return aKey.localeCompare(bKey)
  })

  if (grades.length === 0) {
    throw new Error("No grades found for this class.")
  }

  const schedule = schedulesData[0] ?? {}
  const semesterId = schedule.semesterId as string | undefined

  let semesterName = ""
  let ay = ""
  if (semesterId) {
    try {
      const semesterDoc = await semestersRepository.findOne({ id: semesterId }) as {
        semester?: string
        schoolYearStart?: number
        schoolYearEnd?: number
      } | null
      if (semesterDoc) {
        const semLabel = semesterDoc.semester === "First Semester"
          ? "1st Semester"
          : semesterDoc.semester === "Second Semester"
          ? "2nd Semester"
          : semesterDoc.semester ?? ""
        semesterName = semLabel
        if (semesterDoc.schoolYearStart && semesterDoc.schoolYearEnd) {
          ay = `${semesterDoc.schoolYearStart}-${semesterDoc.schoolYearEnd}`
        }
      }
    } catch {
      // semester lookup failed — leave blank
    }
  }

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(templatePath)

  const sectionLabel = (grades[0]?.section || schedule.section || "") as string
  const headerData: Record<string, string> = {
    subject: (schedule.subject as string) ?? grades[0]?.subject ?? "",
    courseNo: (grades[0]?.code as string) ?? "",
    section: sectionLabel,
    semester: semesterName,
    units: String((grades[0]?.units as number) ?? ""),
    ay: ay,
    dean: "",
    faculty: (schedule.instructor as string) ?? "",
    campus: "",
    address: "",
  }

  for (const sheetName of ["CLASS RECORD", "GS MID", "GS FIN", "REPORTS OF GRADE"]) {
    const sheet = wb.getWorksheet(sheetName)
    if (sheet) {
      populateHeader(sheet, sheetName, headerData)
    }
  }

  // Ensure REPORTS OF GRADE header columns are wide enough for their content
  const rogSheet = wb.getWorksheet("REPORTS OF GRADE")
  if (rogSheet) {
    const valueWidth = Math.max(headerData.subject.length + 2, headerData.courseNo.length + 2, 14)
    if (rogSheet.getColumn(3).width < valueWidth) {
      rogSheet.getColumn(3).width = valueWidth
    }
    const semWidth = Math.max(headerData.semester.length + 2, 12)
    if (rogSheet.getColumn(12).width < semWidth) {
      rogSheet.getColumn(12).width = semWidth
    }
  }

  // Widen dean name column in GS MID and GS FIN footers
  const gsMidSheet = wb.getWorksheet("GS MID")
  if (gsMidSheet && (gsMidSheet.getColumn(14).width ?? 0) < 30) {
    gsMidSheet.getColumn(14).width = 38
  }
  const gsFinSheet = wb.getWorksheet("GS FIN")
  if (gsFinSheet && (gsFinSheet.getColumn(13).width ?? 0) < 38) {
    gsFinSheet.getColumn(13).width = 38
  }

  const crSheet = wb.getWorksheet("CLASS RECORD")
  if (!crSheet) throw new Error("CLASS RECORD sheet not found in template")

  const totalCols = crSheet.columnCount || 160
  let finalsStartCol = totalCols
  for (let c = 1; c <= totalCols; c++) {
    const v = crSheet.getCell(3, c).value
    if (String(v) === "FINALS") {
      finalsStartCol = c
      break
    }
  }

  const midtermMap = scanTemplateColumnMap(crSheet, 1, finalsStartCol - 1)
  const finalsMap = scanTemplateColumnMap(crSheet, finalsStartCol, totalCols)

  // Rename "RECITATION - N%" to "PERFORMANCE/RECITATION - N%" in finals section
  for (const cat of finalsMap.categories) {
    if (cat.alias === "performance recitation" && cat.itemColumns.length > 0) {
      const firstCol = cat.itemColumns[0]
      const v = crSheet.getCell(7, firstCol).value
      if (typeof v === "string" && v.includes("RECITATION - ")) {
        crSheet.getCell(7, firstCol).value = v.replace("RECITATION - ", "PERFORMANCE/RECITATION - ")
      }
    }
  }

  const isLabSubject = grades.some((g) =>
    g.midtermLaboratoryGrade != null ||
    g.finalLaboratoryGrade != null ||
    g.laboratoryGrade != null
  )

  {
    const dataStartRow = 10

    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i]
      const rowIdx = dataStartRow + i

      crSheet.getCell(rowIdx, 1).value = i + 1
      crSheet.getCell(rowIdx, 2).value = formatStudentName(grade.student ?? "")
      crSheet.getCell(rowIdx, 3).value = sexMap.get(grade.studentId) ?? ""

      populatePeriodSection(crSheet, grade, columns, rowIdx, midtermMap, "midterm")
      populatePeriodSection(crSheet, grade, columns, rowIdx, finalsMap, "final")

      if (grade.finalGrade != null && grade.finalGrade > 0) {
        crSheet.getCell(rowIdx, 154).value = grade.midtermGrade ?? null
        crSheet.getCell(rowIdx, 155).value = grade.tentativeFinalGrade ?? null
        crSheet.getCell(rowIdx, 156).value = Math.round(Number(grade.finalGrade))
        crSheet.getCell(rowIdx, 157).value = grade.transmutedGrade ?? null
        crSheet.getCell(rowIdx, 158).value = grade.finalGrade ?? null
        crSheet.getCell(rowIdx, 159).value = grade.remarks ?? ""
      }
    }

    populateHPSRow(crSheet, columns, midtermMap, "midterm")
    populateHPSRow(crSheet, columns, finalsMap, "final")

    // Widen item and exam columns to fit 3-digit scores (prevents #####)
    const ensureWidth = (c: number) => {
      const current = crSheet.getColumn(c).width
      if (current == null || current < 5) crSheet.getColumn(c).width = 5
    }
    for (const cat of [...midtermMap.categories, ...finalsMap.categories]) {
      for (const c of cat.itemColumns) ensureWidth(c)
      if (cat.psCol != null) ensureWidth(cat.psCol)
      if (cat.wsCol != null) ensureWidth(cat.wsCol)
    }
    if (midtermMap.examCol != null) ensureWidth(midtermMap.examCol)
    if (finalsMap.examCol != null) ensureWidth(finalsMap.examCol)

    if (!isLabSubject && midtermMap.labStartCol != null && midtermMap.labEndCol != null) {
      for (let c = midtermMap.labStartCol; c <= (midtermMap.labTotalCol ?? midtermMap.labEndCol); c++) {
        crSheet.getColumn(c).hidden = true
      }
      for (let c = finalsMap.labStartCol ?? finalsStartCol; c <= (finalsMap.labTotalCol ?? finalsMap.labEndCol ?? totalCols); c++) {
        crSheet.getColumn(c).hidden = true
      }

      const clearLabHeaders = (startCol: number, endCol: number) => {
        for (let r = 3; r <= 9; r++) {
          for (let c = startCol; c <= endCol; c++) {
            crSheet.getCell(r, c).value = null
          }
        }
      }
      clearLabHeaders(midtermMap.labStartCol, midtermMap.labTotalCol ?? midtermMap.labEndCol)
      clearLabHeaders(finalsMap.labStartCol ?? finalsStartCol, finalsMap.labTotalCol ?? finalsMap.labEndCol ?? totalCols)

      const clearAttendanceHeaders = (startCol: number | undefined, endCol: number | undefined) => {
        if (startCol == null || endCol == null) return
        for (let r = 3; r <= 9; r++) {
          for (let c = startCol; c <= endCol; c++) {
            crSheet.getCell(r, c).value = null
          }
        }
      }
      clearAttendanceHeaders(midtermMap.attendanceStartCol, midtermMap.attendanceEndCol)
      clearAttendanceHeaders(finalsMap.attendanceStartCol, finalsMap.attendanceEndCol)

      const hideCols = (startCol: number | undefined, endCol: number | undefined) => {
        if (startCol == null || endCol == null) return
        for (let c = startCol; c <= endCol; c++) crSheet.getColumn(c).hidden = true
      }
      hideCols(midtermMap.attendanceStartCol, midtermMap.attendanceEndCol)
      hideCols(finalsMap.attendanceStartCol, finalsMap.attendanceEndCol)

      if (midtermMap.categories.length > 0) {
        const firstCatStart = midtermMap.categories[0].itemColumns[0] ?? midtermMap.examCol ?? 0
        crSheet.getCell(6, firstCatStart).value = "CLASS STANDING - 40%"
      }
      if (midtermMap.labStartCol != null) {
        crSheet.getCell(6, midtermMap.labStartCol).value = ""
      }
    }

    // Clear lab data cells for lecture-only subjects
    if (!isLabSubject && midtermMap.labStartCol != null && midtermMap.labEndCol != null) {
      const clearLabData = (startCol: number, endCol: number) => {
        for (let r = dataStartRow; r <= dataStartRow + 89; r++) {
          for (let c = startCol; c <= endCol; c++) {
            crSheet.getCell(r, c).value = null
          }
        }
      }
      clearLabData(midtermMap.labStartCol, midtermMap.labTotalCol ?? midtermMap.labEndCol)
      clearLabData(finalsMap.labStartCol ?? finalsStartCol, finalsMap.labTotalCol ?? finalsMap.labEndCol ?? totalCols)
    }

    // Clear template placeholder rows that weren't filled with actual students
    for (let r = dataStartRow + grades.length; r <= dataStartRow + 89; r++) {
      const row = crSheet.getRow(r)
      for (let c = 1; c <= totalCols; c++) {
        row.getCell(c).value = null
      }
    }

    // Replace shared formula cells with cached results where available
    // (keeps formulas alive when no cache exists — Excel recalculates on open)
    for (let r = dataStartRow; r <= dataStartRow + 89; r++) {
      const row = crSheet.getRow(r)
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c)
        const cellModel = (cell as unknown as { model: { sharedFormula?: string; result?: unknown } }).model
        if (cellModel.sharedFormula && cellModel.result != null) {
          cell.value = cellModel.result
        }
      }
    }

    // Clear attendance data cells for lecture-only subjects (after formula replacement)
    if (!isLabSubject) {
      const clearAttendanceData = (startCol: number | undefined, endCol: number | undefined) => {
        if (startCol == null || endCol == null) return
        for (let r = dataStartRow; r <= dataStartRow + 89; r++) {
          for (let c = startCol; c <= endCol; c++) {
            crSheet.getCell(r, c).value = null
          }
        }
      }
      clearAttendanceData(midtermMap.attendanceStartCol, midtermMap.attendanceEndCol)
      clearAttendanceData(finalsMap.attendanceStartCol, finalsMap.attendanceEndCol)
    }

    // Guarantee period headers are present on the green row (after all clearing)
    crSheet.getCell(3, 4).value = "MIDTERM"
    crSheet.getCell(3, 78).value = "FINALS"
  }

  if (!isLabSubject) {
    const gsMid = wb.getWorksheet("GS MID")
    if (gsMid) {
      gsMid.getCell(7, 4).value = "CLASS STANDING 40%"
      for (let c = 15; c <= 23; c++) {
        gsMid.getCell(7, c).value = ""
        gsMid.getColumn(c).hidden = true
      }
    }
    const gsFin = wb.getWorksheet("GS FIN")
    if (gsFin) {
      gsFin.getCell(7, 3).value = "CLASS STANDING 40%"
      for (let c = 14; c <= 22; c++) {
        gsFin.getCell(7, c).value = ""
        gsFin.getColumn(c).hidden = true
      }
    }
  }

  wb.calcProperties = { fullCalcOnLoad: true }

  // Remove sheet protection so all cells are editable in the exported file
  for (const sheet of wb.worksheets) {
    sheet.sheetProtection = null
  }

  for (const sheetName of ["LOOKUP", "PERCENTAGE"]) {
    const sheet = wb.getWorksheet(sheetName)
    if (sheet) sheet.state = "hidden"
  }

  const sectionSlug = String(section ?? "").replace(/[^a-zA-Z0-9-]/g, "_")
  const filename = `Class Record - ${sectionSlug}.xlsx`

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
