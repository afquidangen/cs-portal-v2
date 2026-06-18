import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import * as XLSX from "xlsx"

export const runtime = "nodejs"

function scoreKey(col: { name: string; gradingPeriod?: string }): string {
  return col.gradingPeriod && col.gradingPeriod !== "both"
    ? `${col.gradingPeriod}_${col.name}`
    : col.name
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const classId = url.searchParams.get("classId")
    if (!classId) return badRequest("classId query parameter is required.")

    const columnsData = await gradeColumnRepository.findByClass(classId) as Array<{ name: string; gradingPeriod?: string; category: string; maxScore: number; displayName?: string }>
    const gradesData = await gradesRepository.findAll({ classId }) as Array<Record<string, unknown>>

    if (gradesData.length === 0) {
      return badRequest("No grades found for this class.")
    }

    const isLabSubject = gradesData[0]?.subjectType === "Lecture with Lab"

    function buildPeriodSheet(
      periodColumns: typeof columnsData,
      periodLabel: string
    ) {
      const isMidterm = periodLabel === "Midterm"

      // Group columns by category
      const catGroups = new Map<string, typeof periodColumns>()
      for (const col of periodColumns) {
        const cat = col.category || "Other"
        if (!catGroups.has(cat)) catGroups.set(cat, [])
        catGroups.get(cat)!.push(col)
      }
      const catEntries = Array.from(catGroups.entries())

      // Row 1: category group headers (merged) + computed headers
      // Row 2: individual column names + computed headers
      const catRow: string[] = []
      const colRow: string[] = []
      const merges: XLSX.Range[] = []

      // Fixed columns
      const fixedLabels = ["Student ID", "Student Name", "Section"]
      catRow.push(...fixedLabels)
      colRow.push(...fixedLabels)
      let colIdx = fixedLabels.length

      // Score columns grouped by category
      for (const [catName, cols] of catEntries) {
        const start = colIdx
        for (const c of cols) {
          catRow.push(catName)
          colRow.push(c.displayName || c.name)
          colIdx++
        }
        const end = colIdx - 1
        if (end > start) {
          merges.push({ s: { r: 0, c: start }, e: { r: 0, c: end } })
        }
      }

      // Computed columns
      const computedCat = [
        "Class Standing",
        "Exam Grade",
        ...(isLabSubject ? ["Laboratory Grade"] : []),
        "Lecture Grade",
        `${periodLabel} Grade`,
        `${periodLabel} Transmuted`,
      ]
      for (const label of computedCat) {
        catRow.push(label)
        colRow.push(label)
        colIdx++
      }

      const fixedStart = fixedLabels.length
      const scoreEnd = colIdx - computedCat.length - 1

      // Merge computed column headers (row 0 with row 1 same value)
      for (let c = fixedStart; c < colIdx; c++) {
        if (catRow[c] === colRow[c]) {
          merges.push({ s: { r: 0, c }, e: { r: 1, c } })
        }
      }

      const headerRows = [catRow, colRow]

      const dataRows = gradesData.map((grade) => {
        const scores = (grade.scores as Record<string, number>) || {}
        return [
          grade.studentId || "", grade.student || "", grade.section || "",
          ...periodColumns.map((col) => scores[scoreKey(col)] ?? scores[col.name] ?? ""),
          isMidterm ? (grade.midtermClassStanding ?? "") : (grade.finalClassStanding ?? ""),
          isMidterm ? (grade.midtermExam ?? "") : (grade.finalExam ?? ""),
          ...(isLabSubject ? [isMidterm ? (grade.midtermLaboratoryGrade ?? "") : (grade.finalLaboratoryGrade ?? "")] : []),
          grade.lectureGrade ?? "",
          isMidterm ? (grade.midtermGrade ?? "") : (grade.tentativeFinalGrade ?? ""),
          isMidterm ? (grade.midtermTransmuted ?? "") : (grade.finalTransmuted ?? ""),
        ]
      })

      const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows])
      ws["!merges"] = merges
      return ws
    }

    const midtermCols = columnsData.filter((c) => c.gradingPeriod === "midterm" || c.gradingPeriod === "both" || !c.gradingPeriod)
    const finalCols = columnsData.filter((c) => c.gradingPeriod === "final" || c.gradingPeriod === "both" || !c.gradingPeriod)

    const midtermWS = buildPeriodSheet(midtermCols, "Midterm")
    const finalWS = buildPeriodSheet(finalCols, "Final")

    // --- Summary ---
    const summaryHeaders = [
      "Student ID", "Student Name", "Section",
      "Midterm Grade", "Midterm Transmuted",
      "Tentative Final", "Final Transmuted",
      "Final Grade", "Transmuted Grade",
      "Remarks", "Status",
    ]
    const summaryRows = gradesData.map((grade) => [
      grade.studentId || "", grade.student || "", grade.section || "",
      grade.midtermGrade ?? "", grade.midtermTransmuted ?? "",
      grade.tentativeFinalGrade ?? "", grade.finalTransmuted ?? "",
      grade.finalGrade ?? "", grade.transmutedGrade ?? "",
      grade.remarks || "", grade.workflowStatus || "Draft",
    ])
    const summaryWS = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, midtermWS, "Midterm")
    XLSX.utils.book_append_sheet(wb, finalWS, "Final")
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary")

    // Auto-size columns
    for (const ws of [midtermWS, finalWS, summaryWS]) {
      const ref = ws["!ref"]
      if (!ref) continue
      const range = XLSX.utils.decode_range(ref)
      const colWidths: Array<{ wch: number }> = []
      for (let c = range.s.c; c <= range.e.c; c++) {
        let maxLen = 12
        for (let r = range.s.r; r <= range.e.r; r++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })]
          if (cell?.v != null) maxLen = Math.max(maxLen, String(cell.v).length + 2)
        }
        colWidths.push({ wch: Math.min(maxLen, 40) })
      }
      ws["!cols"] = colWidths
    }

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
