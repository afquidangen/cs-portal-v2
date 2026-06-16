import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import * as XLSX from "xlsx"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const classId = url.searchParams.get("classId")
    if (!classId) return badRequest("classId query parameter is required.")

    const gradesData = await gradesRepository.findAll({ classId }) as Array<Record<string, unknown>>
    const columnsData = await gradeColumnRepository.findByClass(classId) as Array<{ name: string }>

    if (gradesData.length === 0) {
      return badRequest("No grades found for this class.")
    }

    const columnNames = columnsData.map((c) => c.name)

    const headerRow = [
      "Student ID", "Student Name", "Section",
      ...columnNames,
      "Midterm Grade", "Final Grade", "Transmuted Grade", "Remarks", "Status",
    ]

    const dataRows = gradesData.map((grade) => {
      const scores = (grade.scores as Record<string, number>) || {}
      return [
        grade.studentId || "", grade.student || "", grade.section || "",
        ...columnNames.map((name: string) => scores[name] ?? ""),
        grade.midtermGrade ?? "", grade.finalGrade ?? "", grade.transmutedGrade ?? "",
        grade.remarks || "", grade.workflowStatus || "Draft",
      ]
    })

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Grades")
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="grades-${classId}.xlsx"`,
      },
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to export grades.")
  }
}
