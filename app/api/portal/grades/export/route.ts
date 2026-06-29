import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { exportTemplate } from "@/features/portal/lib/export-template-engine"

export const runtime = "nodejs"

async function getSectionLabel(classId: string): Promise<string> {
  try {
    const schedules = await schedulesRepository.findAll({ id: classId }) as Array<Record<string, unknown>>
    const section = (schedules[0]?.section as string) ?? classId
    return String(section ?? "").replace(/[^a-zA-Z0-9-]/g, "_")
  } catch {
    return classId
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const classId = url.searchParams.get("classId")
    if (!classId) return badRequest("classId query parameter is required.")
    const sectionFilter = url.searchParams.get("section")

    const buf = await exportTemplate(classId, sectionFilter)
    const buffer = new Uint8Array(buf)
    const section = await getSectionLabel(classId)
    const filename = `Class Record - ${section}.xlsx`

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to export grades.")
  }
}
