import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const trashed = await thesesRepository.findTrashed()
    return success(trashed)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch trashed theses.")
  }
}
