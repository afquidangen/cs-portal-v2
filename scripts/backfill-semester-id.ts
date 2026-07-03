import "dotenv/config"
import { GradeModel, ScheduleModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"

async function backfill() {
  await connectToDatabase()

  const grades = await GradeModel.find({
    $and: [
      { semesterId: { $exists: false } },
      { classId: { $exists: true, $ne: null } },
    ],
  }).lean()

  if (grades.length === 0) {
    console.log("No grade records missing semesterId found.")
    process.exit(0)
  }

  console.log(`Found ${grades.length} grade record(s) missing semesterId.`)

  let updated = 0
  for (const grade of grades) {
    const schedule = await ScheduleModel.findOne({ id: grade.classId }).select("semesterId").lean()
    if (!schedule?.semesterId) {
      console.warn(`  No schedule found for classId=${grade.classId}, skipping grade=${grade.id}`)
      continue
    }
    await GradeModel.updateOne(
      { _id: grade._id },
      { $set: { semesterId: schedule.semesterId } }
    )
    updated++
  }

  console.log(`Backfilled semesterId on ${updated} grade record(s).`)
  process.exit(0)
}

backfill().catch((err) => {
  console.error("Backfill failed:", err)
  process.exit(1)
})
