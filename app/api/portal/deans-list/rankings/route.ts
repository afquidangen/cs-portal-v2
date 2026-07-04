import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel, UserModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireAuth } from "@/lib/api-auth"
import { normalizeYearLevel } from "@/features/portal/lib/year-level"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const url = new URL(request.url)
    const semesterId = url.searchParams.get("semesterId")
    const latest = url.searchParams.get("latest") === "true"

    await connectToDatabase()

    let effectiveSemesterId = semesterId

    if (!effectiveSemesterId && latest) {
      const latestEntry = await DeansListModel
        .findOne({ published: true })
        .sort({ publishedAt: -1 })
        .lean()
      if (latestEntry) {
        effectiveSemesterId = (latestEntry as unknown as Record<string, unknown>).semesterId as string
      }
    }

    if (!effectiveSemesterId) {
      return success([])
    }

    const user = await UserModel.findOne({ id: auth.user.id }).lean()
    const currentUserYearLevel = normalizeYearLevel(
      (user as unknown as Record<string, unknown> | null)?.currentYearLevel as string | undefined
    )

    const query: Record<string, unknown> = {
      semesterId: effectiveSemesterId,
      published: true,
      needsRecalculation: { $ne: true },
      $or: [
        { isQualified: true, manualOverride: { $ne: "exclude" } },
        { manualOverride: "include" },
      ],
    }

    if (auth.user.role === "student" && currentUserYearLevel) {
      query.yearLevel = currentUserYearLevel
    }

    const entries = await DeansListModel.find(query)
      .sort({ yearLevel: 1, rank: 1 })
      .lean()

    const studentIds = [...new Set(entries.map((e) => e.studentId))]
    const privacyUsers = await UserModel.find({ id: { $in: studentIds } }).lean()
    const privacyMap = new Map<string, string>()
    for (const u of privacyUsers) {
      const vu = u as unknown as Record<string, unknown>
      privacyMap.set(vu.id as string, (vu.deansListVisibility as string) ?? "public")
    }

    const result = entries.map((e) => {
      const isPrivate = privacyMap.get(e.studentId) === "private"
      return {
        ...e,
        studentName: isPrivate ? "Private Student" : e.studentName,
        isPrivate,
      }
    })

    return success(result)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch Dean's List rankings.")
  }
}
