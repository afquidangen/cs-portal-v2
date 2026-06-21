import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function PUT(request: Request) {
  try {
    await connectToDatabase()

    const body = await request.json() as {
      studentId: string
      semesterId: string
      semester: string
      schoolYearStart: number
      schoolYearEnd: number
      gwa: number | null
    }

    if (!body.studentId || !body.semesterId) {
      return badRequest("studentId and semesterId are required.")
    }

    const user = await UserModel.findOne({ id: body.studentId })
    if (!user) return error("Student not found.", 404)

    const existingGwas = (user as unknown as Record<string, unknown>).semesterGwas as Array<Record<string, unknown>> ?? []
    const existingIdx = existingGwas.findIndex(
      (g) => g.semesterId === body.semesterId
    )

    const entry = {
      semesterId: body.semesterId,
      semester: body.semester,
      schoolYearStart: body.schoolYearStart,
      schoolYearEnd: body.schoolYearEnd,
      gwa: body.gwa,
    }

    if (existingIdx >= 0) {
      existingGwas[existingIdx] = entry
    } else {
      existingGwas.push(entry)
    }

    await UserModel.updateOne(
      { id: body.studentId },
      { $set: { semesterGwas: existingGwas } }
    )

    return success({ semesterGwas: existingGwas })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update GWA.")
  }
}
