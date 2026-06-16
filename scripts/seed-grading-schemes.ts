import "dotenv/config"
import { connectToDatabase } from "../lib/mongodb"
import { GradingSchemeModel } from "../lib/models/grading-scheme.model"

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
        { name: "Quizzes", weight: 30 },
        { name: "Performance", weight: 30 },
        { name: "Activities", weight: 30 },
        { name: "Attendance", weight: 10 },
      ],
    },
    {
      name: "Exam",
      weight: 40,
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
        { name: "Quizzes", weight: 30 },
        { name: "Performance", weight: 30 },
        { name: "Activities", weight: 30 },
        { name: "Attendance", weight: 10 },
      ],
    },
    {
      name: "Lecture Exam",
      weight: 40,
      categories: [{ name: "Exam", weight: 100 }],
    },
  ],
  labComponents: [
    {
      name: "Laboratory",
      weight: 100,
      categories: [
        { name: "Lab Quiz", weight: 35 },
        { name: "Lab Activities", weight: 35 },
        { name: "MCO", weight: 15 },
        { name: "Attendance", weight: 15 },
      ],
    },
  ],
}

async function seed() {
  await connectToDatabase()

  const existingLecture = await GradingSchemeModel.findOne({
    id: "GS-DEFAULT-LECTURE",
  })
  if (!existingLecture) {
    await GradingSchemeModel.create(DEFAULT_LECTURE_SCHEME)
    console.log("Created default Lecture grading scheme.")
  } else {
    console.log("Lecture scheme already exists.")
  }

  const existingLab = await GradingSchemeModel.findOne({
    id: "GS-DEFAULT-LAB",
  })
  if (!existingLab) {
    await GradingSchemeModel.create(DEFAULT_LAB_SCHEME)
    console.log("Created default Lecture with Lab grading scheme.")
  } else {
    console.log("Lab scheme already exists.")
  }

  console.log("Grading scheme seeding complete.")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
