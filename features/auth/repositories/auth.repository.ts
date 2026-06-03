import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models/user.model"
import type { Role } from "@/lib/types/common"

export type AuthenticatedAccount = {
  email: string
  role: Role
  name: string
  title: string
  id: string
  route: `/${Role}`
}

function titleForAccount(account: {
  role: Role
  year?: number
  section?: string
  studentType?: string
  position?: string
}) {
  if (account.role === "student") {
    return `BSCS ${account.year ?? ""}${account.section ?? ""} - ${
      account.studentType ?? "Regular"
    } Student`
  }

  if (account.role === "faculty") {
    return `${account.position ?? "Faculty Member"} - Computer Science`
  }

  return account.position ?? "System Administrator - CS Department"
}

export async function authenticateAccount(
  email: string,
  password: string
): Promise<AuthenticatedAccount | null> {
  const normalizedEmail = email.toLowerCase().trim()

  await connectToDatabase()

  const user = await UserModel.findOne({ email: normalizedEmail })
  if (!user) return null

  const isMatch = await user.comparePassword(password)
  if (!isMatch) return null

  return {
    email: user.email,
    role: user.role,
    name: user.name,
    title: titleForAccount(user),
    id: user.id,
    route: `/${user.role}`,
  }
}
