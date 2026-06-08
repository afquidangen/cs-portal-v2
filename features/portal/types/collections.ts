import type {
  Announcement,
  ClassStudent,
  CsoReport,
  CurriculumRecord,
  FacultyRecord,
  FeedbackTicket,
  GradeRecord,
  ScheduleItem,
  SeminarRecord,
  ThesisRecord,
  UserRecord,
} from "../data/portal-data"
import type { DownloadableRecord, QuickLinkRecord, SemesterRecord, SubjectRecord } from "@/lib/types"

export type YearSectionRecord = {
  year: string
  sections: string[]
}

export type AuditLogRecord = {
  id: string
  actor: string
  action: string
  time: string
}

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
