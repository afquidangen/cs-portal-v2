import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await csoReportsRepository.findById(id)
    if (!report) return notFound("CSO report")
    return success(report)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch CSO report.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const report = await csoReportsRepository.update({ id }, { $set: body })
    if (!report) return notFound("CSO report")
    return success(report)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update CSO report.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await csoReportsRepository.delete({ id })
    if (!deleted) return notFound("CSO report")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete CSO report.")
  }
}
