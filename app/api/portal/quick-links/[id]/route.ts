import mongoose from "mongoose"
import { quickLinksRepository } from "@/features/portal/repositories/quick-links.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const link = await quickLinksRepository.findOne({ _id: new mongoose.Types.ObjectId(id) })
    if (!link) return notFound("Quick link")
    return success(link)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch quick link.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const link = await quickLinksRepository.update(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: body }
    )
    if (!link) return notFound("Quick link")
    return success(link)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update quick link.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await quickLinksRepository.delete({ _id: new mongoose.Types.ObjectId(id) })
    if (!deleted) return notFound("Quick link")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete quick link.")
  }
}
