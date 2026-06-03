import { UserModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { BaseRepository } from "./base.repository"

export class UsersRepository extends BaseRepository {
  constructor() {
    super(UserModel)
  }

  async findByEmail(email: string) {
    return this.findOne({ email: email.toLowerCase() })
  }

  async findByRole(role: string) {
    return this.findAll({ role })
  }

  async authenticate(email: string, password: string) {
    await connectToDatabase()
    return UserModel.findOne({
      email: email.toLowerCase(),
      password,
    }).lean()
  }
}

export const usersRepository = new UsersRepository()
