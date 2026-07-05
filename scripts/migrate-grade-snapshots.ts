import "dotenv/config"
import { GradeModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { transmuteGrade, getGradeRemarks } from "@/features/portal/lib/grade-engine"

async function migrate() {
  await connectToDatabase()

  const grades = await GradeModel.find({
    $or: [
      { midtermReleased: true },
      { finalReleased: true },
    ],
  }).lean()

  if (grades.length === 0) {
    console.log("No released grade records found.")
    process.exit(0)
  }

  console.log(`Found ${grades.length} released grade record(s) to migrate.`)

  let updated = 0
  for (const grade of grades) {
    const g = grade as unknown as Record<string, unknown>
    const setFields: Record<string, unknown> = {}

    if (g.midtermReleased === true) {
      setFields.releasedMidtermGrade = g.midtermGrade
      setFields.releasedMidtermTransmuted = g.midtermTransmuted
      setFields.releasedMidtermRemarks = g.midtermRemarks
    }

    if (g.finalReleased === true) {
      setFields.releasedTentativeFinalGrade = g.tentativeFinalGrade
      setFields.releasedFinalTransmuted = g.finalTransmuted
      setFields.releasedFinalRemarks = g.finalRemarks
    }

    if (g.midtermReleased === true && g.finalReleased === true) {
      const rMidterm = g.midtermGrade as number | undefined
      const rFinal = g.tentativeFinalGrade as number | undefined
      if (rMidterm !== undefined && rFinal !== undefined) {
        const overallGrade = (rMidterm + rFinal) / 2
        const overallTransmuted = transmuteGrade(overallGrade)
        const overallRemarks = getGradeRemarks(overallTransmuted)
        setFields.releasedFinalGrade = overallGrade
        setFields.releasedTransmutedGrade = overallTransmuted
        setFields.releasedRemarks = overallRemarks
      }
    }

    if (Object.keys(setFields).length > 0) {
      await GradeModel.updateOne({ _id: g._id as string }, { $set: setFields })
      updated++
    }
  }

  console.log(`Migrated ${updated} grade record(s) with snapshot fields.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
