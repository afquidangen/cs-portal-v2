import { usersRepository } from "@/features/portal/repositories/users.repository"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { requireAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth
    const { id } = await params
    const body = await request.json() as { action: "assign" | "revoke" }
    if (!body.action || !["assign", "revoke"].includes(body.action)) {
      return badRequest("Action must be 'assign' or 'revoke'.")
    }
    const user = await usersRepository.findById(id) as Record<string, unknown> | null
    if (!user) return notFound("User")
    const currentRoles: string[] = Array.isArray(user.roles) ? user.roles : []
    const updated = body.action === "assign"
      ? currentRoles.includes("csso_officer") ? currentRoles : [...currentRoles, "csso_officer"]
      : currentRoles.filter((r) => r !== "csso_officer")
    const result = await usersRepository.update({ id }, { $set: { roles: updated } })
    if (!result) return notFound("User")
    return success({ roles: updated })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update CSSO role.")
  }
}
