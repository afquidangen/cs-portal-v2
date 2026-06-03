import { connectToDatabase } from "@/lib/mongodb"
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
} from "../data/portal-data"
import type { PortalDashboardData } from "../types/collections"
import { BaseRepository } from "./base.repository"

export const portalSeedData: PortalDashboardData = {
  users: usersSeed,
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

export async function getPortalDashboardData(): Promise<PortalDashboardData> {
  await connectToDatabase()

  const { usersRepository } = await import("./users.repository")
  const { facultyRepository } = await import("./faculty.repository")
  const { gradesRepository } = await import("./grades.repository")
  const { thesesRepository } = await import("./theses.repository")
  const { seminarsRepository } = await import("./seminars.repository")
  const { feedbackRepository } = await import("./feedback.repository")
  const { announcementsRepository } = await import("./announcements.repository")
  const { schedulesRepository } = await import("./schedules.repository")
  const { curriculaRepository } = await import("./curricula.repository")
  const { rosterRepository } = await import("./roster.repository")
  const { csoReportsRepository } = await import("./cso-reports.repository")
  const { semestersRepository } = await import("./semesters.repository")
  const { subjectsRepository } = await import("./subjects.repository")
  const { yearSectionsRepository } = await import("./year-sections.repository")
  const { quickLinksRepository } = await import("./quick-links.repository")
  const { auditLogsRepository } = await import("./audit-logs.repository")

  const results = await Promise.all([
    usersRepository.findAll(),
    facultyRepository.findAll(),
    gradesRepository.findAll(),
    thesesRepository.findAll(),
    seminarsRepository.findAll(),
    feedbackRepository.findAll(),
    announcementsRepository.findAll(),
    schedulesRepository.findAll(),
    curriculaRepository.findAll(),
    rosterRepository.findAll(),
    csoReportsRepository.findAll(),
    semestersRepository.findAll(),
    subjectsRepository.findAll(),
    yearSectionsRepository.findAll(),
    quickLinksRepository.findAll(),
    auditLogsRepository.findAll(),
  ])

  const data: PortalDashboardData = {
    users: (results[0]?.length ?? 0) > 0 ? results[0] as never[] as PortalDashboardData["users"] : usersSeed,
    faculty: (results[1]?.length ?? 0) > 0 ? results[1] as never[] as PortalDashboardData["faculty"] : facultySeed,
    grades: (results[2]?.length ?? 0) > 0 ? results[2] as never[] as PortalDashboardData["grades"] : gradeSeed,
    theses: (results[3]?.length ?? 0) > 0 ? results[3] as never[] as PortalDashboardData["theses"] : thesisSeed,
    seminars: (results[4]?.length ?? 0) > 0 ? results[4] as never[] as PortalDashboardData["seminars"] : seminarSeed,
    tickets: (results[5]?.length ?? 0) > 0 ? results[5] as never[] as PortalDashboardData["tickets"] : feedbackSeed,
    announcements: (results[6]?.length ?? 0) > 0 ? results[6] as never[] as PortalDashboardData["announcements"] : announcementsSeed,
    classSchedules: (results[7]?.length ?? 0) > 0 ? results[7] as never[] as PortalDashboardData["classSchedules"] : scheduleSeed,
    curricula: (results[8]?.length ?? 0) > 0 ? results[8] as never[] as PortalDashboardData["curricula"] : curriculumCatalogSeed,
    roster: (results[9]?.length ?? 0) > 0 ? results[9] as never[] as PortalDashboardData["roster"] : classRosterSeed,
    csoReports: (results[10]?.length ?? 0) > 0 ? results[10] as never[] as PortalDashboardData["csoReports"] : csoReportsSeed,
    semesters: (results[11]?.length ?? 0) > 0 ? results[11] as never[] as PortalDashboardData["semesters"] : semestersSeed,
    subjects: (results[12]?.length ?? 0) > 0 ? results[12] as never[] as PortalDashboardData["subjects"] : subjectsSeed,
    yearSections: (results[13]?.length ?? 0) > 0 ? results[13] as never[] as PortalDashboardData["yearSections"] : yearSectionsSeed,
    quickLinks: (results[14]?.length ?? 0) > 0 ? results[14] as never[] as PortalDashboardData["quickLinks"] : quickLinksSeed,
    auditLogs: (results[15]?.length ?? 0) > 0 ? results[15] as never[] as PortalDashboardData["auditLogs"] : auditLogsSeed,
  }

  return data
}

export async function replacePortalDashboardData(data: PortalDashboardData) {
  await connectToDatabase()

  const { usersRepository } = await import("./users.repository")
  const { facultyRepository } = await import("./faculty.repository")
  const { gradesRepository } = await import("./grades.repository")
  const { thesesRepository } = await import("./theses.repository")
  const { seminarsRepository } = await import("./seminars.repository")
  const { feedbackRepository } = await import("./feedback.repository")
  const { announcementsRepository } = await import("./announcements.repository")
  const { schedulesRepository } = await import("./schedules.repository")
  const { curriculaRepository } = await import("./curricula.repository")
  const { rosterRepository } = await import("./roster.repository")
  const { csoReportsRepository } = await import("./cso-reports.repository")
  const { semestersRepository } = await import("./semesters.repository")
  const { subjectsRepository } = await import("./subjects.repository")
  const { yearSectionsRepository } = await import("./year-sections.repository")
  const { quickLinksRepository } = await import("./quick-links.repository")
  const { auditLogsRepository } = await import("./audit-logs.repository")

  const collections: [string, unknown[], unknown, string?][] = [
    ["users", data.users, usersRepository],
    ["faculty", data.faculty, facultyRepository],
    ["grades", data.grades, gradesRepository],
    ["theses", data.theses, thesesRepository],
    ["seminars", data.seminars, seminarsRepository],
    ["tickets", data.tickets, feedbackRepository],
    ["announcements", data.announcements, announcementsRepository],
    ["classSchedules", data.classSchedules, schedulesRepository],
    ["curricula", data.curricula, curriculaRepository],
    ["roster", data.roster, rosterRepository],
    ["csoReports", data.csoReports, csoReportsRepository],
    ["semesters", data.semesters, semestersRepository],
    ["subjects", data.subjects, subjectsRepository],
    ["yearSections", data.yearSections, yearSectionsRepository],
    ["quickLinks", data.quickLinks, quickLinksRepository],
    ["auditLogs", data.auditLogs, auditLogsRepository],
  ]

  await Promise.all(
    collections.map(async ([_name, items, repo]) => {
      const r = repo as BaseRepository
      await r.deleteMany()
      if (Array.isArray(items) && items.length > 0) {
        await r.bulkUpsert(items as Record<string, unknown>[])
      }
    })
  )

  return getPortalDashboardData()
}
