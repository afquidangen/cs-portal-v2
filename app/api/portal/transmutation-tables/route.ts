import { transmutationTableRepository } from "@/features/portal/repositories/transmutation-table.repository"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const tables = await transmutationTableRepository.findAll()
    return success(tables)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch transmutation tables.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const table = await transmutationTableRepository.create({
      id: `TT-${Date.now()}`,
      ...body,
    })
    return success(table, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create transmutation table.")
  }
}
