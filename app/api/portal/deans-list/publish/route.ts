import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireAdmin } from "@/lib/api-auth"
import { YEAR_LEVELS } from "@/features/portal/lib/year-level"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json() as { semesterId: string }
    const { semesterId } = body
    if (!semesterId) return badRequest("semesterId is required.")

    await connectToDatabase()

    const entries = await DeansListModel.find({ semesterId }).lean()

    const groups: Record<string, typeof entries> = {}
    for (const e of entries) {
      const yl = e.yearLevel || "First Year"
      if (!groups[yl]) groups[yl] = []
      groups[yl].push(e)
    }

    for (const yearLevel of YEAR_LEVELS) {
      const group = groups[yearLevel]
      if (!group || group.length === 0) continue

      const qualified = group
        .filter((e) => {
          if (e.manualOverride === "exclude") return false
          if (e.manualOverride === "include") return true
          return e.isQualified
        })
        .sort((a, b) => (a.gwa ?? 99) - (b.gwa ?? 99))

      for (let i = 0; i < qualified.length; i++) {
        await DeansListModel.updateOne(
          { id: qualified[i].id },
          { $set: { rank: i + 1 } }
        )
      }
    }

    const now = new Date().toISOString()
    await DeansListModel.updateMany(
      { semesterId },
      { $set: { published: true, publishedAt: now, needsRecalculation: false } }
    )

    const updated = await DeansListModel.find({ semesterId }).lean()

    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to publish Dean's List.")
  }
}
