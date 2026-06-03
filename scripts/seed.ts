import "dotenv/config"
import { connectToDatabase, disconnectFromDatabase } from "../lib/mongodb"

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
} from "../features/portal/data/portal-data"
import { newsItems } from "../lib/news-data"

import {
  AnnouncementModel,
  AuditLogModel,
  ClassStudentModel,
  CsoReportModel,
  CurriculumModel,
  FacultyModel,
  FeedbackModel,
  GradeModel,
  NewsModel,
  QuickLinkModel,
  ScheduleModel,
  SemesterModel,
  SeminarModel,
  SubjectModel,
  ThesisModel,
  UserModel,
  YearSectionModel,
} from "../lib/models"

const passwordsById = new Map([
  ["ADM-001", "admintest123"],
  ["ADM-002", "admintest123"],
  ["FAC-014", "facultytest123"],
  ["FAC-018", "facultytest123"],
  ["2024-001245", "studenttest123"],
  ["2024-001284", "studenttest123"],
])

const overwrite = process.argv.includes("--overwrite")
const force = process.argv.includes("--force")

async function seed() {
  console.log(`[Seed] Connecting to MongoDB...`)
  await connectToDatabase()

  if (force) {
    console.log(`[Seed] Clearing existing data...`)
    const models = [
      AnnouncementModel, AuditLogModel, ClassStudentModel, CsoReportModel,
      CurriculumModel, FacultyModel, FeedbackModel, GradeModel, QuickLinkModel,
      ScheduleModel, SemesterModel, SeminarModel, SubjectModel, ThesisModel,
      UserModel, YearSectionModel,
    ]
    await Promise.all(models.map((m) => m.deleteMany()))
    console.log(`[Seed] Cleared all collections.`)
  }

  const collections: { model: any; name: string; items: Record<string, unknown>[] }[] = [
    { model: UserModel, name: "users", items: usersSeed.map((u) => ({ ...u, password: passwordsById.get(u.id) ?? "changeme123" })) },
    { model: FacultyModel, name: "faculty", items: facultySeed },
    { model: GradeModel, name: "grades", items: gradeSeed },
    { model: ThesisModel, name: "theses", items: thesisSeed },
    { model: SeminarModel, name: "seminars", items: seminarSeed },
    { model: FeedbackModel, name: "tickets", items: feedbackSeed },
    { model: AnnouncementModel, name: "announcements", items: announcementsSeed },
    { model: ClassStudentModel, name: "roster", items: classRosterSeed },
    { model: SemesterModel, name: "semesters", items: semestersSeed },
    { model: SubjectModel, name: "subjects", items: subjectsSeed },
    { model: CurriculumModel, name: "curricula", items: curriculumCatalogSeed },
    { model: YearSectionModel, name: "yearSections", items: yearSectionsSeed },
    { model: ScheduleModel, name: "classSchedules", items: scheduleSeed },
    { model: AuditLogModel, name: "auditLogs", items: auditLogsSeed },
    { model: CsoReportModel, name: "csoReports", items: csoReportsSeed },
    { model: QuickLinkModel, name: "quickLinks", items: quickLinksSeed },
    { model: NewsModel, name: "news", items: newsItems },
  ]

  let total = 0

  for (const { model, name, items } of collections) {
    if (items.length === 0) continue

    const existing = await model.countDocuments()
    if (existing > 0 && !overwrite) {
      console.log(`[Seed] Skipping ${name} (${existing} documents exist). Use --overwrite to replace.`)
      continue
    }

    if (overwrite) {
      await model.deleteMany({})
    }

    if (name === "users") {
      for (const item of items) {
        await model.create(item)
      }
    } else {
      await model.insertMany(items)
    }
    total += items.length
    console.log(`[Seed] Seeded ${name} with ${items.length} documents.`)
  }

  console.log(`[Seed] Done. Total documents seeded: ${total}`)
  await disconnectFromDatabase()
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err)
  process.exit(1)
})
