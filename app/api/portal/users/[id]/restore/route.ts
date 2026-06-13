import { usersRepository } from "@/features/portal/repositories/users.repository"
import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restored = await usersRepository.restore({ id })
    if (!restored) return notFound("User")
    await Promise.all([
      rosterRepository.restore({ id }).catch(() => {}),
      gradesRepository.restore({ studentId: id }).catch(() => {}),
    ])
    return success({ restored: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to restore user.")
  }
}
