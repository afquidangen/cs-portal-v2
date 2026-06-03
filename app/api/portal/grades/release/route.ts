import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { section, subject } = body
    if (!section || !subject) {
      return badRequest("section and subject are required.")
    }

    await connectToDatabase()
    const result = await GradeModel.updateMany(
      { section, subject },
      { $set: { released: true } }
    )

    return success({ modifiedCount: result.modifiedCount })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to release grades.")
  }
}
