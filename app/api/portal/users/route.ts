import { usersRepository } from "@/features/portal/repositories/users.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const users = await usersRepository.findAll()
    return success(users)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch users.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.email) {
      return badRequest("User id and email are required.")
    }
    const existing = await usersRepository.findOne({ $or: [{ id: body.id }, { email: body.email.toLowerCase() }] })
    if (existing) {
      const field = (existing as Record<string, unknown>).id === body.id ? "id" : "email"
      return badRequest(`A user with this ${field} already exists.`)
    }
    const user = await usersRepository.create(body)
    return success(user, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create user.")
  }
}
