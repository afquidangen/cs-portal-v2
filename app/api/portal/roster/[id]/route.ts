import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models/user.model"
import { success, error, badRequest, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await rosterRepository.findById(id)
    if (!student) return notFound("Roster entry")
    return success(student)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch roster entry.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const section = url.searchParams.get("section")

    await connectToDatabase()
    const user = await UserModel.findOne({ id }).select("role").lean()
    if (!user || user.role !== "student") {
      return badRequest("Only student accounts can be added to the roster.")
    }

    const body = await request.json()

    if (section) {
      const student = await rosterRepository.upsert({ id, section }, body)
      return success(student)
    }

    await rosterRepository.updateMany({ id }, body)
    return success({ updated: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update roster entry.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await rosterRepository.deleteMany({ id })
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete roster entry.")
  }
}
