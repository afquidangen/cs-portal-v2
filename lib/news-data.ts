export type NewsItem = {
  id: number
  category: string
  headline: string
  summary: string
  content: string
  accent: string
}

export const liveAnnouncements = [
  "Enrollment schedules for the next semester will be posted this week.",
  "Final thesis documents must be submitted before Friday at 5:00 PM.",
  "Portal maintenance is scheduled on Sunday from 8:00 PM to 10:00 PM.",
  "Seminar registration is now open for all eligible students.",
  "Faculty grade submission deadline is this Friday.",
]

export const newsItems: NewsItem[] = [
  {
    id: 1,
    category: "Enrollment",
    headline: "Enrollment schedule for the upcoming semester is now being finalized",
    summary:
      "Students are advised to prepare documentary requirements and monitor official posting schedules.",
    content:
      "The Office of Academic Affairs is finalizing the enrollment schedule for the upcoming semester. Students are advised to prepare all necessary documentary requirements, settle pending obligations, and regularly monitor portal announcements for the official release of dates, program-specific enrollment windows, and advising procedures.",
    accent:
      "from-[#A9CBE0]/35 via-[#F0F5F4] to-transparent dark:from-[#A9CBE0]/20 dark:via-transparent dark:to-transparent",
  },
  {
    id: 2,
    category: "Thesis",
    headline: "Final thesis submission deadline remains set for Friday at 5:00 PM",
    summary:
      "Ensure all documentation, revisions, and approval signatures are completed before submission.",
    content:
      "All graduating students with thesis requirements must complete final revisions, attach the approved documentation, and submit all required files before Friday at 5:00 PM. Late submissions may be subject to departmental review and may affect clearance and graduation processing.",
    accent:
      "from-[#668CA9]/30 via-[#F8FBFC] to-transparent dark:from-[#668CA9]/18 dark:via-transparent dark:to-transparent",
  },
  {
    id: 3,
    category: "Maintenance",
    headline: "Portal maintenance is scheduled this Sunday from 8:00 PM to 10:00 PM",
    summary:
      "Temporary unavailability may affect access to grades, documents, and academic services.",
    content:
      "Scheduled maintenance will take place this Sunday from 8:00 PM to 10:00 PM to improve performance, optimize records processing, and strengthen system reliability. During this time, users may experience temporary unavailability of the portal, including access to grades, class information, and document requests.",
    accent:
      "from-[#225688]/30 via-[#F8FBFC] to-transparent dark:from-[#225688]/20 dark:via-transparent dark:to-transparent",
  },
  {
    id: 4,
    category: "Seminars",
    headline: "Seminar registration is now open for all qualified student participants",
    summary:
      "Reserve your slot early and coordinate with your academic adviser for participation requirements.",
    content:
      "Registration for the upcoming academic seminars is now officially open. Interested students are encouraged to reserve their slot early, review participation requirements, and consult their academic advisers for endorsements or attendance guidelines. Seminar schedules and speaker information will be published through the portal.",
    accent:
      "from-[#A9CBE0]/30 via-[#F8FBFC] to-transparent dark:from-[#A9CBE0]/18 dark:via-transparent dark:to-transparent",
  },
  {
    id: 5,
    category: "Faculty",
    headline: "Faculty members are reminded of the grade submission deadline this week",
    summary:
      "All instructors are requested to finalize encoding and verify submitted records before cutoff.",
    content:
      "Faculty members are reminded to complete the encoding, verification, and submission of grades before the official deadline this week. Instructors are encouraged to review student records carefully, resolve incomplete entries, and ensure consistency in the submission process to avoid delays in academic processing.",
    accent:
      "from-[#092C56]/25 via-[#F8FBFC] to-transparent dark:from-[#092C56]/22 dark:via-transparent dark:to-transparent",
  },
]