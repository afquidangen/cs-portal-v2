import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { gradingTemplateRepository } from "@/features/portal/repositories/grading-template.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
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

    if (!fileBase64 || !sheetName || !classId) {
      return badRequest("fileBase64, sheetName, and classId are required.")
    }

    const buffer = Buffer.from(fileBase64, "base64")

    let mapping: ColumnMapping[]

    if (autoImport) {
      const analysis = analyzeWorkbook(buffer)
      const sheet = analysis.sheets.find((s) => s.sheetName === sheetName)
      if (!sheet) return badRequest(`Sheet "${sheetName}" not found.`)

      mapping = buildMappingFromAuto(sheet.autoMapping)
    } else if (columnMapping) {
      mapping = columnMapping
    } else {
      return badRequest("Either columnMapping or autoImport must be provided.")
    }

    const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellDates: true })
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return badRequest(`Sheet "${sheetName}" not found.`)
    }

    const gradeColumns = mapping.filter((m) => m.targetRole === "grade" && !m.skip)
    const idCol = mapping.find((m) => m.targetRole === "studentId" && !m.skip)
    const nameCol = mapping.find((m) => m.targetRole === "studentName" && !m.skip)
    const sectionCol = mapping.find((m) => m.targetRole === "section" && !m.skip)

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "" })
    const createdColumns: string[] = []
    const importedCounts: Record<string, number> = {}

    for (const gc of gradeColumns) {
      const existing = await gradeColumnRepository.findAll({
        classId,
        name: gc.sourceName,
      }) as Array<{ id: string }>

      if (existing.length === 0) {
        const allExisting = await gradeColumnRepository.findAll({ classId }) as Array<{ order: number }>
        const maxOrder = allExisting.reduce((max: number, col: { order: number }) =>
          Math.max(max, col.order ?? 0), 0)

        await gradeColumnRepository.create({
          id: `COL-${Date.now()}-${createdColumns.length}`,
          classId,
          name: gc.sourceName,
          category: gc.gradeCategory ?? "Custom",
          maxScore: gc.maxScore ?? 100,
          order: maxOrder + 1 + createdColumns.length,
        })
        createdColumns.push(gc.sourceName)
      }
    }

    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const studentId = idCol ? (row[idCol.sourceName]?.toString()?.trim() ?? "") : ""
      const studentName = nameCol ? (row[nameCol.sourceName]?.toString()?.trim() ?? "") : ""
      const section = sectionCol ? (row[sectionCol.sourceName]?.toString()?.trim() ?? "") : ""

      if (!studentId && !studentName) {
        errors.push(`Row ${i + 2}: No student identifier found, skipped.`)
        continue
      }

      const scores: Record<string, number> = {}
      for (const gc of gradeColumns) {
        const rawVal = row[gc.sourceName]
        const num = rawVal !== undefined && rawVal !== "" ? Number(rawVal) : 0
        scores[gc.sourceName] = isNaN(num) ? 0 : num
      }

      const gradeId = `GRD-${Date.now()}-${i}`
      try {
        await gradesRepository.upsert(
          { classId, studentId: studentId || gradeId },
          {
            id: gradeId,
            classId,
            studentId: studentId || gradeId,
            student: studentName || "Unknown",
            section: section || "",
            scores,
            subject: body.subject ?? "",
            code: body.subjectCode ?? "",
            workflowStatus: "Draft",
            released: false,
            updatedAt: new Date().toISOString(),
          }
        )
        importedCounts[studentId || gradeId] = Object.keys(scores).length
      } catch {
        errors.push(`Row ${i + 2}: Failed to import grade.`)
      }
    }

    let template: { id: string; name: string } | undefined
    if (saveAsTemplate?.name) {
      const existingTemplates = await gradingTemplateRepository.findAll({
        classId,
        name: saveAsTemplate.name,
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
      sourceName: gc.sourceName,
      targetRole: "grade",
      gradeCategory: gc.gradeCategory,
      maxScore: gc.maxScore,
      skip: false,
    })
  }

  for (const s of auto.skipCols) {
    mapping.push({ sourceName: s, targetRole: "grade", skip: true })
  }

  return mapping
}
