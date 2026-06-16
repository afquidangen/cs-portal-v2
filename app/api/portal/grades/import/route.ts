import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import * as XLSX from "xlsx"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return badRequest("No file uploaded.")

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: "buffer" })

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) return badRequest("Workbook is empty.")

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)
    if (rows.length === 0) return badRequest("No data rows found.")

    const preview: Array<Record<string, unknown>> = []
    const importErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const studentName = row["Student Name"] || row["Name"] || row["Student"] || ""
      const studentId = row["Student ID"] || row["ID"] || ""

      if (!studentName && !studentId) continue

      const scores: Record<string, number> = {}
      for (const [key, value] of Object.entries(row)) {
        const header = key.trim()
        if (
          ["Student Name", "Name", "Student", "Student ID", "ID", "Section", "Subject"].includes(header)
        ) continue
        const num = Number(value)
        if (!isNaN(num)) scores[header] = num
      }

      preview.push({
        row: i + 1,
        studentName,
        studentId,
        section: row["Section"] || "",
        scores,
      })
    }

    const action = formData.get("action")
    if (action === "preview") {
      return success({ preview, totalRows: preview.length })
    }

    const classId = formData.get("classId") as string
    if (!classId) return badRequest("classId is required for import.")

    const imported = []
    for (const item of preview) {
      const gradeId = `GRD-${Date.now()}-${imported.length}`
      const record = await gradesRepository.upsert(
        { classId, studentId: item.studentId as string },
        {
          id: gradeId,
          classId,
          studentId: item.studentId as string,
          student: item.studentName as string,
          section: item.section as string,
          scores: item.scores,
          workflowStatus: "Draft",
          released: false,
          updatedAt: new Date().toISOString(),
        }
      )
      imported.push(record)
    }

    return success({ imported: imported.length, errors: importErrors })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to import grades.")
  }
}
