import { auditLogsRepository } from "@/features/portal/repositories/audit-logs.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const log = await auditLogsRepository.findById(id)
    if (!log) return notFound("Audit log")
    return success(log)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch audit log.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const log = await auditLogsRepository.update({ id }, body)
    if (!log) return notFound("Audit log")
    return success(log)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update audit log.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await auditLogsRepository.delete({ id })
    if (!deleted) return notFound("Audit log")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete audit log.")
  }
}
