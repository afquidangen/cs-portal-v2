import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireAuth } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const { user } = auth

    const url = new URL(request.url)
    const semesterId = url.searchParams.get("semesterId")
    if (!semesterId) return badRequest("semesterId is required.")

    await connectToDatabase()

    const entry = await DeansListModel.findOne({
      semesterId,
      studentId: user.id,
      published: true,
      needsRecalculation: { $ne: true },
    }).lean()

    if (!entry) return success(null)

    const effectiveIsQualified =
      entry.manualOverride === "include" ? true :
      entry.manualOverride === "exclude" ? false :
      entry.isQualified

    return success({ ...entry, isQualified: effectiveIsQualified })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch Dean's List entry.")
  }
}
