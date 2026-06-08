import "dotenv/config"
import { connectToDatabase, disconnectFromDatabase } from "../lib/mongodb"
import { CurriculumModel, UserModel } from "../lib/models"

const generalTerms = [
  {
    year: "First Year",
    semester: "First Semester",
    subjects: [
      { code: "GEC 1", name: "Purposive Communication", lec: 3, lab: 0, total: 3 },
      { code: "GEC 2", name: "Readings in Philippine History", lec: 3, lab: 0, total: 3 },
      { code: "GEC 3", name: "The Contemporary World", lec: 3, lab: 0, total: 3 },
      { code: "GEC 4", name: "Mathematics in the Modern World", lec: 3, lab: 0, total: 3 },
      { code: "GEC 5", name: "Art Appreciation", lec: 3, lab: 0, total: 3 },
      { code: "GE Elec 1", name: "Living in the IT Era", lec: 3, lab: 0, total: 3 },
      { code: "NSTP 1", name: "National Service Training Program 1", lec: 3, lab: 0, total: 3 },
      { code: "PE 1", name: "Physical Fitness and Health", lec: 2, lab: 0, total: 2 },
    ],
  },
  {
    year: "First Year",
    semester: "Second Semester",
    subjects: [
      { code: "GEC 6", name: "Understanding the Self", lec: 3, lab: 0, total: 3 },
      { code: "GEC 7", name: "Science, Technology and Society", lec: 3, lab: 0, total: 3 },
      { code: "GEC 8", name: "Ethics", lec: 3, lab: 0, total: 3 },
      { code: "GE Elec 2", name: "People and the Earth's Ecosystem", lec: 3, lab: 0, total: 3 },
      { code: "NSTP 2", name: "National Service Training Program 2", lec: 3, lab: 0, total: 3 },
      { code: "PE 2", name: "Physical Activities and Fitness", lec: 2, lab: 0, total: 2 },
    ],
  },
  {
    year: "Second Year",
    semester: "First Semester",
    subjects: [
      { code: "CS 111", name: "Computer Programming 1", lec: 2, lab: 3, total: 5 },
      { code: "CS 112", name: "Discipline in Computing", lec: 3, lab: 0, total: 3 },
      { code: "CS 113", name: "Calculus 1", lec: 3, lab: 0, total: 3 },
      { code: "CS 121", name: "Computer Programming 2", lec: 2, lab: 3, total: 5 },
      { code: "CS 122", name: "Data Structures and Algorithms", lec: 2, lab: 3, total: 5 },
      { code: "CS 131", name: "Web Systems and Technologies", lec: 2, lab: 3, total: 5 },
      { code: "PE 3", name: "Dance and Sports", lec: 2, lab: 0, total: 2 },
    ],
  },
  {
    year: "Second Year",
    semester: "Second Semester",
    subjects: [
      { code: "CS 114", name: "Linear Algebra", lec: 3, lab: 0, total: 3 },
      { code: "CS 123", name: "Object Oriented Programming", lec: 2, lab: 3, total: 5 },
      { code: "CS 124", name: "Information Management", lec: 2, lab: 3, total: 5 },
      { code: "CS 132", name: "Human Computer Interaction", lec: 3, lab: 0, total: 3 },
      { code: "CS 133", name: "Software Engineering 1", lec: 2, lab: 3, total: 5 },
      { code: "CS 141", name: "CS Elective 1", lec: 2, lab: 3, total: 5 },
    ],
  },
  {
    year: "Third Year",
    semester: "First Semester",
    subjects: [
      { code: "CS 211", name: "Algorithm Design and Analysis", lec: 2, lab: 3, total: 5 },
      { code: "CS 212", name: "Applications Development and Emerging Technologies", lec: 2, lab: 3, total: 5 },
      { code: "CS 213", name: "Programming Languages", lec: 3, lab: 0, total: 3 },
      { code: "CS 221", name: "Networking 1", lec: 2, lab: 3, total: 5 },
      { code: "CS 231", name: "Software Engineering 2", lec: 2, lab: 3, total: 5 },
      { code: "CS 311", name: "CS Elective 2", lec: 2, lab: 3, total: 5 },
    ],
  },
  {
    year: "Third Year",
    semester: "Second Semester",
    subjects: [
      { code: "CS 222", name: "Networking 2", lec: 2, lab: 3, total: 5 },
      { code: "CS 223", name: "Information Assurance and Security", lec: 2, lab: 3, total: 5 },
      { code: "CS 224", name: "Capstone Project and Research 1", lec: 3, lab: 0, total: 3 },
      { code: "CS 232", name: "Social and Professional Issues", lec: 3, lab: 0, total: 3 },
      { code: "CS 241", name: "CS Elective 3", lec: 2, lab: 3, total: 5 },
    ],
  },
  {
    year: "Fourth Year",
    semester: "First Semester",
    subjects: [
      { code: "CS 311", name: "Capstone Project and Research 2", lec: 3, lab: 0, total: 3 },
      { code: "CS 321", name: "Internship/Industry Immersion Program 1", lec: 0, lab: 0, total: 8 },
    ],
  },
  {
    year: "Fourth Year",
    semester: "Second Semester",
    subjects: [
      { code: "CS 322", name: "Internship/Industry Immersion Program 2", lec: 0, lab: 0, total: 8 },
    ],
  },
]

function calcTotalUnits(terms: typeof generalTerms): number {
  return terms.reduce(
    (sum, term) => sum + term.subjects.reduce((s, sub) => s + sub.total, 0),
    0
  )
}

async function seed() {
  await connectToDatabase()

  console.log("[Seed] Removing CURR-005 and CURR-006 from database...")
  await CurriculumModel.deleteOne({ id: "CURR-005" })
  await CurriculumModel.deleteOne({ id: "CURR-006" })

  const curricula = [
    {
      id: "CURR-004",
      name: "Bachelor of Science in Computer Science",
      major: "General",
      status: "Active" as const,
      totalUnits: calcTotalUnits(generalTerms),
      terms: generalTerms,
    },
  ]

  for (const curr of curricula) {
    const existing = await CurriculumModel.findOne({ id: curr.id })
    if (existing) {
      console.log(`[Seed] Updating ${curr.id} - ${curr.major}`)
      await CurriculumModel.updateOne({ id: curr.id }, { $set: curr })
    } else {
      console.log(`[Seed] Creating ${curr.id} - ${curr.major}`)
      await CurriculumModel.create(curr)
    }
  }

  const adminAccounts = [
    {
      id: "ADM-001",
      name: "Admin Test 1",
      email: "admin1@gmail.com",
      password: "admintest123",
      role: "admin" as const,
      title: "System Administrator - CS Department",
    },
    {
      id: "ADM-002",
      name: "Admin Test 2",
      email: "admin2@gmail.com",
      password: "admintest123",
      role: "admin" as const,
      title: "Assistant Portal Administrator",
    },
  ]

  for (const acct of adminAccounts) {
    const existing = await UserModel.findOne({ id: acct.id })
    if (existing) {
      console.log(`[Seed] Updating admin ${acct.id} - ${acct.email}`)
      const { password, ...rest } = acct
      await UserModel.updateOne({ id: acct.id }, { $set: rest })
    } else {
      console.log(`[Seed] Creating admin ${acct.id} - ${acct.email}`)
      await UserModel.create(acct)
    }
  }

  console.log("[Seed] Done")
  await disconnectFromDatabase()
}

seed().catch((err) => {
  console.error("[Seed] Failed", err)
  process.exit(1)
})
