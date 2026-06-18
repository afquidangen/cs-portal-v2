import "dotenv/config"
import { GradeColumnModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"

async function migrate() {
  await connectToDatabase()

  const result = await GradeColumnModel.updateMany(
    { category: "Performance" },
    { $set: { category: "Performance/Recitation" } }
  )

  console.log(`Migrated ${result.modifiedCount} grade columns from "Performance" to "Performance/Recitation".`)

  process.exit(0)
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
