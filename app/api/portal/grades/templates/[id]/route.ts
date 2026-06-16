import { gradingTemplateRepository } from "@/features/portal/repositories/grading-template.repository"
import { success, error, notFound } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await gradingTemplateRepository.findById(id)
    if (!template) return notFound("Template")
    return success(template)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch template.")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const { id } = await params
    const deleted = await gradingTemplateRepository.delete({ id })
    if (!deleted) return notFound("Template")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete template.")
  }
}
