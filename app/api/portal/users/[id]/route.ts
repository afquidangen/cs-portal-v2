import { usersRepository } from "@/features/portal/repositories/users.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await usersRepository.findById(id)
    if (!user) return notFound("User")
    return success(user)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch user.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const user = await usersRepository.update({ id }, { $set: body })
    if (!user) return notFound("User")
    return success(user)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update user.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await usersRepository.delete({ id })
    if (!deleted) return notFound("User")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete user.")
  }
}
