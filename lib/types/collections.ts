import type { Announcement } from "./announcement"
import type { AuditLogRecord } from "./audit-log"
import type { ClassStudent } from "./class-student"
import type { CsoReport } from "./cso-report"
import type { CurriculumRecord } from "./curriculum"
import type { FacultyRecord } from "./faculty"
import type { FeedbackTicket } from "./feedback"
import type { GradeRecord } from "./grade"
import type { DownloadableRecord } from "./downloadable"
import type { QuickLinkRecord } from "./quick-link"
import type { ScheduleItem } from "./schedule"
import type { SemesterRecord } from "./semester"
import type { SeminarRecord } from "./seminar"
import type { SubjectRecord } from "./subject"
import type { ThesisRecord } from "./thesis"
import type { UserRecord } from "./user"
import type { YearSectionRecord } from "./year-section"

export type PortalCollectionMap = {
  users: UserRecord[]
  faculty: FacultyRecord[]
  grades: GradeRecord[]
  theses: ThesisRecord[]
  seminars: SeminarRecord[]
  tickets: FeedbackTicket[]
  announcements: Announcement[]
  roster: ClassStudent[]
  semesters: SemesterRecord[]
  subjects: SubjectRecord[]
  curricula: CurriculumRecord[]
  yearSections: YearSectionRecord[]
  classSchedules: ScheduleItem[]
  auditLogs: AuditLogRecord[]
  csoReports: CsoReport[]
  quickLinks: QuickLinkRecord[]
  downloadables: DownloadableRecord[]
}

export type PortalCollectionName = keyof PortalCollectionMap

export type PortalDashboardData = PortalCollectionMap
