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
    const user = await usersRepository.create(body)
    return success(user, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create user.")
  }
}
