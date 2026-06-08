import { connectToDatabase } from "@/lib/mongodb"
import type { PortalDashboardData } from "../types/collections"
import { BaseRepository } from "./base.repository"

const emptyDashboard: PortalDashboardData = {
  users: [],
  faculty: [],
  grades: [],
  theses: [],
  seminars: [],
  tickets: [],
  announcements: [],
  roster: [],
  semesters: [],
  subjects: [],
  curricula: [],
  yearSections: [],
  classSchedules: [],
  auditLogs: [],
  csoReports: [],
  quickLinks: [],
  downloadables: [],
}

export async function getPortalDashboardData(): Promise<PortalDashboardData> {
  try {
    await connectToDatabase()
  } catch {
    console.warn("[PortalDashboard] MongoDB unavailable, returning empty data")
    return emptyDashboard
  }

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
  const { downloadablesRepository } = await import("./downloadables.repository")
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
    downloadablesRepository.findAll(),
    auditLogsRepository.findAll(),
  ])

  return {
    users: (results[0] ?? []) as PortalDashboardData["users"],
    faculty: (results[1] ?? []) as PortalDashboardData["faculty"],
    grades: (results[2] ?? []) as PortalDashboardData["grades"],
    theses: (results[3] ?? []) as PortalDashboardData["theses"],
    seminars: (results[4] ?? []) as PortalDashboardData["seminars"],
    tickets: (results[5] ?? []) as PortalDashboardData["tickets"],
    announcements: (results[6] ?? []) as PortalDashboardData["announcements"],
    classSchedules: (results[7] ?? []) as PortalDashboardData["classSchedules"],
    curricula: (results[8] ?? []) as PortalDashboardData["curricula"],
    roster: (results[9] ?? []) as PortalDashboardData["roster"],
    csoReports: (results[10] ?? []) as PortalDashboardData["csoReports"],
    semesters: (results[11] ?? []) as PortalDashboardData["semesters"],
    subjects: (results[12] ?? []) as PortalDashboardData["subjects"],
    yearSections: (results[13] ?? []) as PortalDashboardData["yearSections"],
    quickLinks: (results[14] ?? []) as PortalDashboardData["quickLinks"],
    downloadables: (results[15] ?? []) as PortalDashboardData["downloadables"],
    auditLogs: (results[16] ?? []) as PortalDashboardData["auditLogs"],
  }
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
    collections.map(async ([, items, repo]) => {
      const r = repo as BaseRepository
      await r.deleteMany()
      if (Array.isArray(items) && items.length > 0) {
        await r.bulkUpsert(items as Record<string, unknown>[])
      }
    })
  )

  return getPortalDashboardData()
}
