import ExcelJS from "exceljs"
import path from "path"
import fs from "fs"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { usersRepository } from "@/features/portal/repositories/users.repository"
import { gradeCategoryMatches, computeLivePreview } from "@/features/portal/lib/grade-engine"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import type { GradeRecord } from "@/lib/types/grade"
import type { GradeColumn } from "@/lib/types/grade-column"
import type { Assessment } from "@/lib/types/assessment"
import type { GradingScheme } from "@/lib/types/grading-scheme"

const TEMPLATES_DIR = path.join(process.cwd(), "templates")
const TEMPLATE_FILE = "2SSY2526 CS4A IAS Class Record (gsheetv4.2).xlsx"

// Fallback grading schemes matching grades-module.tsx grid behavior
const DEFAULT_LECTURE_SCHEME: GradingScheme = {
  id: "GS-DEFAULT-LECTURE",
  name: "Default Lecture",
  subjectType: "Lecture",
  isDefault: true,
  isActive: true,
  components: [
    { name: "Class Standing", weight: 60, categories: [{ name: "Quizzes", weight: 25 }, { name: "Performance", weight: 25 }, { name: "Assignments", weight: 25 }, { name: "Attendance", weight: 25 }] },
    { name: "Exam", weight: 40, categories: [{ name: "Exam", weight: 100 }] },
  ],
  createdAt: "",
  updatedAt: "",
}

const DEFAULT_LAB_SCHEME: GradingScheme = {
  id: "GS-DEFAULT-LAB",
  name: "Default Lecture with Lab",
  subjectType: "Lecture with Lab",
  isDefault: true,
  isActive: true,
  lectureWeight: 40,
  laboratoryWeight: 60,
  components: [
    { name: "Lecture Class Standing", weight: 60, categories: [{ name: "Quizzes", weight: 10 }, { name: "Performance", weight: 30 }, { name: "Assignments", weight: 30 }, { name: "Attendance", weight: 30 }] },
    { name: "Lecture Exam", weight: 40, categories: [{ name: "Exam", weight: 100 }] },
  ],
  labComponents: [
    { name: "Laboratory", weight: 100, categories: [{ name: "Exercises", weight: 35 }, { name: "Work Attitude", weight: 35 }, { name: "Project", weight: 15 }, { name: "Attendance", weight: 15 }] },
  ],
  createdAt: "",
  updatedAt: "",
}

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
  cs60Col?: number
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
  const row6Lbl = (c: number): unknown => sheet.getCell(6, c).value
  const row9Val = (c: number): unknown => sheet.getCell(9, c).value

  let col = startCol
  while (col <= endCol) {
    let label = row7Lbl(col)
    if (label == null) label = row6Lbl(col)
    if (label == null) {
      col++
      continue
    }

    let regionEnd = col
    while (regionEnd < endCol) {
      let nextLabel = row7Lbl(regionEnd + 1)
      if (nextLabel == null) nextLabel = row6Lbl(regionEnd + 1)
      if (nextLabel === label) regionEnd++
      else break
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

    if (
      normalized === "cs" || normalized.startsWith("cs ") ||
      normalized === "class standing" || normalized.startsWith("class standing ") ||
      normalized === "mg" || normalized.startsWith("mg ") ||
      normalized === "fg" || normalized.startsWith("fg ")
    ) {
      if (normalized === "cs" || normalized.startsWith("cs ")) map.cs60Col = col
      else if (normalized === "class standing" || normalized.startsWith("class standing ")) map.csCol = col
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

function getAbsences(grade: GradeRecord, period: string, lab: boolean = false): number {
  for (const [key, val] of Object.entries(grade.scores ?? {})) {
    if (key.startsWith(`${period}_absences_`)) {
      const suffix = key.replace(`${period}_absences_`, "").toLowerCase()
      const isLab = suffix.includes("lab") || suffix.includes("laboratory")
      if (lab === isLab) return Number(val) || 0
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
  preview?: { classStanding: number; lectureGrade: number; periodGrade: number; categoryGrades?: Array<{ category: string; totalStudentScore: number; totalPossibleScore: number }>; laboratoryGrade?: number } | null,
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

  const absences = getAbsences(grade, period, false)

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
      const col = items[j]
      const score = grade.scores?.[col.id] ?? grade.scores?.[`${col.gradingPeriod}_${col.name}`] ?? grade.scores?.[col.name]
      sheet.getCell(rowIdx, targetCol).value = score ?? null
      if (rowIdx <= 12 && cat.alias === "project") {
        console.log(`[EXPORT DIAG] Writing project raw score: row ${rowIdx} col ${targetCol} = ${score}`)
      }
    }
    // Write Project's 15% contribution to the second item column
    if (cat.alias === "project" && cat.itemColumns.length >= 2 && items.length > 0) {
      let totalStudentScore = 0
      let totalPossibleScore = 0
      for (const item of items) {
        const s = grade.scores?.[item.id] ?? grade.scores?.[`${item.gradingPeriod}_${item.name}`] ?? grade.scores?.[item.name]
        if (s != null) totalStudentScore += Number(s)
        totalPossibleScore += item.maxScore ?? 0
      }
      if (totalPossibleScore > 0) {
        const ps = totalStudentScore / totalPossibleScore
        const pct = ps * 50 + 50
        sheet.getCell(rowIdx, cat.itemColumns[1]).value = pct * 0.15
      }
    }
    // Write Project's weighted score to its WS column ((raw/max × 50 + 50) × 15%)
    else if (cat.alias === "project" && cat.wsCol != null && items.length > 0) {
      let totalStudentScore = 0
      let totalPossibleScore = 0
      for (const item of items) {
        const s = grade.scores?.[item.id] ?? grade.scores?.[`${item.gradingPeriod}_${item.name}`] ?? grade.scores?.[item.name]
        if (s != null) totalStudentScore += Number(s)
        totalPossibleScore += item.maxScore ?? 0
      }
      if (totalPossibleScore > 0) {
        const ps = totalStudentScore / totalPossibleScore
        const pct = ps * 50 + 50
        sheet.getCell(rowIdx, cat.wsCol).value = pct * 0.15
      }
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
      let totalRaw = 0
      let found = false
      for (const item of examItems) {
        const s = grade.scores?.[item.id] ?? grade.scores?.[`${period}_${item.name}`] ?? grade.scores?.[item.name]
        if (s != null) { totalRaw += Number(s); found = true }
      }
      sheet.getCell(rowIdx, periodMap.examCol).value = found ? totalRaw : null
    }
  }

  if (periodMap.absencesCol != null) {
    sheet.getCell(rowIdx, periodMap.absencesCol).value = absences || null
  }

  if (periodMap.labAbsencesCol != null) {
    const labAbsences = getAbsences(grade, period, true)
    sheet.getCell(rowIdx, periodMap.labAbsencesCol).value = labAbsences || null
  }

  if (period === "midterm") {
    if (periodMap.csCol != null) {
      sheet.getCell(rowIdx, periodMap.csCol).value = preview?.lectureGrade ?? grade.lectureGrade ?? (grade.midtermClassStanding != null && grade.midtermExam != null
        ? (grade.midtermClassStanding * 60 + grade.midtermExam * 40) / 100
        : null)
    }
    if (periodMap.cs60Col != null) {
      const cs60Val = preview?.classStanding != null ? preview.classStanding * 0.60 : grade.midtermClassStanding != null ? grade.midtermClassStanding * 0.60 : null
      sheet.getCell(rowIdx, periodMap.cs60Col).value = cs60Val
    }
    if (periodMap.examCol != null) {
      sheet.getCell(rowIdx, periodMap.examCol + 1).value = grade.midtermExam != null ? grade.midtermExam * 0.40 : null
    }
    if (periodMap.totalCol != null) {
      const totalVal = preview?.lectureGrade ?? grade.lectureGrade ??
        (grade.midtermClassStanding != null && grade.midtermExam != null
          ? (grade.midtermClassStanding * 60 + grade.midtermExam * 40) / 100
          : null)
      sheet.getCell(rowIdx, periodMap.totalCol).value = totalVal
    }
    if (periodMap.periodGradeCol != null) {
      sheet.getCell(rowIdx, periodMap.periodGradeCol).value = grade.midtermGrade ?? null
    }
    if (periodMap.transmutedCol != null) sheet.getCell(rowIdx, periodMap.transmutedCol).value = grade.midtermTransmuted ?? null
    if (periodMap.remarksCol != null) sheet.getCell(rowIdx, periodMap.remarksCol).value = grade.midtermRemarks ?? ""
    if (periodMap.labTotalCol != null) sheet.getCell(rowIdx, periodMap.labTotalCol).value = grade.midtermLaboratoryGrade ?? null
    if (periodMap.labAttendanceCol != null) {
      if (preview?.categoryGrades) {
        const labAtt = [...preview.categoryGrades].reverse().find(c => c.category.toLowerCase().includes("attendance"))
        if (labAtt) {
          if (rowIdx <= 12) console.log(`[EXPORT DIAG] midterm row ${rowIdx}: category="${labAtt.category}" totalStudentScore=${labAtt.totalStudentScore}`)
          sheet.getCell(rowIdx, periodMap.labAttendanceCol).value = labAtt.totalStudentScore
          if (rowIdx <= 12) console.log(`[EXPORT DIAG] midterm row ${rowIdx}: wrote to col ${periodMap.labAttendanceCol}`)
        } else if (rowIdx <= 12) {
          console.log(`[EXPORT DIAG] midterm row ${rowIdx}: NO attendance match in categoryGrades:`, preview.categoryGrades.map(c => `${c.category}=${c.totalStudentScore}`))
        }
      } else if (rowIdx <= 12) {
        console.log(`[EXPORT DIAG] midterm row ${rowIdx}: preview or categoryGrades is null - fallback to template formula`)
      }
    }
  } else {
    if (periodMap.csCol != null) {
      sheet.getCell(rowIdx, periodMap.csCol).value = preview?.lectureGrade ?? (grade.finalClassStanding != null && grade.finalExam != null
        ? (grade.finalClassStanding * 60 + grade.finalExam * 40) / 100
        : null)
    }
    if (periodMap.cs60Col != null) {
      const cs60Val = preview?.classStanding != null ? preview.classStanding * 0.60 : grade.finalClassStanding != null ? grade.finalClassStanding * 0.60 : null
      sheet.getCell(rowIdx, periodMap.cs60Col).value = cs60Val
    }
    if (periodMap.totalCol != null) {
      const totalVal = preview?.lectureGrade ??
        (grade.finalClassStanding != null && grade.finalExam != null
          ? (grade.finalClassStanding * 60 + grade.finalExam * 40) / 100
          : null)
      sheet.getCell(rowIdx, periodMap.totalCol).value = totalVal
    }
    if (periodMap.periodGradeCol != null) {
      sheet.getCell(rowIdx, periodMap.periodGradeCol).value = grade.tentativeFinalGrade ?? null
    }
    if (periodMap.transmutedCol != null) sheet.getCell(rowIdx, periodMap.transmutedCol).value = grade.finalTransmuted ?? null
    if (periodMap.remarksCol != null) sheet.getCell(rowIdx, periodMap.remarksCol).value = grade.finalRemarks ?? ""
    if (periodMap.labTotalCol != null) sheet.getCell(rowIdx, periodMap.labTotalCol).value = grade.finalLaboratoryGrade ?? null
    if (periodMap.labAttendanceCol != null) {
      if (preview?.categoryGrades) {
        const labAtt = [...preview.categoryGrades].reverse().find(c => c.category.toLowerCase().includes("attendance"))
        if (labAtt) {
          if (rowIdx <= 12) console.log(`[EXPORT DIAG] final row ${rowIdx}: category="${labAtt.category}" totalStudentScore=${labAtt.totalStudentScore}`)
          sheet.getCell(rowIdx, periodMap.labAttendanceCol).value = labAtt.totalStudentScore
          if (rowIdx <= 12) console.log(`[EXPORT DIAG] final row ${rowIdx}: wrote to col ${periodMap.labAttendanceCol}`)
        } else if (rowIdx <= 12) {
          console.log(`[EXPORT DIAG] final row ${rowIdx}: NO attendance match in categoryGrades:`, preview.categoryGrades.map(c => `${c.category}=${c.totalStudentScore}`))
        }
      } else if (rowIdx <= 12) {
        console.log(`[EXPORT DIAG] final row ${rowIdx}: preview or categoryGrades is null - fallback to template formula`)
      }
    }
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
      const totalMax = examItems.reduce((sum, item) => sum + Number(item.maxScore ?? 0), 0)
      sheet.getCell(hpsRow, periodMap.examCol).value = totalMax
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

  const schedule = schedulesData[0] ?? {}
  const hasLabCategories = columns.some(c =>
    gradeCategoryMatches("exercise", c.category) ||
    gradeCategoryMatches("work attitude", c.category) ||
    gradeCategoryMatches("project", c.category)
  )
  const subjectType = hasLabCategories ? "Lecture with Lab" : "Lecture"
  let gradingScheme = await gradingSchemeRepository.findActiveBySubjectType(subjectType) as GradingScheme | null
  if (!gradingScheme) {
    gradingScheme = subjectType === "Lecture with Lab" ? DEFAULT_LAB_SCHEME : DEFAULT_LECTURE_SCHEME
  }
  const assessments = await assessmentRepository.findByClass(classId) as Assessment[]

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
    const col3 = rogSheet.getColumn(3)
    if (col3 && (col3.width ?? 0) < valueWidth) {
      col3.width = valueWidth
    }
    const semWidth = Math.max(headerData.semester.length + 2, 12)
    const col12 = rogSheet.getColumn(12)
    if (col12 && (col12.width ?? 0) < semWidth) {
      col12.width = semWidth
    }
  }

  // Widen dean name column in GS MID and GS FIN footers
  const gsMidSheet = wb.getWorksheet("GS MID")
  const gsMidCol14 = gsMidSheet?.getColumn(14)
  if (gsMidCol14 && (gsMidCol14.width ?? 0) < 30) {
    gsMidCol14.width = 38
  }
  const gsFinSheet = wb.getWorksheet("GS FIN")
  const gsFinCol13 = gsFinSheet?.getColumn(13)
  if (gsFinCol13 && (gsFinCol13.width ?? 0) < 38) {
    gsFinCol13.width = 38
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

  console.log("[EXPORT DIAG] Midterm categories:", midtermMap.categories.map(c => ({ alias: c.alias, itemColumns: c.itemColumns, psCol: c.psCol, wsCol: c.wsCol })))
  console.log("[EXPORT DIAG] Finals categories:", finalsMap.categories.map(c => ({ alias: c.alias, itemColumns: c.itemColumns, psCol: c.psCol, wsCol: c.wsCol })))

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

  const isLabSubject = hasLabCategories || grades.some((g) =>
    g.midtermLaboratoryGrade != null ||
    g.finalLaboratoryGrade != null ||
    g.laboratoryGrade != null
  )

  {
    const dataStartRow = 10

    // Clear template placeholder raw scores from all student data rows
    for (let r = dataStartRow; r <= dataStartRow + 89; r++) {
      for (const cat of midtermMap.categories) {
        for (const c of cat.itemColumns) crSheet.getCell(r, c).value = null
      }
      for (const cat of finalsMap.categories) {
        for (const c of cat.itemColumns) crSheet.getCell(r, c).value = null
      }
      if (midtermMap.examCol != null) crSheet.getCell(r, midtermMap.examCol).value = null
      if (finalsMap.examCol != null) crSheet.getCell(r, finalsMap.examCol).value = null
    }


    const labAttendanceOverrides: Array<{ row: number; col: number; value: number }> = []

    const gsMidSheet = wb.getWorksheet("GS MID")
    const gsFinSheet = wb.getWorksheet("GS FIN")
    const rogSheet = wb.getWorksheet("REPORTS OF GRADE")

    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i]
      const rowIdx = dataStartRow + i

      // Compute live previews matching the grid's logic (period-filtered assessments)
      const scores = grade.scores ?? {}
      const midtermColumns = columns.filter(c => !c.gradingPeriod || c.gradingPeriod === "midterm" || c.gradingPeriod === "both")
      const finalColumns = columns.filter(c => !c.gradingPeriod || c.gradingPeriod === "final" || c.gradingPeriod === "both")
      const midtermAssessments = assessments.filter(a => a.gradingPeriod === "midterm" || a.gradingPeriod === "both").map(a => ({ name: a.name, category: a.category, maxScore: a.maxScore, scores: a.scores }))
      const finalAssessments = assessments.filter(a => a.gradingPeriod === "final" || a.gradingPeriod === "both").map(a => ({ name: a.name, category: a.category, maxScore: a.maxScore, scores: a.scores }))

      const midtermPreview = gradingScheme ? computeLivePreview({
        scores,
        columns: midtermColumns,
        assessments: midtermAssessments,
        studentId: grade.studentId,
        components: gradingScheme.components,
        labComponents: gradingScheme.labComponents,
        subjectType: gradingScheme.subjectType,
        lectureWeight: gradingScheme.lectureWeight,
        laboratoryWeight: gradingScheme.laboratoryWeight,
        period: "midterm",
      }) : null

      const finalPreview = gradingScheme ? computeLivePreview({
        scores,
        columns: finalColumns,
        assessments: finalAssessments,
        studentId: grade.studentId,
        components: gradingScheme.components,
        labComponents: gradingScheme.labComponents,
        subjectType: gradingScheme.subjectType,
        lectureWeight: gradingScheme.lectureWeight,
        laboratoryWeight: gradingScheme.laboratoryWeight,
        midtermGrade: grade.midtermGrade,
        period: "final",
      }) : null

      crSheet.getCell(rowIdx, 1).value = i + 1
      crSheet.getCell(rowIdx, 2).value = formatStudentName(grade.student ?? "")
      crSheet.getCell(rowIdx, 3).value = sexMap.get(grade.studentId) ?? ""

      populatePeriodSection(crSheet, grade, columns, rowIdx, midtermMap, "midterm", midtermPreview)
      populatePeriodSection(crSheet, grade, columns, rowIdx, finalsMap, "final", finalPreview)

      if (midtermPreview?.categoryGrades && midtermMap.labAttendanceCol != null) {
        const labAtt = [...midtermPreview.categoryGrades].reverse().find(c => c.category.toLowerCase().includes("attendance"))
        if (labAtt) labAttendanceOverrides.push({ row: rowIdx, col: midtermMap.labAttendanceCol, value: labAtt.totalStudentScore })
      }
      if (finalPreview?.categoryGrades && finalsMap.labAttendanceCol != null) {
        const labAtt = [...finalPreview.categoryGrades].reverse().find(c => c.category.toLowerCase().includes("attendance"))
        if (labAtt) labAttendanceOverrides.push({ row: rowIdx, col: finalsMap.labAttendanceCol, value: labAtt.totalStudentScore })
      }

      if (grade.finalGrade != null && grade.finalGrade > 0) {
        crSheet.getCell(rowIdx, 154).value = grade.midtermGrade ?? null
        crSheet.getCell(rowIdx, 155).value = grade.tentativeFinalGrade ?? null
        crSheet.getCell(rowIdx, 156).value = Math.round(Number(grade.finalGrade))
        crSheet.getCell(rowIdx, 157).value = grade.transmutedGrade ?? null
        crSheet.getCell(rowIdx, 158).value = grade.finalGrade ?? null
        crSheet.getCell(rowIdx, 159).value = grade.remarks ?? ""
      }

      // --- Directly populate GS MID, GS FIN, and REPORTS OF GRADE ---
      // (bypasses broken cross-sheet formulas that reference wrong columns)

      if (gsMidSheet) {
        const gsR = 9 + i
        gsMidSheet.getCell(gsR, 1).value = i + 1
        gsMidSheet.getCell(gsR, 2).value = formatStudentName(grade.student ?? "")
        const cs60 = midtermPreview?.classStanding != null
          ? midtermPreview.classStanding * 0.60
          : grade.midtermClassStanding != null
            ? grade.midtermClassStanding * 0.60 : null
        gsMidSheet.getCell(gsR, 11).value = cs60
        gsMidSheet.getCell(gsR, 12).value = grade.midtermExam != null ? grade.midtermExam * 0.40 : null
        gsMidSheet.getCell(gsR, 13).value = midtermPreview?.lectureGrade ??
          (grade.midtermClassStanding != null && grade.midtermExam != null
            ? (grade.midtermClassStanding * 60 + grade.midtermExam * 40) / 100 : null)
        gsMidSheet.getCell(gsR, 23).value = grade.midtermTransmuted ?? null
        gsMidSheet.getCell(gsR, 24).value = grade.midtermGrade ?? null
      }

      if (gsFinSheet) {
        const gsR = 9 + i
        gsFinSheet.getCell(gsR, 1).value = i + 1
        gsFinSheet.getCell(gsR, 2).value = formatStudentName(grade.student ?? "")
        const cs60 = finalPreview?.classStanding != null
          ? finalPreview.classStanding * 0.60
          : grade.finalClassStanding != null
            ? grade.finalClassStanding * 0.60 : null
        gsFinSheet.getCell(gsR, 11).value = cs60
        gsFinSheet.getCell(gsR, 12).value = grade.finalExam != null ? grade.finalExam * 0.40 : null
        gsFinSheet.getCell(gsR, 13).value = finalPreview?.lectureGrade ??
          (grade.finalClassStanding != null && grade.finalExam != null
            ? (grade.finalClassStanding * 60 + grade.finalExam * 40) / 100 : null)
        gsFinSheet.getCell(gsR, 23).value = grade.finalTransmuted ?? null
        gsFinSheet.getCell(gsR, 24).value = grade.tentativeFinalGrade ?? null
      }

      if (rogSheet) {
        const rogGroup = i % 3
        const rogRow = 12 + Math.floor(i / 3)
        const rogOff = rogGroup * 15
        rogSheet.getCell(rogRow, 1 + rogOff).value = i + 1
        rogSheet.getCell(rogRow, 2 + rogOff).value = formatStudentName(grade.student ?? "")
        rogSheet.getCell(rogRow, 5 + rogOff).value = headerData.section
        rogSheet.getCell(rogRow, 7 + rogOff).value = grade.midtermGrade ?? null
        rogSheet.getCell(rogRow, 8 + rogOff).value = grade.tentativeFinalGrade ?? null
        rogSheet.getCell(rogRow, 9 + rogOff).value = grade.finalGrade ?? null
        rogSheet.getCell(rogRow, 13 + rogOff).value = grade.transmutedGrade ?? null
        rogSheet.getCell(rogRow, 15 + rogOff).value = grade.remarks ?? ""
      }
    }

    // Clear template placeholder HPS from row 5 (prevents ghost max scores)
    for (const cat of midtermMap.categories) {
      for (const c of cat.itemColumns) crSheet.getCell(5, c).value = null
    }
    for (const cat of finalsMap.categories) {
      for (const c of cat.itemColumns) crSheet.getCell(5, c).value = null
    }
    if (midtermMap.examCol != null) crSheet.getCell(5, midtermMap.examCol).value = null
    if (finalsMap.examCol != null) crSheet.getCell(5, finalsMap.examCol).value = null

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
        crSheet.getCell(6, firstCatStart).value = "CLASS STANDING - 60%"
      }
      if (midtermMap.labStartCol != null) {
        crSheet.getCell(6, midtermMap.labStartCol).value = ""
      }

      if (finalsMap.categories.length > 0) {
        const finalsFirstCatStart = finalsMap.categories[0].itemColumns[0] ?? finalsMap.examCol ?? finalsStartCol
        crSheet.getCell(6, finalsFirstCatStart).value = "CLASS STANDING - 60%"
      }
      if (finalsMap.labStartCol != null) {
        crSheet.getCell(6, finalsMap.labStartCol).value = ""
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
          // Skip item, PS, and WS columns — preserve manually written values and formulas
          const isItemOrWsOrPsCol = [...midtermMap.categories, ...finalsMap.categories].some(cat =>
            cat.itemColumns.includes(c) || cat.wsCol === c || cat.psCol === c
          )
          if (isItemOrWsOrPsCol) {
            if (r <= 12) console.log(`[EXPORT DIAG] Skipping shared formula override at row ${r} col ${c} (item/PS/WS column)`)
            continue
          }
          if (r <= 12 && (c === (midtermMap.labAttendanceCol ?? 0) || c === (midtermMap.labTotalCol ?? 0) || c === (finalsMap.labAttendanceCol ?? 0) || c === (finalsMap.labTotalCol ?? 0))) {
            console.log(`[EXPORT DIAG] sharedFormulaOverride row ${r} col ${c}: cachedResult=${cellModel.result}`)
          }
          cell.value = cellModel.result as import("exceljs").CellValue
        }
      }
    }

    // Re-apply lab attendance overrides that may have been overwritten by shared formula cache
    for (const override of labAttendanceOverrides) {
      crSheet.getCell(override.row, override.col).value = override.value
    }

    // Readback check after shared formula processing
    for (let r = dataStartRow; r <= Math.min(dataStartRow + 2, dataStartRow + grades.length - 1); r++) {
      if (midtermMap.labAttendanceCol != null) {
        const v = crSheet.getCell(r, midtermMap.labAttendanceCol).value
        console.log(`[EXPORT DIAG] FINAL midterm row ${r} col ${midtermMap.labAttendanceCol}: ${JSON.stringify(v)}`)
      }
      if (midtermMap.labTotalCol != null) {
        const v = crSheet.getCell(r, midtermMap.labTotalCol).value
        console.log(`[EXPORT DIAG] FINAL midterm row ${r} col ${midtermMap.labTotalCol}: ${JSON.stringify(v)}`)
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
      gsMid.getCell(7, 4).value = "CLASS STANDING 60%"
      for (let c = 15; c <= 23; c++) {
        gsMid.getCell(7, c).value = ""
        gsMid.getColumn(c).hidden = true
      }
    }
    const gsFin = wb.getWorksheet("GS FIN")
    if (gsFin) {
      gsFin.getCell(7, 3).value = "CLASS STANDING 60%"
      for (let c = 14; c <= 22; c++) {
        gsFin.getCell(7, c).value = ""
        gsFin.getColumn(c).hidden = true
      }
    }
  }

  wb.calcProperties = { fullCalcOnLoad: true }

  // Clear cached formula results in GS MID, GS FIN, and REPORTS OF GRADE
  // so Excel recalculates from the populated CLASS RECORD data
  for (const sheetName of ["GS MID", "GS FIN", "REPORTS OF GRADE"]) {
    const sheet = wb.getWorksheet(sheetName)
    if (!sheet) continue
    for (let r = 1; r <= sheet.rowCount; r++) {
      for (let c = 1; c <= sheet.columnCount; c++) {
        const cell = sheet.getCell(r, c)
        if (cell.formula) {
          cell.value = { formula: cell.formula as string }
        }
      }
    }
  }

  // Remove sheet protection so all cells are editable in the exported file
  for (const sheet of wb.worksheets) {
    (sheet as any).sheetProtection = null
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
