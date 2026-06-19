import { yearSectionsRepository } from "@/features/portal/repositories/year-sections.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await yearSectionsRepository.findById(id)
    if (!entry) return notFound("Year section")
    return success(entry)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch year section.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const entry = await yearSectionsRepository.update({ id }, body)
    if (!entry) return notFound("Year section")
    return success(entry)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update year section.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await yearSectionsRepository.delete({ id })
    if (!deleted) return notFound("Year section")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete year section.")
  }
}
