import "dotenv/config"
import { UserModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"

async function migrate() {
  await connectToDatabase()

  const result = await UserModel.updateMany(
    { course: { $exists: false } },
    { $set: { course: "Bachelor of Science in Computer Science (BSCS)" } }
  )

  console.log(`Updated ${result.modifiedCount} users with default course.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
