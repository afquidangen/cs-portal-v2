import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { gradingTemplateRepository } from "@/features/portal/repositories/grading-template.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { gradeCategoryMatches } from "@/features/portal/lib/grade-engine"
import { analyzeWorkbook, type AutoMapping } from "@/features/portal/lib/excel-import-engine"
import * as XLSX from "xlsx"

export const runtime = "nodejs"

export type ColumnMapping = {
  sourceName: string
  targetRole: "studentName" | "studentId" | "section" | "grade"
  gradeCategory?: string
  maxScore?: number
  skip: boolean
}

const CATEGORY_LABEL_REGEX = /\s*-?\s*\d+%\s*$/

function parseStudentName(name: string): { lastName: string; firstName: string; middleName: string } {
  const parts = name.split(",").map((s) => s.trim())
  if (parts.length >= 2 && parts[0]) {
    const lastName = parts[0]
    const names = parts[1].split(/\s+/).filter(Boolean)
    const firstName = names[0] || ""
    const middleName = names.slice(1).join(" ") || ""
    return { lastName, firstName, middleName }
  }
  const names = name.split(/\s+/).filter(Boolean)
  if (names.length >= 2) {
    return { lastName: names[names.length - 1], firstName: names[0], middleName: names.slice(1, -1).join(" ") }
  }
  return { lastName: name, firstName: "", middleName: "" }
}

function normalizeCategory(rawLabel: string): string {
  const cleaned = rawLabel.replace(CATEGORY_LABEL_REGEX, "").trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ")
  return cleaned === "recitation" ? "performance recitation" : cleaned
}

function inferGradeCategory(normalized: string): string {
  if (gradeCategoryMatches("quizzes", normalized)) return "Quizzes"
  if (gradeCategoryMatches("performance", normalized) || gradeCategoryMatches("recitation", normalized)) return "Performance"
  if (gradeCategoryMatches("assignment", normalized)) return "Assignments"
  if (gradeCategoryMatches("exam", normalized)) return "Exam"
  if (gradeCategoryMatches("exercise", normalized)) return "Exercises"
  if (gradeCategoryMatches("work attitude", normalized)) return "Work Attitude"
  if (gradeCategoryMatches("project", normalized)) return "Project"
  if (gradeCategoryMatches("attendance", normalized) || normalized === "atten" || normalized === "attend") return "Attendance"
  return "Custom"
}

type AssessmentColInfo = {
  colIndex: number
  name: string
  category: string
  maxScore: number
  gradingPeriod: "midterm" | "final"
}

async function importClassRecord(
  worksheet: XLSX.WorkSheet,
  classId: string,
  subject: string,
  subjectCode: string
): Promise<{ gradesUpdated: number; columnsCreated: number; errors: string[] }> {
  const allRows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(worksheet, { header: 1, defval: "" })

  // Find FINALS boundary in row 3 (index 2)
  const row3 = allRows[2] ?? []
  let finalsCol = allRows[0]?.length ?? 100
  for (let c = 0; c < row3.length; c++) {
    if (String(row3[c] ?? "").trim().toUpperCase() === "FINALS") {
      finalsCol = c
      break
    }
  }

  const row5 = allRows[4] ?? []   // HPS (0-indexed: row 5 → index 4)
  const row7 = allRows[6] ?? []   // Category labels
  const row9 = allRows[8] ?? []   // Assessment numbers / column headers

  // Detect assessment columns
  const assessmentCols: AssessmentColInfo[] = []
  for (let c = 2; c < row9.length; c++) { // start from column C (index 2)
    const r9Val = row9[c]
    if (typeof r9Val !== "number" || r9Val < 1 || r9Val > 10) continue

    const r7Label = String(row7[c] ?? "").trim()
    if (!r7Label) continue

    const normalized = normalizeCategory(r7Label)

    // Skip computed/special categories
    if (["cs", "mg", "fg", "transmuted", "remarks"].includes(normalized)) continue
    if (gradeCategoryMatches("exam", normalized)) continue
    if (gradeCategoryMatches("attendance", normalized) || ["atten", "attend"].includes(normalized)) continue

    const category = inferGradeCategory(normalized)
    const gradingPeriod: "midterm" | "final" = c < finalsCol ? "midterm" : "final"

    assessmentCols.push({
      colIndex: c,
      name: String(r9Val),
      category,
      maxScore: typeof row5[c] === "number" ? row5[c] as number : 100,
      gradingPeriod,
    })
  }

  // Load existing grade columns for this class
  const allExistingCols = await gradeColumnRepository.findAll({ classId }) as Array<{
    id: string; name: string; displayName?: string; category: string; maxScore: number; order: number; gradingPeriod: string
  }>

  // Create or match grade columns
  const createdColumns: string[] = []
  const columnMap = new Map<number, string>() // template column index → grade column name (scores key)

  for (const ac of assessmentCols) {
    // Try to find existing column by (displayName + category + gradingPeriod)
    const existing = allExistingCols.find((c) =>
      (c.name === ac.name || c.displayName === ac.name) &&
      gradeCategoryMatches(c.category, ac.category) &&
      c.gradingPeriod === ac.gradingPeriod
    )

    if (existing) {
      columnMap.set(ac.colIndex, existing.name)
      continue
    }

    // Check if another column has same name in same period but different category (collision)
    const collision = allExistingCols.some((c) =>
      c.name === ac.name && c.gradingPeriod === ac.gradingPeriod && !gradeCategoryMatches(c.category, ac.category)
    )
    const colName = collision ? `${ac.name}-${ac.category.toLowerCase().replace(/\s+/g, "")}` : ac.name

    const maxOrder = allExistingCols.reduce((max, c) => Math.max(max, c.order ?? 0), 0)
    const newCol = await gradeColumnRepository.create({
      id: `COL-${Date.now()}-${createdColumns.length}`,
      classId,
      name: colName,
      displayName: ac.name,
      category: inferGradeCategory(ac.category),
      maxScore: ac.maxScore,
      order: maxOrder + 1 + createdColumns.length,
      gradingPeriod: ac.gradingPeriod,
    })
    createdColumns.push(colName)
    columnMap.set(ac.colIndex, colName)

    // Add to existing columns list for subsequent collision checks
    allExistingCols.push(newCol as typeof allExistingCols[0])
  }

  // Load existing grades for name matching
  const existingGrades = await gradesRepository.findAll({ classId }) as Array<{
    id: string; studentId: string; student: string; scores: Record<string, number>
  }>
  const gradeByNormalizedName = new Map<string, typeof existingGrades[0]>()
  for (const g of existingGrades) {
    const parsed = parseStudentName(g.student || "")
    const key = `${parsed.lastName}|${parsed.firstName}`.toLowerCase().replace(/[^a-z|]/g, "")
    if (key !== "|") gradeByNormalizedName.set(key, g)
  }

  // Process data rows (starting from row 10, index 9)
  const errors: string[] = []
  let importedCount = 0

  for (let r = 9; r < allRows.length; r++) {
    const row = allRows[r]
    if (!row || row.length < 2) continue

    const rawName = String(row[1] ?? "").trim()
    if (!rawName) continue

    const parsedName = parseStudentName(rawName)
    const lookupKey = `${parsedName.lastName}|${parsedName.firstName}`.toLowerCase().replace(/[^a-z|]/g, "")
    const matchedGrade = gradeByNormalizedName.get(lookupKey)
    const actualStudentId = matchedGrade?.studentId ?? `STU-${Date.now()}-${r}`
    const actualStudentName = matchedGrade?.student ?? rawName

    const scores: Record<string, number> = {}
    for (const ac of assessmentCols) {
      const colName = columnMap.get(ac.colIndex)
      if (!colName) continue
      const rawVal = row[ac.colIndex]
      const num = rawVal !== undefined && rawVal !== "" ? Number(rawVal) : 0
      scores[colName] = isNaN(num) ? 0 : num
    }

    if (Object.keys(scores).length === 0) continue

    try {
      await gradesRepository.upsert(
        { classId, studentId: actualStudentId },
        {
          id: matchedGrade?.id ?? `GRD-${Date.now()}-${r}`,
          classId,
          studentId: actualStudentId,
          student: actualStudentName,
          section: "",
          scores: matchedGrade ? { ...matchedGrade.scores, ...scores } : scores,
          subject,
          code: subjectCode,
          workflowStatus: "Draft",
          released: false,
          updatedAt: new Date().toISOString(),
        }
      )
      importedCount++
    } catch {
      errors.push(`Failed to import grade for "${rawName}".`)
    }
  }

  return { gradesUpdated: importedCount, columnsCreated: createdColumns.length, errors }
}

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { fileBase64, sheetName, classId, columnMapping, autoImport, saveAsTemplate } = body as {
      fileBase64: string
      sheetName: string
      classId: string
      columnMapping?: ColumnMapping[]
      autoImport?: boolean
      subject?: string
      subjectCode?: string
      saveAsTemplate?: { name: string }
    }

    if (!fileBase64 || !classId) {
      return badRequest("fileBase64 and classId are required.")
    }

    const buffer = Buffer.from(fileBase64, "base64")

    // Determine target sheet, preferring CLASS RECORD
    let targetSheet = sheetName
    const analysis = analyzeWorkbook(buffer)
    const classRecord = analysis.sheets.find((s) => s.sheetName === "CLASS RECORD")
    if (classRecord) {
      targetSheet = classRecord.sheetName
    }
    if (!targetSheet) {
      targetSheet = analysis.sheets[0]?.sheetName
    }
    if (!targetSheet) return badRequest("No sheets found in workbook.")

    const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellDates: true })
    const worksheet = workbook.Sheets[targetSheet]
    if (!worksheet) return badRequest(`Sheet "${targetSheet}" not found.`)

    // Use CLASS RECORD parser when importing from that sheet
    if (targetSheet === "CLASS RECORD") {
      const result = await importClassRecord(
        worksheet,
        classId,
        body.subject ?? "",
        body.subjectCode ?? ""
      )

      let template: { id: string; name: string } | undefined
      if (saveAsTemplate?.name) {
        const existingTemplates = await gradingTemplateRepository.findAll({
          classId, name: saveAsTemplate.name,
        }) as Array<{ id: string }>
        if (existingTemplates.length === 0) {
          const tpl = await gradingTemplateRepository.create({
            id: `TPL-${Date.now()}`,
            name: saveAsTemplate.name,
            classId,
            subjectType: "Lecture",
            columns: [],
          })
          template = tpl as { id: string; name: string }
        }
      }

      return success({ ...result, template })
    }

    // Fallback: generic import for non-CLASS RECORD sheets
    let mapping: ColumnMapping[]

    if (autoImport) {
      const sheet = analysis.sheets.find((s) => s.sheetName === targetSheet)
      if (!sheet) return badRequest(`Sheet "${targetSheet}" not found.`)
      mapping = buildMappingFromAuto(sheet.autoMapping)
    } else if (columnMapping) {
      mapping = columnMapping
    } else {
      return badRequest("Either columnMapping or autoImport must be provided.")
    }

    const gradeColumns = mapping.filter((m) => m.targetRole === "grade" && !m.skip)
    const nameCol = mapping.find((m) => m.targetRole === "studentName" && !m.skip)
    const sectionCol = mapping.find((m) => m.targetRole === "section" && !m.skip)

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" })
    const createdColumns: string[] = []
    const importedCounts: Record<string, number> = {}

    const allExistingCols = await gradeColumnRepository.findAll({ classId }) as Array<{
      id: string; name: string; displayName?: string; order: number
    }>
    const existingColNames = new Set(allExistingCols.map((c) => c.name))
    const existingColDisplayNames = new Set(allExistingCols.filter((c) => c.displayName).map((c) => c.displayName))

    for (const gc of gradeColumns) {
      const alreadyExists = existingColNames.has(gc.sourceName) || existingColDisplayNames.has(gc.sourceName)
      if (!alreadyExists) {
        const maxOrder = allExistingCols.reduce((max, col) => Math.max(max, col.order ?? 0), 0)
        await gradeColumnRepository.create({
          id: `COL-${Date.now()}-${createdColumns.length}`,
          classId,
          name: gc.sourceName,
          displayName: gc.sourceName,
          category: gc.gradeCategory ?? "Custom",
          maxScore: gc.maxScore ?? 100,
          order: maxOrder + 1 + createdColumns.length,
        })
        createdColumns.push(gc.sourceName)
      }
    }

    const existingGrades = await gradesRepository.findAll({ classId }) as Array<{
      id: string; studentId: string; student: string; scores: Record<string, number>
    }>
    const gradeByNormalizedName = new Map<string, typeof existingGrades[0]>()
    for (const g of existingGrades) {
      const parsed = parseStudentName(g.student || "")
      const key = `${parsed.lastName}|${parsed.firstName}`.toLowerCase().replace(/[^a-z|]/g, "")
      if (key !== "|") gradeByNormalizedName.set(key, g)
    }

    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rawName = nameCol ? (row[nameCol.sourceName]?.toString()?.trim() ?? "") : ""
      const section = sectionCol ? (row[sectionCol.sourceName]?.toString()?.trim() ?? "") : ""

      if (!rawName) {
        errors.push(`Row ${i + 2}: No student name found, skipped.`)
        continue
      }

      const parsedName = parseStudentName(rawName)
      const lookupKey = `${parsedName.lastName}|${parsedName.firstName}`.toLowerCase().replace(/[^a-z|]/g, "")
      const matchedGrade = gradeByNormalizedName.get(lookupKey)
      const actualStudentId = matchedGrade?.studentId ?? `STU-${Date.now()}-${i}`
      const actualStudentName = matchedGrade?.student ?? rawName

      const scores: Record<string, number> = {}
      for (const gc of gradeColumns) {
        const rawVal = row[gc.sourceName]
        const num = rawVal !== undefined && rawVal !== "" ? Number(rawVal) : 0
        scores[gc.sourceName] = isNaN(num) ? 0 : num
      }

      try {
        await gradesRepository.upsert(
          { classId, studentId: actualStudentId },
          {
            id: matchedGrade?.id ?? `GRD-${Date.now()}-${i}`,
            classId,
            studentId: actualStudentId,
            student: actualStudentName,
            section: section || "",
            scores: matchedGrade ? { ...matchedGrade.scores, ...scores } : scores,
            subject: body.subject ?? "",
            code: body.subjectCode ?? "",
            workflowStatus: "Draft",
            released: false,
            updatedAt: new Date().toISOString(),
          }
        )
        importedCounts[actualStudentId] = Object.keys(scores).length
      } catch {
        errors.push(`Row ${i + 2}: Failed to import grade for "${rawName}".`)
      }
    }

    let template: { id: string; name: string } | undefined
    if (saveAsTemplate?.name) {
      const existingTemplates = await gradingTemplateRepository.findAll({
        classId, name: saveAsTemplate.name,
      }) as Array<{ id: string }>
      if (existingTemplates.length === 0) {
        const tpl = await gradingTemplateRepository.create({
          id: `TPL-${Date.now()}`,
          name: saveAsTemplate.name,
          classId,
          subjectType: "Lecture",
          columns: gradeColumns.map((gc, idx) => ({
            name: gc.sourceName,
            category: gc.gradeCategory ?? "Custom",
            maxScore: gc.maxScore ?? 100,
            order: idx + 1,
          })),
        })
        template = tpl as { id: string; name: string }
      }
    }

    return success({
      gradesUpdated: Object.keys(importedCounts).length,
      columnsCreated: createdColumns.length,
      template,
      errors,
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to execute import.")
  }
}

function buildMappingFromAuto(auto: AutoMapping): ColumnMapping[] {
  const mapping: ColumnMapping[] = []
  if (auto.studentNameCol) {
    mapping.push({ sourceName: auto.studentNameCol, targetRole: "studentName", skip: false })
  }
  if (auto.studentIdCol) {
    mapping.push({ sourceName: auto.studentIdCol, targetRole: "studentId", skip: false })
  }
  if (auto.sectionCol) {
    mapping.push({ sourceName: auto.sectionCol, targetRole: "section", skip: false })
  }
  for (const gc of auto.gradeCols) {
    mapping.push({
      sourceName: gc.sourceName, targetRole: "grade",
      gradeCategory: gc.gradeCategory, maxScore: gc.maxScore, skip: false,
    })
  }
  for (const s of auto.skipCols) {
    mapping.push({ sourceName: s, targetRole: "grade", skip: true })
  }
  return mapping
}
