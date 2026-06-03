import "dotenv/config"
import mongoose from "mongoose"

import {
  announcementsSeed,
  auditLogsSeed,
  classRosterSeed,
  csoReportsSeed,
  curriculumCatalogSeed,
  facultySeed,
  feedbackSeed,
  gradeSeed,
  quickLinksSeed,
  scheduleSeed,
  semestersSeed,
  subjectsSeed,
  seminarSeed,
  thesisSeed,
  usersSeed,
  yearSectionsSeed,
} from "../features/portal/data/portal-data.ts"

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error("MONGODB_URI is not configured.")
}

const portalCollectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

const PortalCollection =
  mongoose.models.PortalCollection ??
  mongoose.model("PortalCollection", portalCollectionSchema)

const passwordsById = new Map([
  ["ADM-001", "admintest123"],
  ["ADM-002", "admintest123"],
  ["FAC-014", "facultytest123"],
  ["FAC-018", "facultytest123"],
  ["2024-001245", "studenttest123"],
  ["2024-001284", "studenttest123"],
])

const usersWithPasswords = usersSeed.map((user) => ({
  ...user,
  password: passwordsById.get(user.id) ?? "changeme123",
}))

const seedData = {
  users: usersWithPasswords,
  faculty: facultySeed,
  grades: gradeSeed,
  theses: thesisSeed,
  seminars: seminarSeed,
  tickets: feedbackSeed,
  announcements: announcementsSeed,
  roster: classRosterSeed,
  semesters: semestersSeed,
  subjects: subjectsSeed,
  curricula: curriculumCatalogSeed,
  yearSections: yearSectionsSeed,
  classSchedules: scheduleSeed,
  auditLogs: auditLogsSeed,
  csoReports: csoReportsSeed,
  quickLinks: quickLinksSeed,
}

await mongoose.connect(uri, { bufferCommands: false })

await Promise.all(
  Object.entries(seedData).map(([name, items]) =>
    PortalCollection.updateOne(
      { name },
      { $set: { name, items } },
      { upsert: true }
    )
  )
)

await mongoose.disconnect()

console.log(`Seeded ${Object.keys(seedData).length} portal collections.`)
