import { usersRepository } from "@/features/portal/repositories/users.repository"
import { success, error, notFound } from "@/lib/api-response"
import { uploadProfilePhoto } from "@/lib/cloudinary"

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
    const body = await request.json() as Record<string, unknown>

    if (typeof body.photoUrl === "string" && body.photoUrl.startsWith("data:image")) {
      console.log(`[profile] Uploading photo for user ${id} to Cloudinary...`)
      body.photoUrl = await uploadProfilePhoto(body.photoUrl, id)
      console.log(`[profile] Cloudinary URL: ${body.photoUrl}`)
    }

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
