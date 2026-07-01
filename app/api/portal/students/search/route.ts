import { requireAuth } from "@/lib/api-auth"
import { success, error } from "@/lib/api-response"
import { usersRepository } from "@/features/portal/repositories/users.repository"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const { user: currentUser } = auth

    if (currentUser.role !== "student" && currentUser.role !== "admin") {
      return error("Unauthorized", 403)
    }

    const url = new URL(request.url)
    const q = url.searchParams.get("q") ?? ""

    const filter: Record<string, unknown> = {
      role: "student",
      status: "Active",
    }

    if (currentUser.course) {
      filter.course = currentUser.course
    }

    if (q.trim()) {
      const regex = { $regex: q.trim(), $options: "i" }
      filter.$or = [
        { name: regex },
        { id: regex },
      ]
    }

    const students = await usersRepository.findAll(filter)

    const sanitized = (students as Array<Record<string, unknown>>)
      .filter((s) => String(s.id) !== String(currentUser.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        photoUrl: s.photoUrl ?? "",
        currentYearLevel: s.currentYearLevel ?? "",
        section: s.section ?? "",
        course: s.course ?? "",
      }))

    return success(sanitized)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Internal server error", 500)
  }
}
