import "dotenv/config"
import { connectToDatabase } from "../lib/mongodb"
import { GradingSchemeModel } from "../lib/models/grading-scheme.model"
import { TransmutationTableModel } from "../lib/models/transmutation-table.model"

const DEFAULT_LECTURE_SCHEME = {
  id: "GS-DEFAULT-LECTURE",
  name: "ISPSC Default Lecture",
  subjectType: "Lecture" as const,
  isDefault: true,
  isActive: true,
  components: [
    {
      name: "Class Standing",
      weight: 60,
      categories: [
        { name: "Quizzes", weight: 10 },
        { name: "Performance", weight: 30 },
        { name: "Assignments", weight: 30 },
        { name: "Attendance", weight: 30, isAttendance: true },
      ],
    },
    {
      name: "Exam",
      weight: 40,
      isExam: true,
      categories: [{ name: "Exam", weight: 100 }],
    },
  ],
}

const DEFAULT_LAB_SCHEME = {
  id: "GS-DEFAULT-LAB",
  name: "ISPSC Default Lecture with Lab",
  subjectType: "Lecture with Lab" as const,
  isDefault: true,
  isActive: true,
  lectureWeight: 40,
  laboratoryWeight: 60,
  components: [
    {
      name: "Lecture Class Standing",
      weight: 60,
      categories: [
        { name: "Quizzes", weight: 10 },
        { name: "Performance", weight: 30 },
        { name: "Assignments", weight: 30 },
        { name: "Attendance", weight: 30, isAttendance: true },
      ],
    },
    {
      name: "Lecture Exam",
      weight: 40,
      isExam: true,
      categories: [{ name: "Exam", weight: 100 }],
    },
  ],
  labComponents: [
    {
      name: "Laboratory",
      weight: 100,
      categories: [
        { name: "Exercises", weight: 35 },
        { name: "Work Attitude", weight: 35 },
        { name: "Project", weight: 15 },
        { name: "Lab Attendance", weight: 15, isAttendance: true },
      ],
    },
  ],
}

async function seed() {
  await connectToDatabase()

  await GradingSchemeModel.updateOne(
    { id: "GS-DEFAULT-LECTURE" },
    { $set: DEFAULT_LECTURE_SCHEME },
    { upsert: true }
  )
  console.log("Upserted default Lecture grading scheme.")

  await GradingSchemeModel.updateOne(
    { id: "GS-DEFAULT-LAB" },
    { $set: DEFAULT_LAB_SCHEME },
    { upsert: true }
  )
  console.log("Upserted default Lecture with Lab grading scheme.")

  const existingTT = await TransmutationTableModel.findOne({
    id: "TT-DEFAULT",
  })
  if (!existingTT) {
    await TransmutationTableModel.create({
      id: "TT-DEFAULT",
      name: "ISPSC Default Transmutation",
      subjectType: "All",
      isDefault: true,
      isActive: true,
      entries: [
        { min: 97, max: 100, equivalent: 1.0 },
        { min: 94, max: 96, equivalent: 1.25 },
        { min: 91, max: 93, equivalent: 1.5 },
        { min: 88, max: 90, equivalent: 1.75 },
        { min: 85, max: 87, equivalent: 2.0 },
        { min: 82, max: 84, equivalent: 2.25 },
        { min: 79, max: 81, equivalent: 2.5 },
        { min: 76, max: 78, equivalent: 2.75 },
        { min: 75, max: 75, equivalent: 3.0 },
        { min: 72, max: 74, equivalent: 4.0 },
        { min: 0, max: 71, equivalent: 5.0 },
      ],
    })
    console.log("Created default transmutation table.")
  } else {
    console.log("Transmutation table already exists.")
  }

  console.log("Grading scheme and transmutation seeding complete.")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
