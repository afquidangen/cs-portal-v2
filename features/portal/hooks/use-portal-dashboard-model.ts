"use client"

import { useRouter } from "next/navigation"
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import { initialModule, roleNavigation } from "../config/navigation"
import type { AuditLogRecord } from "@/lib/types/audit-log"
import type { DownloadableRecord } from "@/lib/types/downloadable"
import type { GalleryItem } from "@/lib/types/gallery"
import type { QuickLinkRecord } from "@/lib/types/quick-link"
import type { YearSectionRecord } from "@/lib/types/year-section"
import {
  type Announcement,
  type AvailabilityStatus,
  type ClassStudent,
  type CsoReport,
  type CurriculumRecord,
  type FacultyRecord,
  type FeedbackTicket,
  type GradeHistoryEntry,
  type GradeRecord,
  type ProfileDetails,
  type Role,
  type ScheduleItem,
  type SeminarRecord,
  type ThesisRecord,
  type TicketStatus,
  type UserRecord,
} from "../data/portal-data"
import type { CsoInfoRecord, SemesterRecord, SubjectRecord } from "@/lib/types"
import { csvEscape, downloadFile } from "../lib/downloads"
import { calculateFinalGrade, computeDeansList, transmutedToEquivalent } from "../lib/grades"
import { parseGradeWorkbook, parseScheduleWorkbook } from "../lib/xlsx"
import type { ModuleId } from "../types/navigation"

type SessionUser = {
  name: string
  email: string
  id: string
  role: Role
  roles?: string[]
  title: string
}

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me")
    if (!res.ok) return null
    const json = await res.json()
    return json.account ?? null
  } catch {
    return null
  }
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function splitProfileName(name: string) {
  const parts = name.split(" ").filter(Boolean)
  return {
    firstName: parts[0] ?? "",
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  }
}

function getProfileFullName(details: ProfileDetails) {
  return [details.firstName, details.middleName, details.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
}

function buildGradeFromImport(
  imported: {
    student: string
    section: string
    subject: string
    code: string
    midtermTransmuted?: number
    midtermEquivalent?: number
    finalTransmuted?: number
    finalEquivalent?: number
    remarks?: string
  },
  studentId: string,
  index: number
): GradeRecord {
  const midterm = imported.midtermEquivalent ?? 5
  const finalTerm = imported.finalEquivalent ?? 5
  const gradePercentage =
    imported.midtermTransmuted !== undefined &&
    imported.finalTransmuted !== undefined
      ? Number(
          ((imported.midtermTransmuted + imported.finalTransmuted) / 2).toFixed(
            2
          )
        )
      : undefined

  return {
    id: `GR-UP-${Date.now()}-${index}`,
    studentId,
    student: imported.student,
    section: imported.section,
    subject: imported.subject,
    code: imported.code,
    units: 3,
    midtermTransmuted: imported.midtermTransmuted,
    midterm,
    finalTransmuted: imported.finalTransmuted,
    finalTerm,
    gradePercentage,
    remarks: imported.remarks || "Passed",
    released: false,
    updatedAt: new Date().toISOString(),
  }
}

export function usePortalDashboardModel(role: Role) {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<ModuleId>(
    initialModule[role]
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState("")

  async function syncApi<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Failed to sync ${url} (${res.status}): ${text}`)
    }
    return res.json() as Promise<T>
  }

  const [users, setUsers] = useState<UserRecord[]>([])
  const [faculty, setFaculty] = useState<FacultyRecord[]>([])
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [theses, setTheses] = useState<ThesisRecord[]>([])
  const [trashedTheses, setTrashedTheses] = useState<ThesisRecord[]>([])
  const [seminars, setSeminars] = useState<SeminarRecord[]>([])
  const [tickets, setTickets] = useState<FeedbackTicket[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [trashedAnnouncements, setTrashedAnnouncements] = useState<Announcement[]>([])
  const [roster, setRoster] = useState<ClassStudent[]>([])
  const [semesters, setSemesters] = useState<SemesterRecord[]>([])
  const [subjects, setSubjects] = useState<SubjectRecord[]>([])
  const [curricula, setCurricula] = useState<CurriculumRecord[]>([])
  const [yearSections, setYearSections] = useState<YearSectionRecord[]>([])
  const [classSchedules, setClassSchedules] = useState<ScheduleItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [csoInfo, setCsoInfo] = useState<CsoInfoRecord | null>(null)
  const [csoReports, setCsoReports] = useState<CsoReport[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLinkRecord[]>([])
  const [downloadables, setDownloadables] = useState<DownloadableRecord[]>([])
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])

  const prevUsersRef = useRef<UserRecord[]>([])
  useEffect(() => {
    const prev = prevUsersRef.current
    const updates: Array<{ scheduleId: string; newName: string }> = []
    setClassSchedules((current) => {
      let changed = false
      const updated = current.map((s) => {
        for (const prevUser of prev) {
          if (prevUser.role !== "faculty") continue
          const currentUser = users.find((u) => u.id === prevUser.id)
          if (currentUser && prevUser.name === s.instructor && currentUser.name !== prevUser.name) {
            changed = true
            updates.push({ scheduleId: s.id, newName: currentUser.name })
            return { ...s, instructor: currentUser.name }
          }
        }
        return s
      })
      return changed ? updated : current
    })
    for (const { scheduleId, newName } of updates) {
      syncApi("PUT", `/api/portal/schedules/${scheduleId}`, { instructor: newName })
        .catch((e) => console.error(`Failed to sync schedule ${scheduleId}:`, e))
    }
    prevUsersRef.current = users
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users])

  const [showQuickLinkForm, setShowQuickLinkForm] = useState(false)
  const [quickLinkDraft, setQuickLinkDraft] = useState({
    label: "",
    href: "",
    type: "link" as "link" | "file",
    fileName: "",
    fileSize: 0,
    fileData: "",
    imageData: undefined as string | undefined,
  })

  const [roleFilter, setRoleFilter] = useState("All")
  const [trashView, setTrashView] = useState(false)
  const [selectedAcademicSection, setSelectedAcademicSection] =
    useState("Semesters")
  const [selectedClassYear, setSelectedClassYear] = useState("First Year")
  const [selectedClassSection, setSelectedClassSection] = useState("")
  const [selectedGradeSection, setSelectedGradeSection] = useState("")
  const [selectedScheduleEntry, setSelectedScheduleEntry] = useState<ScheduleItem | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string
    description: string
    variant?: "default" | "destructive"
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
  } | null>(null)
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("")
  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [showThesisUploadForm, setShowThesisUploadForm] = useState(false)
  const [showThesisTrash, setShowThesisTrash] = useState(false)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [studentDraft, setStudentDraft] = useState({
    id: "",
    name: "",
    section: "",
  })
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState({
    semesterId: semesters.find((s) => s.status === "Active")?.id ?? "",
    day: "",
    time: "",
    subject: "",
    room: "",
    instructor: "",
    section: "",
    curriculumId: "",
  })
  const [showAddSemesterForm, setShowAddSemesterForm] = useState(false)
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false)
  const [newSemester, setNewSemester] = useState<{
    semester: "First Semester" | "Midyear" | "Second Semester"
    schoolYearStart: number
    schoolYearEnd: number
    status: "Active" | "Inactive"
  }>({
    semester: "First Semester",
    schoolYearStart: new Date().getFullYear(),
    schoolYearEnd: new Date().getFullYear() + 1,
    status: "Active",
  })
  const [newSubject, setNewSubject] = useState<{
    curriculumId: string
    yearLevel: string
    semester: string
    code: string
    name: string
    type: "Lecture" | "Lecture with Lab"
    lectureUnits: number
    labUnits: number
    totalUnits: number
  }>({
    curriculumId: curricula[0]?.id ?? "",
    yearLevel: "1st Year",
    semester: "First Semester",
    code: "",
    name: "",
    type: "Lecture",
    lectureUnits: 3,
    labUnits: 0,
    totalUnits: 3,
  })
  const [newCurriculum, setNewCurriculum] = useState({
    name: "",
    major: "",
    totalUnits: "0",
  })
  const [thesisYearFilter, setThesisYearFilter] = useState("All")
  const [thesisCategoryFilter, setThesisCategoryFilter] = useState("All")
  const [uploadName, setUploadName] = useState("No file selected")
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "faculty" | "admin",
    idNumber: "",
    sex: "Male",
    firstName: "",
    middleName: "",
    lastName: "",
    studentType: "Regular",
    curriculum: "",
    curriculumId: "",
    currentYearLevel: "First Year",
    currentSemester: "First Semester",
    year: "1",
    section: "A",
    hasAdvisory: true,
    advisoryClass: "",
    employmentType: "Regular",
    academicTitle: "MIT",
  })
  const [feedbackDraft, setFeedbackDraft] = useState({
    category: "Academic",
    subject: "",
    description: "",
    anonymous: false,
  })
  const [eventDraft, setEventDraft] = useState({
    title: "",
    speaker: "",
    date: "",
    location: "",
    capacity: "30",
  })
  const [thesisDraft, setThesisDraft] = useState({
    title: "",
    authors: "",
    year: "2026",
    category: "Software Engineering",
    adviser: "",
    abstract: "",
    pdfUrl: "",
    fileName: "",
  })
  const [announcementDraft, setAnnouncementDraft] = useState({
    title: "",
    content: "",
    audience: "All Users",
    priority: "Medium" as Announcement["priority"],
    classSections: [] as string[],
  })
  const [myFacultyStatus, setMyFacultyStatus] =
    useState<AvailabilityStatus>("Available")
  const [myFacultyNotes, setMyFacultyNotes] = useState(
    "Available for consultation."
  )
  const [authenticatedUser, setAuthenticatedUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    fetchSession().then((user) => {
      if (!user || user.role !== role) {
        router.replace("/")
        return
      }
      setAuthenticatedUser(user)
    })
  }, [role, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoster((current) => {
      const rosterIds = new Set(current.map((s) => s.id))
      let changed = false

      const updated = current.map((entry) => {
        const user = users.find((u) => u.id === entry.id && u.role === "student")
        if (!user) return entry
        const newSection = user.section ?? ""
        const newName = user.name
        if (entry.section !== newSection || entry.name !== newName) {
          changed = true
          return { ...entry, name: newName, section: newSection, firstName: user.firstName, middleName: user.middleName, lastName: user.lastName }
        }
        if (entry.firstName !== user.firstName || entry.middleName !== user.middleName || entry.lastName !== user.lastName) {
          changed = true
          return { ...entry, firstName: user.firstName, middleName: user.middleName, lastName: user.lastName }
        }
        return entry
      })

      const missing = users.filter(
        (u) => u.role === "student" && u.section && !rosterIds.has(u.id)
      )
      if (missing.length > 0) {
        changed = true
        const newEntries = missing.map((u) => ({
          id: u.id, name: u.name, section: u.section ?? "", enrolled: u.status === "Active",
          firstName: u.firstName, middleName: u.middleName, lastName: u.lastName,
          curriculumId: u.curriculumId, curriculum: u.curriculum,
          currentYearLevel: u.currentYearLevel, currentSemester: u.currentSemester,
          studentType: u.studentType,
        }))
        return [...newEntries, ...updated]
      }

      return changed ? updated : current
    })
  }, [users, setRoster])

  // Set form defaults from MongoDB data after it loads
  useEffect(() => {
    if (curricula.length > 0) {
      const first = curricula[0]
      setSelectedCurriculumId((prev) => !prev ? first.id : prev)
      setNewUser((prev) => ({
        ...prev,
        curriculum: !prev.curriculum ? first.name : prev.curriculum,
        curriculumId: !prev.curriculumId ? first.id : prev.curriculumId,
      }))
    }
    if (yearSections.length > 0) {
      const firstSection = yearSections.flatMap((item) => item.sections)[0]
      if (firstSection) {
        setSelectedClassSection((prev) => !prev ? firstSection : prev)
        setSelectedGradeSection((prev) => !prev ? firstSection : prev)
        setStudentDraft((prev) => ({
          ...prev,
          section: !prev.section ? firstSection : prev.section,
        }))
        setScheduleDraft((prev) => ({
          ...prev,
          section: !prev.section ? firstSection : prev.section,
        }))
        setNewUser((prev) => ({
          ...prev,
          advisoryClass: !prev.advisoryClass ? firstSection : prev.advisoryClass,
        }))
      }
    }
  }, [curricula, yearSections])

  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    photoUrl: "", firstName: "", middleName: "", lastName: "",
    email: "", contactNumber: "", sex: "", birthday: "", address: "",
  })
  const profileName = getProfileFullName(profileDetails)
  const profile = authenticatedUser ?? {
    name: "", email: "", id: "", role, roles: [], title: "",
  } as SessionUser

  const profileUser = users.find((user) => user.id === profile.id)
  useEffect(() => {
    if (!authenticatedUser) return
    const nameParts = splitProfileName(authenticatedUser.name)
    queueMicrotask(() =>
      setProfileDetails({
        photoUrl: profileUser?.photoUrl ?? "",
        cloudinaryPublicId: profileUser?.cloudinaryPublicId,
        firstName: profileUser?.firstName ?? nameParts.firstName,
        middleName: profileUser?.middleName ?? nameParts.middleName,
        lastName: profileUser?.lastName ?? nameParts.lastName,
        email: profileUser?.email ?? authenticatedUser.email,
        contactNumber: profileUser?.contactNumber ?? "",
        sex: profileUser?.sex ?? "",
        birthday: profileUser?.birthday ?? "",
        address: profileUser?.address ?? "",
      })
    )
  }, [authenticatedUser, profileUser])
  const profileAdvisoryClass = profileUser?.advisoryClass
  const profilePhotoUrl = profileDetails.photoUrl
  const navigation = roleNavigation[role]

  const userStats = useMemo(
    () => ({
      students: users.filter((user) => user.role === "student").length,
      faculty: users.filter((user) => user.role === "faculty").length,
      admins: users.filter((user) => user.role === "admin").length,
    }),
    [users]
  )

  const allClassSections = useMemo(
    () => yearSections.flatMap((item) => item.sections),
    [yearSections]
  )

  const facultyClassSections = useMemo(() => {
    const advisory = profileAdvisoryClass ? [profileAdvisoryClass] : []
    const facultyName = profileUser?.name ?? profile.name
    const scheduleSections = classSchedules
      .filter((item) => item.instructor === facultyName)
      .map((item) => item.section)

    return Array.from(
      new Set([...advisory, ...scheduleSections])
    ).filter(Boolean)
  }, [classSchedules, profileUser, profile.name, profileAdvisoryClass])

  const activeClassSection =
    role === "faculty" && !facultyClassSections.includes(selectedClassSection)
      ? facultyClassSections[0] ?? selectedClassSection
      : selectedClassSection

  const activeGradeSection =
    role === "faculty" && !facultyClassSections.includes(selectedGradeSection)
      ? facultyClassSections[0] ?? selectedGradeSection
      : selectedGradeSection

  const facultyClassStudents = useMemo(
    () =>
      roster.filter(
        (student) =>
          student.section === activeClassSection &&
          facultyClassSections.includes(student.section)
      ),
    [activeClassSection, facultyClassSections, roster]
  )

  const facultyGradeRecords = useMemo(
    () =>
      grades.filter(
        (grade) =>
          grade.section === activeGradeSection &&
          facultyClassSections.includes(grade.section)
      ),
    [activeGradeSection, facultyClassSections, grades]
  )

  const facultySubjects = useMemo(() => {
    const facultyName = profileUser?.name ?? profile.name
    const seen = new Set<string>()
    return classSchedules
      .filter((item) => item.instructor === facultyName)
      .map((item) => {
        const code = item.subject.split(" - ")[0]?.trim() ?? item.subject
        const label = item.subject
        const key = `${code}|${label}`
        if (seen.has(key)) return null
        seen.add(key)
        return { code, subject: label, sections: [] as string[] }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((entry) => ({
        ...entry,
        sections: [
          ...new Set(
            classSchedules
              .filter(
                (s) =>
                  s.instructor === facultyName && s.subject === entry.subject
              )
              .map((s) => s.section)
          ),
        ],
      }))
  }, [classSchedules, profileUser, profile.name])

  const profileSection = roster.find((s) => s.id === profile.id && s.enrolled)?.section ?? profileUser?.section ?? ""
  const visibleSchedules = useMemo(() => {
    if (role === "faculty") {
      const facultyName = profileUser?.name ?? profile.name
      return classSchedules.filter((item) =>
        item.instructor === facultyName
      )
    }
    if (role === "student") {
      const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase()
      const passedCodes = new Set(
        (profileUser?.gradeHistory ?? [])
          .filter((h) => h.remarks?.toLowerCase() === "passed")
          .map((h) => normalize(h.subjectCode))
      )

      const enrolledSections = [
        ...new Set([
          ...grades
            .filter((g) => g.studentId === profile.id && !passedCodes.has(normalize(g.code)))
            .map((g) => g.section),
          ...roster
            .filter((r) => r.id === profile.id && r.enrolled)
            .map((r) => r.section),
        ]),
      ].filter(Boolean)
      const allSections = profileSection
        ? [...new Set([profileSection, ...enrolledSections])]
        : enrolledSections
      if (allSections.length === 0) return []
      return classSchedules.filter((item) => {
        const code = normalize(item.subject.split(" - ")[0]?.trim() ?? "")
        return allSections.some((sec) => item.section.includes(sec)) && !passedCodes.has(code)
      })
    }
    return classSchedules
  }, [classSchedules, role, profileSection, profileUser, profile.name, grades, profile.id, users])

  const selectedScheduleStudents = useMemo(
    () =>
      selectedScheduleEntry
        ? roster.filter((s) => s.section === selectedScheduleEntry.section && s.enrolled)
        : [],
    [selectedScheduleEntry, roster]
  )

  const selectedScheduleGrades = useMemo(
    () =>
      selectedScheduleEntry
        ? grades.filter(
            (g) =>
              g.section === selectedScheduleEntry.section &&
              g.subject === selectedScheduleEntry.subject
          )
        : [],
    [selectedScheduleEntry, grades]
  )

  const studentGrades = useMemo(
    () =>
      grades.filter(
        (grade) =>
          grade.studentId === profile.id &&
          grade.released === true
      ),
    [grades, profile.id]
  )

  const gradeAverage = useMemo(() => {
    if (!studentGrades.length) return "N/A"
    const average =
      studentGrades.reduce(
        (sum, grade) => sum + calculateFinalGrade(grade),
        0
      ) / studentGrades.length
    return average.toFixed(2)
  }, [studentGrades])

  const allStudentGrades = useMemo(
    () => grades.filter((grade) => grade.studentId === profile.id && grade.released === true),
    [grades, profile.id]
  )

  const filteredTheses = useMemo(() => {
    const search = query.toLowerCase()
    return theses.filter((thesis) => {
      const matchesSearch = [
        thesis.title,
        thesis.authors,
        thesis.category,
        thesis.adviser,
        thesis.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
      const matchesYear =
        thesisYearFilter === "All" || String(thesis.year) === thesisYearFilter
      const matchesCategory =
        thesisCategoryFilter === "All" || thesis.category === thesisCategoryFilter
      return matchesSearch && matchesYear && matchesCategory
    })
  }, [query, theses, thesisCategoryFilter, thesisYearFilter])

  const filteredSeminars = useMemo(() => {
    const search = query.toLowerCase()
    return seminars.filter((s) =>
      [s.title, s.speaker, s.location, s.description]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [query, seminars])

  const filteredAnnouncements = useMemo(() => {
    const search = query.toLowerCase()
    return announcements.filter((a) =>
      [a.title, a.content]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [query, announcements])

  const filteredCsoReports = useMemo(() => {
    const search = query.toLowerCase()
    return csoReports.filter((r) =>
      [r.title, r.summary, r.type]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [query, csoReports])

  const filteredTickets = useMemo(() => {
    const search = query.toLowerCase()
    return tickets.filter((t) =>
      [t.subject, t.description, t.studentName]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [query, tickets])

  const userByFacultyEmail = useMemo(() => {
    const map = new Map<string, (typeof users)[number]>()
    for (const u of users) {
      if (u.role === "faculty" && !u.deletedAt) {
        map.set(u.email.toLowerCase().trim(), u)
      }
    }
    return map
  }, [users])

  const filteredFaculty = useMemo(() => {
    const search = query.toLowerCase()
    const activeFacultyEmails = new Set(userByFacultyEmail.keys())
    const seen = new Map<string, (typeof faculty)[number]>()
    for (const member of faculty) {
      const email = member.email?.toLowerCase().trim() ?? ""
      if (!activeFacultyEmails.has(email)) continue
      const key = member.name.toLowerCase().trim()
      const user = userByFacultyEmail.get(email)
      seen.set(key, user ? { ...member, name: user.name ?? member.name, photoUrl: user.photoUrl } : member)
    }
    return Array.from(seen.values()).filter((member) =>
      [member.name, member.position, member.role, member.status, member.notes, member.email]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [faculty, userByFacultyEmail, query])

  const filteredUsers = useMemo(() => {
    const search = query.toLowerCase()
    const seen = new Set<string>()
    return users.filter((user) => {
      if (seen.has(user.id)) return false
      seen.add(user.id)
      if (user.deletedAt) return false
      const matchesSearch = [user.name, user.email, user.id, user.role]
        .join(" ")
        .toLowerCase()
        .includes(search)
      const matchesRole = roleFilter === "All" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [query, roleFilter, users])

  const deletedUsers = useMemo(() => {
    const search = query.toLowerCase()
    const seen = new Set<string>()
    return users.filter((user) => {
      if (seen.has(user.id)) return false
      seen.add(user.id)
      if (!user.deletedAt) return false
      const matchesSearch = [user.name, user.email, user.id, user.role]
        .join(" ")
        .toLowerCase()
        .includes(search)
      const matchesRole = roleFilter === "All" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [query, roleFilter, users])

  const studentTickets = tickets.filter(
    (ticket) =>
      ticket.studentId === profile.id ||
      ticket.studentName === profile.name
  )

  const canManageCso = role === "admin" || profile.roles?.includes("csso_officer")
  const selectedNav = navigation.find((item) => item.id === activeModule)
  const currentTitle = selectedNav?.label ?? "Home"

  function selectModule(moduleId: ModuleId) {
    setActiveModule(moduleId)
    setQuery("")
    setSidebarOpen(false)
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  function downloadGradeReport() {
    const rows = [
      ["Subject", "Code", "Units", "Midterm", "Mid. Remarks", "Final Term", "Fin. Remarks", "Grade %", "Final Rating", "Equivalent", "Status"],
      ...studentGrades.map((grade) => [
        grade.subject,
        grade.code,
        grade.units,
        grade.midtermReleased && grade.midtermGrade !== undefined ? grade.midtermGrade.toFixed(2) : "",
        grade.midtermReleased && grade.midtermRemarks ? grade.midtermRemarks : "",
        grade.finalReleased && grade.tentativeFinalGrade !== undefined ? grade.tentativeFinalGrade.toFixed(2) : "",
        grade.finalReleased && grade.finalRemarks ? grade.finalRemarks : "",
        grade.finalReleased && grade.finalGrade !== undefined ? grade.finalGrade.toFixed(2) : "",
        grade.finalReleased && grade.finalGrade !== undefined ? grade.finalGrade.toFixed(0) : "",
        grade.finalReleased && grade.transmutedGrade !== undefined ? grade.transmutedGrade.toFixed(2) : "",
        grade.finalReleased ? (grade.remarks || "Passed") : "",
      ]),
    ]
    downloadFile(
      "student-grade-report.csv",
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadGradeReportDocument() {
    const first = studentGrades[0]
    const studentName = first?.student ?? profile.name
    const studentSection = first?.section ?? profileSection
    const rows = studentGrades.map((grade) => {
      const midterm = grade.midtermReleased && grade.midtermGrade !== undefined ? grade.midtermGrade.toFixed(2) : "—"
      const midRem = grade.midtermReleased && grade.midtermRemarks ? grade.midtermRemarks : "—"
      const finalTerm = grade.finalReleased && grade.tentativeFinalGrade !== undefined ? grade.tentativeFinalGrade.toFixed(2) : "—"
      const finRem = grade.finalReleased && grade.finalRemarks ? grade.finalRemarks : "—"
      const gPct = grade.finalReleased && grade.finalGrade !== undefined ? grade.finalGrade.toFixed(2) : "—"
      const rating = grade.finalReleased && grade.finalGrade !== undefined ? grade.finalGrade.toFixed(0) : "—"
      const equiv = grade.finalReleased && grade.transmutedGrade !== undefined ? grade.transmutedGrade.toFixed(2) : "—"
      const status = grade.finalReleased ? (grade.remarks || "Passed") : "—"
      return `<tr>
        <td>${escHtml(grade.subject)}</td>
        <td>${escHtml(grade.code)}</td>
        <td class="num">${grade.units}</td>
        <td class="num">${midterm}</td>
        <td class="num">${midRem}</td>
        <td class="num">${finalTerm}</td>
        <td class="num">${finRem}</td>
        <td class="num">${gPct}</td>
        <td class="num">${rating}</td>
        <td class="num">${equiv}</td>
        <td class="num">${status}</td>
      </tr>`
    }).join("\n")

    const gwa = gradeAverage !== "N/A" ? gradeAverage : "—"
    const activeSem = semesters.find((s) => s.status === "Active")
    const syLabel = activeSem ? `S.Y. ${activeSem.schoolYearStart}-${activeSem.schoolYearEnd}` : ""
    const deansResult = computeDeansList(studentGrades, profileUser?.studentType, profileUser?.currentYearLevel)
    const deansHtml = deansResult.gwa !== null ? (
      deansResult.eligible
        ? `<p style="margin-top:0;font-size:16px;font-weight:700;color:#16a34a;">Dean's List</p>
           <p style="margin-top:4px;font-size:13px;color:#64748b;">Congrats, you're qualified for the Dean's List for the semester.</p>`
        : deansResult.reasons.length > 0
          ? `<p style="margin-top:0;font-size:13px;color:#94a3b8;font-style:italic;">${escHtml(deansResult.reasons[0])}</p>`
          : ""
    ) : ""

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Grade Report — ${escHtml(studentName)}</title>
<style>
  @page { margin: 0.75in 0.5in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Calibri','Segoe UI',Arial,sans-serif; font-size: 12px; color: #1e293b; padding: 40px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
  .info-grid { display: flex; gap: 40px; margin-bottom: 28px; font-size: 13px; }
  .info-grid div { display: flex; flex-direction: column; gap: 2px; }
  .info-grid .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; font-weight: 600; }
  .info-grid .value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
  td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
  td.num { text-align: center; }
  .gwa-section { margin-top: 28px; display: flex; align-items: baseline; gap: 12px; }
  .gwa-section .gwa-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; font-weight: 600; }
  .gwa-section .gwa-value { font-size: 28px; font-weight: 800; }
  .deans-section { margin-top: 16px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Grade Report</h1>
  <p class="subtitle">Computer Studies Department — Student Records</p>
  <div class="info-grid">
    <div>
      <span class="label">Student Name</span>
      <span class="value">${escHtml(studentName)}</span>
    </div>
    <div>
      <span class="label">Section</span>
      <span class="value">${escHtml(studentSection)}</span>
    </div>
    <div>
      <span class="label">School Year</span>
      <span class="value">${escHtml(syLabel)}</span>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Code</th>
        <th>Units</th>
        <th>Midterm</th>
        <th>Mid. Remarks</th>
        <th>Final Term</th>
        <th>Fin. Remarks</th>
        <th>Grade %</th>
        <th>Rating</th>
        <th>Equivalent</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="gwa-section">
    <span class="gwa-label">GWA</span>
    <span class="gwa-value">${gwa}</span>
  </div>
  ${deansHtml ? `<div class="deans-section">${deansHtml}</div>` : ""}
</body>
</html>`

    downloadFile("student-grade-report.htm", html, "text/html")
  }

  function escHtml(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;") }

  function downloadGradeTemplate() {
    const rows = [
      [
        "Student ID",
        "Student Name",
        "Section",
        "Subject Code",
        "Midterm %",
        "Midterm Equivalent",
        "Final %",
        "Final Equivalent",
        "Remarks",
      ],
      ...facultyClassStudents.map((student) => [
        student.id,
        student.name,
        student.section,
        "CS304",
        "",
        "",
        "",
        "",
        "Passed",
      ]),
    ]
    downloadFile(
      "grade-template.csv",
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadUserTemplate(roleName: Role) {
    const rows = [
      ["Name", "Email", "Role", "Course", "Year", "Section"],
      ["Sample User", `${roleName}@school.edu`, roleName, "BSCS", "3", "A"],
    ]
    downloadFile(
      `${roleName}-template.csv`,
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadAttendees(event: SeminarRecord) {
    const rows = [
      ["Event", "Student ID"],
      ...event.enlistedStudentIds.map((studentId) => [event.title, studentId]),
    ]
    downloadFile(
      `${event.id}-attendees.csv`,
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadThesisDetails(thesis: ThesisRecord) {
    const link = document.createElement("a")
    link.href = thesis.pdfUrl
    link.download = thesis.fileName || `${thesis.title}.pdf`
    link.click()
  }

  function updateGrade(
    id: string,
    field: string,
    value: string
  ) {
    const percentile = Number(value)
    if (Number.isNaN(percentile)) return
    const equiv = transmutedToEquivalent(percentile)
    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

    let updated: GradeRecord | undefined
    setGrades((current) =>
      current.map((grade) => {
        if (grade.id !== id) return grade

        const nextGrade = {
          ...grade,
          [field]: equiv,
          ...(field === "midterm" ? { midtermTransmuted: percentile } : {}),
          ...(field === "finalTerm" ? { finalTransmuted: percentile } : {}),
          updatedAt: now,
        }

        const mt = field === "midterm" ? percentile : nextGrade.midtermTransmuted
        const ft = field === "finalTerm" ? percentile : nextGrade.finalTransmuted
        nextGrade.gradePercentage =
          mt !== undefined && ft !== undefined
            ? Number((((mt as number) + (ft as number)) / 2).toFixed(2))
            : nextGrade.gradePercentage

        updated = nextGrade
        return nextGrade
      })
    )

    if (updated) {
      syncApi("PUT", `/api/portal/grades/${id}`, updated).catch((e) =>
        console.error(`Failed to sync grade ${id}:`, e)
      )
    }
  }

  function updateGradeRemarks(id: string, remarks: string) {
    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

    let updated: GradeRecord | undefined
    setGrades((current) =>
      current.map((grade) => {
        if (grade.id !== id) return grade
        const nextGrade = { ...grade, remarks, updatedAt: now }
        updated = nextGrade
        return nextGrade
      })
    )

    if (updated) {
      syncApi("PUT", `/api/portal/grades/${id}`, updated).catch((e) =>
        console.error(`Failed to sync grade remarks ${id}:`, e)
      )
    }
  }

  async function refreshDashboardData() {
    try {
      const res = await fetch("/api/portal/dashboard")
      if (!res.ok) return
      const json = await res.json()
      const d = json.data
      setUsers(d.users ?? users)
      setFaculty(d.faculty ?? faculty)
      setTheses(d.theses ?? theses)
      setSeminars(d.seminars ?? seminars)
      setTickets(d.tickets ?? tickets)
      setAnnouncements(d.announcements ?? announcements)
      setRoster(d.roster ?? roster)
      setSemesters(d.semesters ?? semesters)
      setSubjects(d.subjects ?? subjects)
      setCurricula(d.curricula ?? curricula)
      setYearSections(d.yearSections ?? yearSections)
      setClassSchedules(d.classSchedules ?? classSchedules)
      setCsoInfo(d.csoInfo ?? csoInfo)
      setCsoReports(d.csoReports ?? csoReports)
      setQuickLinks(d.quickLinks ?? quickLinks)
      setDownloadables(d.downloadables ?? downloadables)
      setAuditLogs(d.auditLogs ?? auditLogs)
      setGalleryItems(d.gallery ?? galleryItems)
      setGrades(d.grades ?? grades)
    } catch {
      // Silently fail
    }
  }

  async function releaseGradesForSection(section: string, subject?: string) {
    const label = subject ? `${section} - ${subject}` : section

    setGrades((current) =>
      current.map((grade) =>
        grade.section === section && (!subject || grade.subject === subject)
          ? { ...grade, released: true }
          : grade
      )
    )

    try {
      await syncApi("POST", "/api/portal/grades/release", { section, subject })
      addAuditLog(`Released grades for ${label}`)
      await refreshDashboardData()
    } catch (e) {
      console.error("Failed to release grades:", e)
    }
  }

  function handleCreateGrade(studentId: string, studentName: string) {
    if (!selectedScheduleEntry) return
    const exists = grades.some(
      (g) => g.studentId === studentId && g.subject === selectedScheduleEntry.subject
    )
    if (exists) return

    const newId = `GRD-${Date.now()}`
    const newGrade: GradeRecord = {
      id: newId,
      studentId,
      student: studentName,
      section: selectedScheduleEntry.section,
      subject: selectedScheduleEntry.subject,
      code: selectedScheduleEntry.subject.split(" - ")[0]?.trim() ?? selectedScheduleEntry.subject,
      units: 3,
      midtermTransmuted: undefined,
      midterm: 0,
      finalTransmuted: undefined,
      finalTerm: 0,
      released: false,
    updatedAt: new Date().toISOString(),
    }
    setGrades((current) => [newGrade, ...current])
    void syncApi("POST", "/api/portal/grades", newGrade)
  }

  function handleUnenrollFromSubject(studentId: string, section: string, gradeId?: string) {
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase()
    const normSection = normalize(section)

    if (gradeId) {
      const grade = grades.find((g) => g.id === gradeId)
      setGrades((current) => current.filter((g) => g.id !== gradeId))
      if (grade) {
        void syncApi("DELETE", `/api/portal/grades/${gradeId}`, {})
        addAuditLog(`Unenrolled student ${grade.student} from ${grade.subject}`)
      }
    }

    const remainingInSection = grades.filter(
      (g) => g.studentId === studentId && normalize(g.section ?? "") === normSection && g.id !== gradeId
    )
    if (remainingInSection.length === 0) {
      setRoster((current) =>
        current.map((r) =>
          r.id === studentId && normalize(r.section ?? "") === normSection
            ? { ...r, enrolled: false }
            : r
        )
      )
      void syncApi("PUT", `/api/portal/roster/${studentId}`, { enrolled: false })
    }
  }

  function handleAddStudentToSubject(
    studentId: string,
    studentName: string,
    subjectLabel: string,
    section: string,
    subjectCode: string
  ) {
    const targetUser = users.find((u) => u.id === studentId)
    if (!targetUser || targetUser.role !== "student") {
      console.warn(`Cannot add user ${studentId} to roster: not a student account.`)
      return
    }

    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase()
    const normSubject = normalize(subjectLabel)
    const normSection = normalize(section)

    const existingPassed = grades.find(
      (g) => normalize(g.subject ?? "") === normSubject && normalize(g.section ?? "") === normSection && g.studentId === studentId && g.remarks === "Passed"
    )
    if (existingPassed) {
      const updated = {
        ...existingPassed,
        midtermTransmuted: undefined,
        midterm: 0,
        finalTransmuted: undefined,
        finalTerm: 0,
        gradePercentage: undefined,
        remarks: undefined,
        released: false,
        updatedAt: now,
      }
      setGrades((current) => current.map((g) => g.id === existingPassed.id ? updated : g))
      void syncApi("PUT", `/api/portal/grades/${existingPassed.id}`, updated)
    } else {
      const exists = grades.some(
        (g) => normalize(g.subject ?? "") === normSubject && normalize(g.section ?? "") === normSection && g.studentId === studentId
      )
      if (exists) return

      const newId = `GRD-${Date.now()}`
      const newGrade: GradeRecord = {
        id: newId,
        studentId,
        student: studentName,
        section,
        subject: subjectLabel,
        code: subjectCode,
        units: 3,
        midtermTransmuted: undefined,
        midterm: 0,
        finalTransmuted: undefined,
        finalTerm: 0,
        released: false,
        updatedAt: now,
      }
      setGrades((current) => [newGrade, ...current])
      void syncApi("POST", "/api/portal/grades", newGrade)
    }

    const existingRoster = roster.find(
      (r) => r.id === studentId && normalize(r.section ?? "") === normSection
    )
    if (!existingRoster) {
      const newRosterEntry = { id: studentId, name: studentName, section, enrolled: true }
      setRoster((current) => [newRosterEntry, ...current])
      void syncApi("PUT", `/api/portal/roster/${studentId}`, newRosterEntry)
    } else if (!existingRoster.enrolled) {
      setRoster((current) =>
        current.map((r) =>
          r.id === studentId && normalize(r.section ?? "") === normSection
            ? { ...r, enrolled: true }
            : r
        )
      )
      void syncApi("PUT", `/api/portal/roster/${studentId}`, { enrolled: true })
    }

    addAuditLog(`Added student ${studentName} to ${subjectLabel} (${section})`)
  }

  function handleUpsertCompletedGrade(
    studentId: string,
    studentName: string,
    subjectCode: string,
    subjectName: string,
    percentile: number,
    remarks: string,
    curriculumId: string
  ) {
    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

    const studentUser = users.find((u) => u.id === studentId)

    const matchingSchedules = classSchedules.filter((s) => {
      const code = s.subject.split(" - ")[0]?.trim() ?? ""
      return code === subjectCode
    })

    const sections = matchingSchedules.length > 0
      ? [...new Set(matchingSchedules.map((s) => s.section))]
      : studentUser?.section
        ? [studentUser.section]
        : roster.find((r) => r.id === studentId)?.section
          ? [roster.find((r) => r.id === studentId)!.section]
          : []

    for (const section of sections) {
      const existing = grades.find(
        (g) => g.studentId === studentId && g.code === subjectCode && g.section === section
      )

      const gradePercentage = percentile
      const equiv = percentile >= 97 ? 1.0 : percentile >= 94 ? 1.25 : percentile >= 91 ? 1.5 : percentile >= 88 ? 1.75 : percentile >= 85 ? 2.0 : percentile >= 82 ? 2.25 : percentile >= 79 ? 2.5 : percentile >= 76 ? 2.75 : 3.0

      if (existing) {
        const updated = {
          ...existing,
          midtermTransmuted: percentile,
          midterm: equiv,
          finalTransmuted: percentile,
          finalTerm: equiv,
          gradePercentage,
          remarks,
          released: true,
          updatedAt: now,
        }
        setGrades((current) => current.map((g) => (g.id === existing.id ? updated : g)))
        void syncApi("PUT", `/api/portal/grades/${existing.id}`, updated)
      } else {
        const newId = `GRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newGrade: GradeRecord = {
          id: newId,
          studentId,
          student: studentName,
          section,
          subject: `${subjectCode} - ${subjectName}`,
          code: subjectCode,
          units: 3,
          midtermTransmuted: percentile,
          midterm: equiv,
          finalTransmuted: percentile,
          finalTerm: equiv,
          gradePercentage,
          remarks,
          released: true,
          updatedAt: now,
        }
        setGrades((current) => [newGrade, ...current])
        void syncApi("POST", "/api/portal/grades", newGrade)
      }

      const inRoster = roster.some((r) => r.id === studentId && r.section === section)
      if (!inRoster) {
        const newRosterEntry = { id: studentId, name: studentName, section, enrolled: true }
        setRoster((current) => [newRosterEntry, ...current])
        void syncApi("PUT", `/api/portal/roster/${studentId}`, newRosterEntry)
      }
    }
  }

  function handleDeleteCompletedGrade(studentId: string, subjectCode: string) {
    const toRemove = grades.filter(
      (g) => g.studentId === studentId && g.code === subjectCode
    )
    for (const grade of toRemove) {
      setGrades((current) => current.filter((g) => g.id !== grade.id))
      syncApi("DELETE", `/api/portal/grades/${grade.id}`, {}).then(() =>
        toast.success("Completed grade deleted.")
      ).catch((e) => {
        toast.error("Failed to delete completed grade.")
        console.error(e)
      })
    }
  }

  function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    resolution?: string
  ) {
    const resolvedAt = status === "Resolved" ? new Date().toISOString() : null
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status, resolution: resolution ?? ticket.resolution, resolvedAt: resolvedAt ?? undefined }
          : ticket
      )
    )
    syncApi("PUT", `/api/portal/feedback/${ticketId}`, { status, resolution, resolvedAt }).then(() =>
      toast.success(`Ticket updated to ${status}.`)
    ).catch((e) => {
      toast.error("Failed to update ticket.")
      console.error(e)
    })
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) addAuditLog(`Updated ticket "${ticket.subject}" to ${status}`)
  }

  function updateFacultyStatus(
    facultyId: string,
    status: AvailabilityStatus,
    notes?: string
  ) {
    const now = new Date().toISOString()
    setFaculty((current) =>
      current.map((member) =>
        member.id === facultyId
          ? { ...member, status, notes: notes ?? member.notes, statusUpdatedAt: now }
          : member
      )
    )
    syncApi("PUT", `/api/portal/faculty/${facultyId}`, { status, notes, statusUpdatedAt: now }).then(() =>
      toast.success("Faculty status updated.")
    ).catch((e) => {
      toast.error("Failed to update faculty status.")
      console.error(e)
    })
    const member = faculty.find((f) => f.id === facultyId)
    if (member) addAuditLog(`Updated faculty status for "${member.name}" to ${status}`)
  }

  function deleteFacultyMember(facultyId: string) {
    const member = faculty.find((f) => f.id === facultyId)
    setFaculty((current) => current.filter((item) => item.id !== facultyId))
    syncApi("DELETE", `/api/portal/faculty/${facultyId}`).then(() =>
      toast.success("Faculty member deleted.")
    ).catch((e) => {
      toast.error("Failed to delete faculty member.")
      console.error(e)
    })
    if (member) addAuditLog(`Deleted faculty account "${member.name}"`)
  }

  function syncFacultyFromUsers() {
    const facultyUsers = users.filter((u) => u.role === "faculty")
    const facultyUserNames = new Set(facultyUsers.map((u) => u.name.toLowerCase().trim()))
    const existingFacultyNames = new Map<string, string>()
    for (const f of faculty) {
      existingFacultyNames.set(f.name.toLowerCase().trim(), f.id)
    }

    for (const member of faculty) {
      if (!facultyUserNames.has(member.name.toLowerCase().trim())) {
        void syncApi("DELETE", `/api/portal/faculty/${member.id}`)
        addAuditLog(`Deleted faculty account "${member.name}"`)
      }
    }

    setFaculty((current) => current.filter((m) => facultyUserNames.has(m.name.toLowerCase().trim())))

    for (const user of facultyUsers) {
      if (!existingFacultyNames.has(user.name.toLowerCase().trim())) {
        const newId = `FAC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newEntry = {
          id: newId,
          name: user.name,
          position: "Faculty",
          role: "faculty",
          email: user.email,
          education: "",
          status: "Available" as const,
          notes: "",
          schedule: [],
        }
        setFaculty((current) => [...current, newEntry])
        void syncApi("POST", "/api/portal/faculty", newEntry)
        addAuditLog(`Created faculty account for "${user.name}"`)
      }
    }
  }

  function addAuditLog(action: string) {
    const now = new Date()
    const time = now.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }) + " " + now.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    })
    const entry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actor: profileName || profile.name,
      action,
      time,
    }
    setAuditLogs((current) => [entry, ...current])
    syncApi("POST", "/api/portal/audit-logs", entry).catch(() => {})
  }

  async function handleToggleCsoOfficer(userId: string, action: "assign" | "revoke") {
    try {
      const res = await fetch(`/api/portal/users/${userId}/cso-role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to update CSSO role.")
      setUsers((current) =>
        current.map((u) =>
          u.id === userId ? { ...u, roles: json.data.roles } : u
        )
      )
      addAuditLog(
        `${action === "assign" ? "Assigned" : "Revoked"} CSSO officer role for user ${userId}`
      )
      toast.success(`CSSO Officer role ${action === "assign" ? "assigned" : "revoked"} successfully.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update CSSO role.")
    }
  }

  async function handleAddUser(event: FormEvent<HTMLFormElement>): Promise<{ type: "success" } | { type: "duplicate"; existingUser: UserRecord; message: string } | { type: "error"; message: string }> {
    event.preventDefault()
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) {
      return { type: "error", message: "First name, last name, and email are required." }
    }
    const fullName = [newUser.firstName, newUser.middleName, newUser.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ")
    const accountId = newUser.idNumber.trim() || `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const existingById = users.find((u) => u.id === accountId)
    if (existingById) {
      return { type: "duplicate", existingUser: existingById, message: `DUPLICATE ERROR FOUND. Duplicate record existing in the system with ID: ${accountId}. Would you like to edit it?` }
    }
    const existingByEmail = users.find((u) => u.email.toLowerCase() === newUser.email.trim().toLowerCase())
    if (existingByEmail) {
      return { type: "duplicate", existingUser: existingByEmail, message: `DUPLICATE ERROR FOUND. Duplicate record existing in the system with Email: ${newUser.email.trim()}. Would you like to edit it?` }
    }

    const apiPayload = {
      id: accountId,
      name: fullName,
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      sex: newUser.sex,
      firstName: newUser.firstName.trim(),
      middleName: newUser.middleName.trim(),
      lastName: newUser.lastName.trim(),
      studentType: newUser.role === "student" ? (newUser.studentType as UserRecord["studentType"]) : undefined,
      curriculum: newUser.role === "student" ? newUser.curriculum : undefined,
      curriculumId: newUser.role === "student" ? newUser.curriculumId : undefined,
      currentYearLevel: newUser.role === "student" ? newUser.currentYearLevel : undefined,
      currentSemester: newUser.role === "student" ? newUser.currentSemester : undefined,
      course: newUser.role === "student" ? "BSCS" : undefined,
      year: newUser.role === "student" ? Number(newUser.year) : undefined,
      section: newUser.role === "student" ? newUser.section : undefined,
      advisoryClass: newUser.role === "faculty" && newUser.hasAdvisory ? newUser.advisoryClass : undefined,
      employmentType: newUser.role === "faculty" ? (newUser.employmentType as UserRecord["employmentType"]) : undefined,
      academicTitle: newUser.role === "faculty" ? newUser.academicTitle : undefined,
      position: newUser.role === "faculty" ? "Instructor" : undefined,
      status: "Active" as const,
      password: newUser.role === "admin" ? "ispsc@admin2026" : newUser.role === "faculty" ? "ispsc@faculty2026" : "ispsc@student2026",
    }

    setUsers((current) => [
      {
        id: accountId,
        name: fullName,
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        sex: newUser.sex,
        firstName: newUser.firstName.trim(),
        middleName: newUser.middleName.trim(),
        lastName: newUser.lastName.trim(),
        studentType: newUser.role === "student" ? (newUser.studentType as UserRecord["studentType"]) : undefined,
        curriculum: newUser.role === "student" ? newUser.curriculum : undefined,
        curriculumId: newUser.role === "student" ? newUser.curriculumId : undefined,
        currentYearLevel: newUser.role === "student" ? newUser.currentYearLevel : undefined,
        currentSemester: newUser.role === "student" ? newUser.currentSemester : undefined,
        course: newUser.role === "student" ? "BSCS" : undefined,
        year: newUser.role === "student" ? Number(newUser.year) : undefined,
        section: newUser.role === "student" ? newUser.section : undefined,
        advisoryClass: newUser.role === "faculty" && newUser.hasAdvisory ? newUser.advisoryClass : undefined,
        employmentType: newUser.role === "faculty" ? (newUser.employmentType as UserRecord["employmentType"]) : undefined,
        academicTitle: newUser.role === "faculty" ? newUser.academicTitle : undefined,
        position: newUser.role === "faculty" ? "Instructor" : undefined,
        status: "Active",
      },
      ...current,
    ])
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "student",
      idNumber: "",
      sex: "Male",
      firstName: "",
      middleName: "",
      lastName: "",
      studentType: "Regular",
      curriculum: "",
      curriculumId: "",
      currentYearLevel: "First Year",
      currentSemester: "First Semester",
      year: "1",
      section: "A",
      hasAdvisory: true,
      advisoryClass: "",
      employmentType: "Regular",
      academicTitle: "MIT",
    })

    if (newUser.role === "student") {
      setRoster((current) => {
        const exists = current.some((s) => s.id === accountId)
        if (exists) return current
        return [{ id: accountId, name: fullName, section: newUser.section, enrolled: true, studentType: newUser.studentType }, ...current]
      })
    }

    if (newUser.role === "faculty") {
      const facultyId = `FAC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const facultyEntry = {
        id: facultyId,
        name: fullName,
        position: "Faculty",
        role: "faculty",
        email: newUser.email.trim().toLowerCase(),
        education: "",
        status: "Available" as const,
        notes: "",
        schedule: [],
      }
      setFaculty((current) => [facultyEntry, ...current])
      syncApi("POST", "/api/portal/faculty", facultyEntry).catch((e) =>
        console.error(`Failed to sync faculty ${facultyId}:`, e)
      )
    }

    try {
      const res = await fetch("/api/portal/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      })
      if (!res.ok) {
        setUsers((current) => current.filter((u) => u.id !== accountId))
        const errData = await res.json().catch(() => ({}))
        if (res.status === 409 && (errData as Record<string, unknown>).existing) {
          return { type: "duplicate", existingUser: (errData as Record<string, unknown>).existing as UserRecord, message: `DUPLICATE ERROR FOUND. Duplicate record existing in the system. Would you like to edit it?` }
        }
        return { type: "error", message: ((errData as Record<string, unknown>).error as string) || "Failed to create user." }
      }
      addAuditLog(`Created ${newUser.role} account "${fullName}" (${newUser.email})`)
      if (newUser.role === "student") {
        syncApi("POST", "/api/portal/roster", { id: accountId, name: fullName, section: newUser.section, enrolled: true, studentType: newUser.studentType }).catch((e) =>
          console.error(`Failed to sync roster for ${fullName}:`, e)
        )
      }
      return { type: "success" }
    } catch (e) {
      setUsers((current) => current.filter((u) => u.id !== accountId))
      return { type: "error", message: e instanceof Error ? e.message : "Network error. Please try again." }
    }
  }

  function confirmAndToggleUserStatus(userId: string) {
    toggleUserStatus(userId)
  }

  function toggleUserStatus(userId: string) {
    const user = users.find((u) => u.id === userId)
    const wasActive = user?.status === "Active"
    const newStatus = wasActive ? "Inactive" : "Active"
    setUsers((current) =>
      current.map((item) =>
        item.id === userId
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
          : item
      )
    )
    setRoster((current) =>
      current.map((item) =>
        item.id === userId
          ? { ...item, enrolled: !item.enrolled }
          : item
      )
    )
    syncApi("PUT", `/api/portal/users/${userId}`, { status: newStatus }).catch((e) =>
      console.error("Failed to sync status:", e)
    )
    if (user) {
      addAuditLog(`${newStatus === "Active" ? "Activated" : "Deactivated"} account "${user.name}"`)
    }
    toast.success(user ? `Account "${user.name}" ${newStatus.toLowerCase()}.` : "Account updated.")
  }

  function confirmAndDeleteUser(userId: string) {
    deleteUser(userId)
  }

  function deleteUser(userId: string) {
    const user = users.find((u) => u.id === userId)
    const now = new Date().toISOString()
    setUsers((current) =>
      current.map((item) =>
        item.id === userId ? { ...item, deletedAt: now } : item
      )
    )
    setRoster((current) =>
      current.map((item) =>
        item.id === userId ? { ...item, deletedAt: now } : item
      )
    )
    setGrades((current) =>
      current.map((grade) =>
        grade.studentId === userId ? { ...grade, deletedAt: now } : grade
      )
    )
    syncApi("DELETE", `/api/portal/users/${userId}`).then(() =>
      toast.success(user ? `User "${user.name}" moved to trash.` : "User moved to trash.")
    ).catch((e) => {
      toast.error("Failed to move user to trash.")
      console.error(e)
    })
    if (user) {
      addAuditLog(`Moved ${user.role} account "${user.name}" to trash`)
    }
  }

  function restoreUser(userId: string) {
    const user = users.find((u) => u.id === userId)
    setUsers((current) =>
      current.map((item) =>
        item.id === userId ? { ...item, deletedAt: null } : item
      )
    )
    setRoster((current) =>
      current.map((item) =>
        item.id === userId ? { ...item, deletedAt: null } : item
      )
    )
    setGrades((current) =>
      current.map((grade) =>
        grade.studentId === userId ? { ...grade, deletedAt: null } : grade
      )
    )
    syncApi("POST", `/api/portal/users/${userId}/restore`).then(() =>
      toast.success(user ? `User "${user.name}" restored.` : "User restored.")
    ).catch((e) => {
      toast.error("Failed to restore user.")
      console.error(e)
    })
    if (user) {
      addAuditLog(`Restored ${user.role} account "${user.name}" from trash`)
    }
  }

  function permanentlyDeleteUser(userId: string) {
    const user = users.find((u) => u.id === userId)
    setUsers((current) => current.filter((item) => item.id !== userId))
    setRoster((current) => current.filter((item) => item.id !== userId))
    setGrades((current) =>
      current.filter((grade) => grade.studentId !== userId)
    )
    syncApi("DELETE", `/api/portal/users/${userId}/permanent`).then(() =>
      toast.success(user ? `User "${user.name}" permanently deleted.` : "User permanently deleted.")
    ).catch((e) => {
      toast.error("Failed to permanently delete user.")
      console.error(e)
    })
    if (user) {
      addAuditLog(`Permanently deleted ${user.role} account "${user.name}"`)
    }
  }

  async function restoreAllUsers() {
    const trashed = users.filter((u) => u.deletedAt)
    const ids = trashed.map((u) => u.id)
    setUsers((current) =>
      current.map((u) => (u.deletedAt ? { ...u, deletedAt: null } : u))
    )
    setRoster((current) =>
      current.map((r) => (r.deletedAt ? { ...r, deletedAt: null } : r))
    )
    setGrades((current) =>
      current.map((g) => (g.deletedAt ? { ...g, deletedAt: null } : g))
    )
    await Promise.allSettled(
      ids.map((id) => syncApi("POST", `/api/portal/users/${id}/restore`))
    )
    addAuditLog("Restored all users from trash")
  }

  async function deleteAllUsersPermanently() {
    const trashed = users.filter((u) => u.deletedAt)
    const ids = trashed.map((u) => u.id)
    setUsers((current) => current.filter((u) => !u.deletedAt))
    setRoster((current) => current.filter((r) => !r.deletedAt))
    setGrades((current) => current.filter((g) => !g.deletedAt))
    await Promise.allSettled(
      ids.map((id) => syncApi("DELETE", `/api/portal/users/${id}/permanent`))
    )
    addAuditLog("Permanently deleted all users from trash")
  }

  function handleUpdateUser(updatedUser: UserRecord) {
    const oldUser = users.find((u) => u.id === updatedUser.id)
    const oldName = oldUser?.name

    setUsers((current) =>
      current.map((item) => (item.id === updatedUser.id ? updatedUser : item))
    )
    if (updatedUser.role === "student") {
      const section = updatedUser.section ?? ""
      setRoster((current) => {
        const exists = current.some((item) => item.id === updatedUser.id)
        if (!exists) {
          return [{ id: updatedUser.id, name: updatedUser.name, section, enrolled: updatedUser.status === "Active", curriculumId: updatedUser.curriculumId, curriculum: updatedUser.curriculum, currentYearLevel: updatedUser.currentYearLevel, currentSemester: updatedUser.currentSemester, studentType: updatedUser.studentType }, ...current]
        }
        return current.map((item) =>
          item.id === updatedUser.id
            ? { ...item, name: updatedUser.name, section, firstName: updatedUser.firstName, middleName: updatedUser.middleName, lastName: updatedUser.lastName, curriculumId: updatedUser.curriculumId, curriculum: updatedUser.curriculum, currentYearLevel: updatedUser.currentYearLevel, currentSemester: updatedUser.currentSemester, studentType: updatedUser.studentType }
            : item
        )
      })
      setGrades((current) =>
        current.map((grade) =>
          grade.studentId === updatedUser.id
            ? { ...grade, student: updatedUser.name, section }
            : grade
        )
      )
      syncApi("PUT", `/api/portal/roster/${updatedUser.id}`, {
        name: updatedUser.name, section,
        curriculumId: updatedUser.curriculumId,
        curriculum: updatedUser.curriculum,
        currentYearLevel: updatedUser.currentYearLevel,
        currentSemester: updatedUser.currentSemester,
        studentType: updatedUser.studentType,
      }).catch((e) =>
        console.error(`Failed to sync roster for ${updatedUser.id}:`, e)
      )
      for (const grade of grades) {
        if (grade.studentId === updatedUser.id) {
          syncApi("PUT", `/api/portal/grades/${grade.id}`, { student: updatedUser.name, section }).catch((e) =>
            console.error(`Failed to sync grade ${grade.id}:`, e)
          )
        }
      }
    }
    if (updatedUser.role === "faculty" && oldName && oldName !== updatedUser.name) {
      setClassSchedules((current) =>
        current.map((s) =>
          s.instructor === oldName ? { ...s, instructor: updatedUser.name } : s
        )
      )
      for (const schedule of classSchedules) {
        if (schedule.instructor === oldName) {
          syncApi("PUT", `/api/portal/schedules/${schedule.id}`, { instructor: updatedUser.name }).catch((e) =>
            console.error(`Failed to sync schedule ${schedule.id}:`, e)
          )
        }
      }
    }
    addAuditLog(`Updated account "${updatedUser.name}"`)
    syncApi("PUT", `/api/portal/users/${updatedUser.id}`, updatedUser).then(() =>
      toast.success(`User "${updatedUser.name}" updated.`)
    ).catch((e) => {
      toast.error("Failed to update user.")
      console.error(e)
    })
  }

  function handleChangeCurriculum(
    studentId: string,
    newCurriculumId: string,
    newYearLevel: string,
    newSemester: string,
    createHistory: boolean
  ) {
    const student = users.find((u) => u.id === studentId)
    if (!student) return

    const oldCurriculum = curricula.find((c) => c.id === student.curriculumId)
    const newCurriculum = curricula.find((c) => c.id === newCurriculumId)
    if (!newCurriculum) return

    const newCurriculumLabel = `${newCurriculum.name} - ${newCurriculum.major}`
    const existingHistory = student.gradeHistory ?? []

    const newHistory = createHistory && oldCurriculum
      ? (() => {
          const currentTermIdx = oldCurriculum.terms.findIndex(
            (t) => t.year === student.currentYearLevel && t.semester === student.currentSemester
          )
          const completedTerms = currentTermIdx >= 0
            ? oldCurriculum.terms.slice(0, currentTermIdx)
            : []

          const entries: GradeHistoryEntry[] = []
          for (const term of completedTerms) {
            for (const subj of term.subjects) {
              const exists = existingHistory.some(
                (g) => g.subjectCode === subj.code && g.yearLevel === term.year && g.semester === term.semester
              )
              if (exists) continue

              const gradeRecord = grades.find(
                (g) => g.studentId === studentId && g.code === subj.code
              )
              const midtermPct = gradeRecord?.midtermTransmuted ?? 0
              const finalPct = gradeRecord?.finalTransmuted ?? 0
              const finalPercentile = midtermPct || finalPct
                ? Number(((midtermPct + finalPct) / 2).toFixed(2))
                : 0
              const gradePct = gradeRecord?.gradePercentage
              const transmutedGrade = gradePct !== undefined
                ? transmutedToEquivalent(gradePct)
                : 0

              entries.push({
                subjectCode: subj.code,
                subjectName: subj.name,
                finalPercentile,
                transmutedGrade,
                remarks: gradeRecord?.remarks ?? "Passed",
                curriculumId: oldCurriculum.id,
                yearLevel: term.year,
                semester: term.semester,
                section: gradeRecord?.section ?? roster.find((r) => r.id === studentId)?.section ?? student.section,
                units: subj.total,
              })
            }
          }
          return entries
        })()
      : []

    const gradeHistory = [...existingHistory, ...newHistory]

    setUsers((current) =>
      current.map((u) =>
        u.id === studentId
          ? {
              ...u,
              curriculumId: newCurriculumId,
              curriculum: newCurriculumLabel,
              currentYearLevel: newYearLevel,
              currentSemester: newSemester,
              gradeHistory,
            }
          : u
      )
    )

    setRoster((current) =>
      current.map((r) =>
        r.id === studentId
          ? { ...r, curriculumId: newCurriculumId, curriculum: newCurriculumLabel, currentYearLevel: newYearLevel, currentSemester: newSemester }
          : r
      )
    )

    addAuditLog(
      `Changed curriculum for "${student.name}" from ${student.curriculum ?? "N/A"} to ${newCurriculumLabel}`
    )
    syncApi("PUT", `/api/portal/users/${studentId}`, {
      curriculumId: newCurriculumId,
      curriculum: newCurriculumLabel,
      currentYearLevel: newYearLevel,
      currentSemester: newSemester,
      gradeHistory,
    }).then(() =>
      toast.success("Curriculum changed.")
    ).catch((e) => {
      toast.error("Failed to change curriculum.")
      console.error(e)
    })
    syncApi("PUT", `/api/portal/roster/${studentId}`, {
      curriculumId: newCurriculumId,
      curriculum: newCurriculumLabel,
      currentYearLevel: newYearLevel,
      currentSemester: newSemester,
    }).catch((e) =>
      console.error(`Failed to sync roster for ${studentId}:`, e)
    )
  }

  function handleAddGradeHistory(studentId: string, entry: GradeHistoryEntry) {
    setUsers((current) =>
      current.map((u) =>
        u.id === studentId
          ? { ...u, gradeHistory: [...(u.gradeHistory ?? []), entry] }
          : u
      )
    )
    const student = users.find((u) => u.id === studentId)
    if (student) {
      const updated: UserRecord = {
        ...student,
        gradeHistory: [...(student.gradeHistory ?? []), entry],
      }
      syncApi("PUT", `/api/portal/users/${studentId}`, updated).then(() =>
        toast.success("Grade history added.")
      ).catch((e) => {
        toast.error("Failed to add grade history.")
        console.error(e)
      })
    }
  }

  function handleRemoveGradeHistory(studentId: string, index: number) {
    setUsers((current) =>
      current.map((u) =>
        u.id === studentId
          ? { ...u, gradeHistory: (u.gradeHistory ?? []).filter((_, i) => i !== index) }
          : u
      )
    )
    const student = users.find((u) => u.id === studentId)
    if (student) {
      const updated: UserRecord = {
        ...student,
        gradeHistory: (student.gradeHistory ?? []).filter((_, i) => i !== index),
      }
      syncApi("PUT", `/api/portal/users/${studentId}`, updated).then(() =>
        toast.success("Grade history removed.")
      ).catch((e) => {
        toast.error("Failed to remove grade history.")
        console.error(e)
      })
    }
  }

  function handleUpdateGradeHistory(studentId: string, index: number, entry: GradeHistoryEntry) {
    setUsers((current) =>
      current.map((u) =>
        u.id === studentId
          ? {
              ...u,
              gradeHistory: (u.gradeHistory ?? []).map((e, i) =>
                i === index ? entry : e
              ),
            }
          : u
      )
    )
    const student = users.find((u) => u.id === studentId)
    if (student) {
      const updated: UserRecord = {
        ...student,
        gradeHistory: (student.gradeHistory ?? []).map((e, i) =>
          i === index ? entry : e
        ),
      }
      syncApi("PUT", `/api/portal/users/${studentId}`, updated).then(() => {
        toast.success("Grade history updated.")
        addAuditLog(`Grade correction for ${student.name}: ${entry.subjectCode} — ${entry.subjectName} (${studentId}) — Reason: ${entry.editReason ?? "N/A"}`)
      }).catch((e) => {
        toast.error("Failed to update grade history.")
        console.error(e)
      })
    }
  }

  function confirmAndDeleteThesis(thesisId: string) {
    const thesis = theses.find((t) => t.id === thesisId)
    setPendingConfirm({
      title: "Move to Trash Bin",
      description: "Are you sure you want to move this thesis to the trash bin? You can restore it later.",
      variant: "destructive",
      confirmLabel: "Move to Trash",
      onConfirm: () => {
        setTheses((current) => current.filter((item) => item.id !== thesisId))
        if (thesis) {
          setTrashedTheses((current) => [
            { ...thesis, isDeleted: true, deletedAt: new Date().toISOString(), deletedBy: profile.name },
            ...current,
          ])
        }
        void syncApi("DELETE", `/api/portal/theses/${thesisId}`, { deletedBy: profile.name })
        addAuditLog(`Moved thesis "${thesisId}" to trash bin`)
        setPendingConfirm(null)
      },
    })
  }

  async function handleRestoreThesis(id: string) {
    const item = trashedTheses.find((t) => t.id === id)
    setTrashedTheses((current) => current.filter((t) => t.id !== id))
    try {
      await syncApi("PATCH", `/api/portal/theses/trash/${id}`)
      toast.success("Thesis restored successfully")
      if (item) {
        setTheses((current) => [{ ...item, isDeleted: false, deletedAt: null, deletedBy: undefined }, ...current])
        addAuditLog(`Restored thesis "${item.title}" from trash bin`)
      }
    } catch (e) {
      toast.error("Failed to restore thesis.")
      console.error(e)
    }
  }

  async function handlePermanentDeleteThesis(id: string) {
    const item = trashedTheses.find((t) => t.id === id)
    setTrashedTheses((current) => current.filter((t) => t.id !== id))
    try {
      await syncApi("DELETE", `/api/portal/theses/trash/${id}`)
      toast.success("Thesis permanently deleted.")
      if (item) addAuditLog(`Permanently deleted thesis "${item.title}"`)
    } catch (e) {
      toast.error("Failed to permanently delete thesis.")
      console.error(e)
    }
  }

  async function fetchTrashedTheses() {
    try {
      const res = await syncApi<{ data: ThesisRecord[] }>("GET", "/api/portal/theses/trash")
      setTrashedTheses(res.data ?? [])
    } catch (e) {
      console.error("Failed to fetch trashed theses", e)
    }
  }

  function undoTicketResolution(ticketId: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status: "In Progress", resolution: undefined, resolvedAt: undefined }
          : ticket
      )
    )
    syncApi("PUT", `/api/portal/feedback/${ticketId}`, { status: "In Progress", resolvedAt: null }).then(() =>
      toast.success("Ticket reopened.")
    ).catch((e) => {
      toast.error("Failed to reopen ticket.")
      console.error(e)
    })
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) addAuditLog(`Reopened ticket "${ticket.subject}"`)
  }

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setProfileDetails((current) => ({
        ...current,
        photoUrl: typeof reader.result === "string" ? reader.result : "",
        cloudinaryPublicId: "",
      }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile(draft: ProfileDetails) {
    const previousPhotoUrl = profileDetails.photoUrl
    const fullName = getProfileFullName(draft)
    const oldName = getProfileFullName(profileDetails)

    const body: Record<string, unknown> = {
      name: fullName,
      firstName: draft.firstName,
      middleName: draft.middleName,
      lastName: draft.lastName,
      email: draft.email,
      contactNumber: draft.contactNumber,
      sex: draft.sex,
      birthday: draft.birthday,
      address: draft.address,
    }
    if (draft.photoUrl !== previousPhotoUrl) {
      if (draft.photoUrl === "" && previousPhotoUrl) {
        body.removePhoto = true
      } else {
        body.photoUrl = draft.photoUrl
      }
    }

    const result = await syncApi<{ data: { photoUrl?: string; cloudinaryPublicId?: string } }>("PUT", `/api/portal/users/${profile.id}`, body)

    const photoUrl = result.data?.photoUrl ?? previousPhotoUrl
    const cloudinaryPublicId = result.data?.cloudinaryPublicId
    const savedProfile: ProfileDetails = { ...draft, photoUrl, cloudinaryPublicId }

    setProfileDetails(savedProfile)

    setUsers((current) =>
      current.map((user) =>
        user.id === profile.id
          ? {
              ...user,
              name: fullName || user.name,
              firstName: draft.firstName,
              middleName: draft.middleName,
              lastName: draft.lastName,
              email: draft.email,
              contactNumber: draft.contactNumber,
              sex: draft.sex,
              birthday: draft.birthday,
              address: draft.address,
              photoUrl,
              cloudinaryPublicId,
            }
          : user
      )
    )

    if (fullName) {
      setRoster((current) =>
        current.map((s) =>
          s.id === profile.id ? { ...s, name: fullName, firstName: draft.firstName, middleName: draft.middleName, lastName: draft.lastName } : s
        )
      )
      setGrades((current) =>
        current.map((grade) =>
          grade.studentId === profile.id ? { ...grade, student: fullName } : grade
        )
      )
      void syncApi("PUT", `/api/portal/roster/${profile.id}`, { name: fullName })
      for (const grade of grades) {
        if (grade.studentId === profile.id) {
          void syncApi("PUT", `/api/portal/grades/${grade.id}`, { student: fullName })
        }
      }
      if (oldName && oldName !== fullName) {
        setClassSchedules((current) =>
          current.map((s) =>
            s.instructor === oldName ? { ...s, instructor: fullName } : s
          )
        )
        for (const schedule of classSchedules) {
          if (schedule.instructor === oldName) {
            syncApi("PUT", `/api/portal/schedules/${schedule.id}`, { instructor: fullName })
              .catch((e) => console.error(`Failed to sync schedule ${schedule.id}:`, e))
          }
        }
      }
    }

    if (authenticatedUser) {
      setAuthenticatedUser({
        ...authenticatedUser,
        name: fullName || authenticatedUser.name,
        email: draft.email || authenticatedUser.email,
      })
    }

    return savedProfile
  }

  async function handleChangePassword(currentPassword: string, newPassword: string) {
    await syncApi("PUT", `/api/portal/users/${profile.id}`, {
      currentPassword,
      password: newPassword,
    })
  }

  function resetStudentDraft(section = activeClassSection) {
    setStudentDraft({ id: "", name: "", section })
    setEditingStudentId(null)
  }

  function startEditStudent(student: ClassStudent) {
    setStudentDraft({
      id: student.id,
      name: student.name,
      section: student.section,
    })
    setEditingStudentId(student.id)
  }

  function handleSaveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!studentDraft.id.trim() || !studentDraft.name.trim()) return

    setRoster((current) => {
      const exists = current.some((student) => student.id === editingStudentId)

      if (exists) {
        return current.map((student) =>
          student.id === editingStudentId
            ? {
                ...student,
                id: studentDraft.id.trim(),
                name: studentDraft.name.trim(),
                section: studentDraft.section,
              }
            : student
        )
      }

      return [
        {
          id: studentDraft.id.trim(),
          name: studentDraft.name.trim(),
          section: studentDraft.section,
          enrolled: true,
        },
        ...current,
      ]
    })

    setUsers((current) => {
      const exists = current.some((u) => u.id === studentDraft.id.trim())
      if (exists) {
        return current.map((u) =>
          u.id === studentDraft.id.trim()
            ? { ...u, name: studentDraft.name.trim(), section: studentDraft.section }
            : u
        )
      }
      return [
        {
          id: studentDraft.id.trim(),
          name: studentDraft.name.trim(),
          email: "",
          role: "student",
          firstName: studentDraft.name.trim().split(" ")[0] ?? "",
          lastName: studentDraft.name.trim().split(" ").slice(1).join(" ") ?? "",
          section: studentDraft.section,
          status: "Active",
        },
        ...current,
      ]
    })

    setGrades((current) =>
      current.map((grade) =>
        grade.studentId === editingStudentId
          ? {
              ...grade,
              studentId: studentDraft.id.trim(),
              student: studentDraft.name.trim(),
              section: studentDraft.section,
            }
          : grade
      )
    )

    resetStudentDraft(studentDraft.section)
  }

  function handleDeleteRosterStudent(studentId: string) {
    const student = roster.find((s) => s.id === studentId)
    setRoster((current) => current.filter((s) => s.id !== studentId))
    setGrades((current) => current.filter((g) => g.studentId !== studentId))
    syncApi("DELETE", `/api/portal/roster/${studentId}`).then(() =>
      toast.success(student ? `Student "${student.name}" removed from roster.` : "Student removed from roster.")
    ).catch((e) => {
      toast.error("Failed to remove student from roster.")
      console.error(e)
    })
    if (student) addAuditLog(`Removed student "${student.name}" from roster`)
  }

  function handleToggleEnrolled(studentId: string, enrolled: boolean) {
    setRoster((current) =>
      current.map((item) =>
        item.id === studentId ? { ...item, enrolled } : item
      )
    )
    setUsers((current) =>
      current.map((item) =>
        item.id === studentId
          ? { ...item, status: enrolled ? "Active" : "Inactive" }
          : item
      )
    )
    syncApi("PUT", `/api/portal/roster/${studentId}`, { enrolled }).then(() =>
      toast.success(enrolled ? "Student enrolled." : "Student unenrolled.")
    ).catch((e) => {
      toast.error("Failed to update enrollment.")
      console.error(e)
    })
  }

  function handleAddClassSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSectionName.trim()) return
    setYearSections((current) =>
      current.map((year) =>
        year.year === selectedClassYear
          ? {
              ...year,
              sections: Array.from(
                new Set([...year.sections, newSectionName.trim()])
              ),
            }
          : year
      )
    )
    setNewSectionName("")
    addAuditLog(`Added class section "${newSectionName.trim()}" for ${selectedClassYear}`)
    toast.success("Class section added.")
  }

  function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleDraft.section.trim() || !scheduleDraft.subject.trim()) return

    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    const sectionStr = scheduleDraft.section.trim()
    const subjectStr = scheduleDraft.subject.trim()
    const subjectCode = subjectStr.split(" - ")[0]?.trim() ?? subjectStr

    const newItem: ScheduleItem = {
      id: `SCH-${Date.now()}`,
      semesterId: scheduleDraft.semesterId,
      day: scheduleDraft.day.trim() || "TBA",
      time: scheduleDraft.time.trim() || "TBA",
      subject: subjectStr,
      room: scheduleDraft.room.trim() || "TBA",
      instructor: scheduleDraft.instructor.trim() || profile.name,
      section: sectionStr,
      curriculumId: scheduleDraft.curriculumId || undefined,
    }
    setClassSchedules((current) => [newItem, ...current])
    syncApi("POST", "/api/portal/schedules", newItem).then(() =>
      toast.success("Schedule created.")
    ).catch((e) => {
      toast.error("Failed to create schedule.")
      console.error(e)
    })

    for (const student of roster) {
      if (student.section === sectionStr && student.enrolled) {
        const exists = grades.some(
          (g) => g.studentId === student.id && g.subject === subjectStr && g.section === sectionStr
        )
        if (!exists) {
          const newId = `GRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const newGrade: GradeRecord = {
            id: newId,
            studentId: student.id,
            student: student.name,
            section: sectionStr,
            subject: subjectStr,
            code: subjectCode,
            units: 3,
            midtermTransmuted: undefined,
            midterm: 0,
            finalTransmuted: undefined,
            finalTerm: 0,
            released: false,
            updatedAt: now,
          }
          setGrades((current) => [newGrade, ...current])
          void syncApi("POST", "/api/portal/grades", newGrade)
        }
      }
    }

    setScheduleDraft({
      semesterId: scheduleDraft.semesterId,
      day: "",
      time: "",
      subject: "",
      room: "",
      instructor: "",
      section: activeClassSection,
      curriculumId: "",
    })
    addAuditLog(`Created schedule for "${scheduleDraft.subject}" (${scheduleDraft.section})`)
  }

  async function handleScheduleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedRows = await parseScheduleWorkbook(file)
      if (!importedRows.length) {
        toast.error("No schedule rows were found in the uploaded workbook.")
        return
      }

      const activeSemesterId = semesters.find((s) => s.status === "Active")?.id ?? ""

      setClassSchedules((current) => [
        ...importedRows.map((row, index) => ({
          id: `SCH-UP-${Date.now()}-${index}`,
          semesterId: activeSemesterId,
          ...row,
        })),
        ...current,
      ])
      setUploadName(file.name)
      addAuditLog(`Uploaded schedule workbook "${file.name}"`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to read the uploaded schedule workbook."
      )
    } finally {
      event.target.value = ""
    }
  }

  function handleUpdateSchedule(updated: ScheduleItem) {
    setClassSchedules((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    syncApi("PUT", `/api/portal/schedules/${updated.id}`, updated).then(() =>
      toast.success("Schedule updated.")
    ).catch((e) => {
      toast.error("Failed to update schedule.")
      console.error(e)
    })
    addAuditLog(`Updated schedule for "${updated.subject}"`)
  }

  function handleDeleteSchedule(id: string) {
    const item = classSchedules.find((s) => s.id === id)
    setClassSchedules((current) => current.filter((item) => item.id !== id))
    syncApi("DELETE", `/api/portal/schedules/${id}`).then(() =>
      toast.success("Schedule deleted.")
    ).catch((e) => {
      toast.error("Failed to delete schedule.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted schedule for "${item.subject}" (${item.section})`)
  }

  async function handleGradeWorkbookUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedRows = await parseGradeWorkbook(file)
      if (!importedRows.length) {
        toast.error("No grade rows were found in the uploaded workbook.")
        return
      }

      const knownStudents = new Map(
        roster.map((student) => [normalizeName(student.name), student])
      )
      const importedStudents = new Map<string, ClassStudent>()

      importedRows.forEach((row, index) => {
        const key = normalizeName(row.student)
        if (knownStudents.has(key) || importedStudents.has(key)) return

        importedStudents.set(key, {
          id: `UP-${String(Date.now()).slice(-5)}-${index + 1}`,
          name: row.student,
          section: row.section || activeGradeSection,
          enrolled: true,
        })
      })

      if (importedStudents.size) {
        setRoster((current) => [...Array.from(importedStudents.values()), ...current])
      }

      setGrades((current) => {
        const nextGrades = [...current]

        importedRows.forEach((row, index) => {
          const student =
            knownStudents.get(normalizeName(row.student)) ??
            importedStudents.get(normalizeName(row.student))

          if (!student) return

          const importedGrade = buildGradeFromImport(
            {
              ...row,
              section: row.section || activeGradeSection,
            },
            student.id,
            index
          )
          const existingIndex = nextGrades.findIndex(
            (grade) =>
              grade.studentId === student.id &&
              grade.section === importedGrade.section &&
              grade.code === importedGrade.code
          )

          if (existingIndex >= 0) {
            nextGrades[existingIndex] = {
              ...nextGrades[existingIndex],
              ...importedGrade,
              id: nextGrades[existingIndex].id,
            }
          } else {
            nextGrades.unshift(importedGrade)
          }
        })

        return nextGrades
      })

      setSelectedGradeSection(importedRows[0]?.section || activeGradeSection)
      setUploadName(file.name)
      addAuditLog(`Uploaded grade workbook "${file.name}" (${importedRows.length} students)`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to read the uploaded grade workbook."
      )
    } finally {
      event.target.value = ""
    }
  }

  function handleAddSemester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const semesterData = {
      id: `SEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      semester: newSemester.semester,
      schoolYearStart: newSemester.schoolYearStart,
      schoolYearEnd: newSemester.schoolYearEnd,
      status: newSemester.status,
      gradingPeriod: "Midterm" as const,
    }
    setSemesters((current) => [semesterData, ...current])
    setNewSemester({
      semester: "First Semester",
      schoolYearStart: new Date().getFullYear(),
      schoolYearEnd: new Date().getFullYear() + 1,
      status: "Active",
    })
    setShowAddSemesterForm(false)
    addAuditLog(`Created semester "${newSemester.semester}"`)
    syncApi("POST", "/api/portal/semesters", semesterData).then(() =>
      toast.success("Semester created.")
    ).catch((e) => {
      toast.error("Failed to create semester.")
      console.error(e)
    })
  }

  function handleUpdateSemester(updated: SemesterRecord) {
    setSemesters((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    syncApi("PUT", `/api/portal/semesters/${updated.id}`, updated).then(() =>
      toast.success("Semester updated.")
    ).catch((e) => {
      toast.error("Failed to update semester.")
      console.error(e)
    })
    addAuditLog(`Updated semester "${updated.semester}"`)
  }

  function handleDeleteSemester(id: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) => current.filter((s) => s.id !== id))
    syncApi("DELETE", `/api/portal/semesters/${id}`).then(() =>
      toast.success("Semester deleted.")
    ).catch((e) => {
      toast.error("Failed to delete semester.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted semester "${item.semester}"`)
  }

  function archiveSemester(id: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) =>
      current.map((s) => (s.id === id ? { ...s, status: "Archived" as const, archivedAt: new Date().toISOString() } : s))
    )
    syncApi("POST", `/api/portal/semesters/${id}/archive`).then(() =>
      toast.success("Semester archived.")
    ).catch((e) => {
      toast.error("Failed to archive semester.")
      console.error(e)
    })
    if (item) addAuditLog(`Archived semester "${item.semester}"`)
  }

  function unarchiveSemester(id: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) =>
      current.map((s) => (s.id === id ? { ...s, status: "Inactive" as const, archivedAt: undefined } : s))
    )
    syncApi("POST", `/api/portal/semesters/${id}/unarchive`).then(() =>
      toast.success("Semester unarchived.")
    ).catch((e) => {
      toast.error("Failed to unarchive semester.")
      console.error(e)
    })
    if (item) addAuditLog(`Unarchived semester "${item.semester}"`)
  }

  function activateSemester(id: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) =>
      current.map((s) => (s.id === id ? { ...s, status: "Active" as const } : { ...s, status: "Inactive" as const }))
    )
    syncApi("POST", `/api/portal/semesters/${id}/activate`).then(() =>
      toast.success("Semester activated.")
    ).catch((e) => {
      toast.error("Failed to activate semester.")
      console.error(e)
    })
    if (item) addAuditLog(`Activated semester "${item.semester}"`)
  }

  function setGradingPeriod(id: string, gradingPeriod: "Midterm" | "Final") {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) =>
      current.map((s) => (s.id === id ? { ...s, gradingPeriod } : s))
    )
    syncApi("PATCH", `/api/portal/semesters/${id}/grading-period`, { gradingPeriod }).then(() =>
      toast.success("Grading period updated.")
    ).catch((e) => {
      toast.error("Failed to update grading period.")
      console.error(e)
    })
    if (item) addAuditLog(`Set grading period to ${gradingPeriod} for "${item.semester}"`)
  }

  function setSemesterEndDate(id: string, endDate: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) =>
      current.map((s) => (s.id === id ? { ...s, endDate } : s))
    )
    syncApi("PATCH", `/api/portal/semesters/${id}/end-date`, { endDate }).then(() =>
      toast.success("Semester end date updated.")
    ).catch((e) => {
      toast.error("Failed to update end date.")
      console.error(e)
    })
    if (item) addAuditLog(`Set end date for "${item.semester}" to ${endDate}`)
  }

  const activeSemester = semesters.find((s) => s.status === "Active")
  const archivedSemesters = semesters.filter((s) => s.status === "Archived")

  function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSubject.code.trim() || !newSubject.name.trim()) return
    const subjectData: SubjectRecord = {
      id: `SUBJ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      curriculumId: newSubject.curriculumId,
      yearLevel: newSubject.yearLevel,
      semester: newSubject.semester,
      code: newSubject.code.trim().toUpperCase(),
      name: newSubject.name.trim(),
      type: newSubject.type,
      lectureUnits: newSubject.lectureUnits,
      labUnits: newSubject.labUnits,
      totalUnits: newSubject.totalUnits,
    }
    setSubjects((current) => [subjectData, ...current])
    setNewSubject({
      curriculumId: curricula[0]?.id ?? "",
      yearLevel: "1st Year",
      semester: "First Semester",
      code: "",
      name: "",
      type: "Lecture",
      lectureUnits: 3,
      labUnits: 0,
      totalUnits: 3,
    })
    setShowAddSubjectForm(false)
    addAuditLog(`Created subject "${newSubject.name}"`)
    syncApi("POST", "/api/portal/subjects", subjectData).then(() =>
      toast.success("Subject created.")
    ).catch((e) => {
      toast.error("Failed to create subject.")
      console.error(e)
    })
  }

  function handleUpdateSubject(updated: SubjectRecord) {
    setSubjects((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    syncApi("PUT", `/api/portal/subjects/${updated.id}`, updated).then(() =>
      toast.success("Subject updated.")
    ).catch((e) => {
      toast.error("Failed to update subject.")
      console.error(e)
    })
    addAuditLog(`Updated subject "${updated.name}"`)
  }

  function handleDeleteSubject(id: string) {
    const item = subjects.find((s) => s.id === id)
    setSubjects((current) => current.filter((s) => s.id !== id))
    syncApi("DELETE", `/api/portal/subjects/${id}`).then(() =>
      toast.success("Subject deleted.")
    ).catch((e) => {
      toast.error("Failed to delete subject.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted subject "${item.name}"`)
  }

  function handleAddTermToCurriculum(
    curriculumId: string,
    year: string,
    semester: string
  ) {
    setCurricula((current) =>
      current.map((curr) =>
        curr.id === curriculumId
          ? {
              ...curr,
              terms: [
                ...curr.terms,
                { year, semester, subjects: [] },
              ],
            }
          : curr
      )
    )
  }

  function handleDeleteTermFromCurriculum(
    curriculumId: string,
    termIndex: number
  ) {
    setCurricula((current) =>
      current.map((curr) =>
        curr.id === curriculumId
          ? {
              ...curr,
              terms: curr.terms.filter((_, i) => i !== termIndex),
            }
          : curr
      )
    )
  }

  function handleAddSubjectToTerm(
    curriculumId: string,
    termIndex: number,
    subject: { code: string; name: string; lec: number; lab: number; total: number }
  ) {
    setCurricula((current) =>
      current.map((curr) =>
        curr.id === curriculumId
          ? {
              ...curr,
              terms: curr.terms.map((term, i) =>
                i === termIndex
                  ? { ...term, subjects: [...term.subjects, subject] }
                  : term
              ),
            }
          : curr
      )
    )
  }

  function handleUpdateSubjectInTerm(
    curriculumId: string,
    termIndex: number,
    subjectIndex: number,
    subject: { code: string; name: string; lec: number; lab: number; total: number }
  ) {
    setCurricula((current) =>
      current.map((curr) =>
        curr.id === curriculumId
          ? {
              ...curr,
              terms: curr.terms.map((term, i) =>
                i === termIndex
                  ? {
                      ...term,
                      subjects: term.subjects.map((s, j) =>
                        j === subjectIndex ? subject : s
                      ),
                    }
                  : term
              ),
            }
          : curr
      )
    )
  }

  function handleDeleteSubjectFromTerm(
    curriculumId: string,
    termIndex: number,
    subjectIndex: number
  ) {
    setCurricula((current) =>
      current.map((curr) =>
        curr.id === curriculumId
          ? {
              ...curr,
              terms: curr.terms.map((term, i) =>
                i === termIndex
                  ? {
                      ...term,
                      subjects: term.subjects.filter((_, j) => j !== subjectIndex),
                    }
                  : term
              ),
            }
          : curr
      )
    )
  }

  function handleAddCurriculum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newCurriculum.name.trim() || !newCurriculum.major.trim()) return
    setCurricula((current) => [
      {
        id: `CURR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: newCurriculum.name.trim(),
        major: newCurriculum.major.trim(),
        totalUnits: Number(newCurriculum.totalUnits) || 0,
        status: "Active",
        terms: [],
      },
      ...current,
    ])
    setNewCurriculum({ name: "", major: "", totalUnits: "0" })
    addAuditLog(`Created curriculum "${newCurriculum.name}" (${newCurriculum.major})`)
    toast.success("Curriculum created.")
  }

  function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!feedbackDraft.subject.trim() || !feedbackDraft.description.trim()) {
      return
    }
    const id = `FB-${Date.now()}`
    const newItem = {
      id,
      studentId: feedbackDraft.anonymous ? undefined : profile.id,
      studentName: feedbackDraft.anonymous
        ? "Anonymous"
        : profile.name,
      category: feedbackDraft.category,
      subject: feedbackDraft.subject.trim(),
      description: feedbackDraft.description.trim(),
      status: "Pending" as const,
      submittedAt: "May 26, 2026",
      assignedTo: "Admin",
      anonymous: feedbackDraft.anonymous,
    }
    setTickets((current) => [newItem, ...current])
    void syncApi("POST", "/api/portal/feedback", newItem)
    setFeedbackDraft({
      category: "Academic",
      subject: "",
      description: "",
      anonymous: false,
    })
    addAuditLog(`Submitted feedback ticket "${feedbackDraft.subject}"`)
    toast.success("Feedback submitted.")
  }

  function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!eventDraft.title.trim() || !eventDraft.date.trim()) return
    const newItem = {
      id: `SEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: eventDraft.title.trim(),
      speaker: eventDraft.speaker.trim() || "To be announced",
      date: eventDraft.date.trim(),
      location: eventDraft.location.trim() || "CS Department",
      description: "New seminar created from the admin event manager.",
      capacity: Number(eventDraft.capacity) || 30,
      enlistedStudentIds: [] as string[],
      host: profile.name,
      status: "Active" as const,
    }
    setSeminars((current) => [newItem, ...current])
    syncApi("POST", "/api/portal/seminars", newItem).then(() =>
      toast.success("Event created.")
    ).catch((e) => {
      toast.error("Failed to create event.")
      console.error(e)
    })
    setEventDraft({
      title: "",
      speaker: "",
      date: "",
      location: "",
      capacity: "30",
    })
    addAuditLog(`Created event "${eventDraft.title}"`)
  }

  function handleDeleteCurriculum(id: string) {
    const item = curricula.find((c) => c.id === id)
    setCurricula((current) => current.filter((c) => c.id !== id))
    syncApi("DELETE", `/api/portal/curricula/${id}`).then(() =>
      toast.success("Curriculum deleted.")
    ).catch((e) => {
      toast.error("Failed to delete curriculum.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted curriculum "${item.name}"`)
  }

  function handleUpdateCurriculum(updated: CurriculumRecord) {
    setCurricula((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    syncApi("PUT", `/api/portal/curricula/${updated.id}`, updated).then(() =>
      toast.success("Curriculum updated.")
    ).catch((e) => {
      toast.error("Failed to update curriculum.")
      console.error(e)
    })
    addAuditLog(`Updated curriculum "${updated.name}"`)
  }

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!announcementDraft.title.trim() || !announcementDraft.content.trim()) {
      return
    }
    const newItem = {
      id: `ANN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: announcementDraft.title.trim(),
      content: announcementDraft.content.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      audience: announcementDraft.audience,
      priority: announcementDraft.priority,
      classSection: announcementDraft.classSections[0] || undefined,
      classSections: announcementDraft.classSections,
      createdBy: profile.name,
    }
    try {
      await syncApi("POST", "/api/portal/announcements", newItem)
      setAnnouncements((current) => [newItem, ...current])
      toast.success("Announcement created.")
    } catch (e) {
      toast.error("Failed to create announcement.")
      console.error(e)
      return
    }
    setAnnouncementDraft({
      title: "",
      content: "",
      audience: "All Users",
      priority: "Medium",
      classSections: [],
    })
    setShowAnnouncementForm(false)
    addAuditLog(`Created announcement "${announcementDraft.title}"`)
  }

  function handleUpdateAnnouncement(updated: Announcement) {
    setAnnouncements((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    syncApi("PUT", `/api/portal/announcements/${updated.id}`, updated).then(() =>
      toast.success("Announcement updated.")
    ).catch((e) => {
      toast.error("Failed to update announcement.")
      console.error(e)
    })
    addAuditLog(`Updated announcement "${updated.title}"`)
  }

  function handleDeleteAnnouncement(id: string, deletedBy?: string) {
    const item = announcements.find((a) => a.id === id)
    setAnnouncements((current) => current.filter((a) => a.id !== id))
    syncApi("DELETE", `/api/portal/announcements/${id}`, { deletedBy }).then(() =>
      toast.success("Moved to Trash Bin successfully")
    ).catch((e) => {
      toast.error("Failed to delete announcement.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted announcement "${item.title}"`)
  }

  async function handleRestoreAnnouncement(id: string) {
    const item = trashedAnnouncements.find((a) => a.id === id)
    setTrashedAnnouncements((current) => current.filter((a) => a.id !== id))
    try {
      await syncApi("PATCH", `/api/portal/announcements/trash/${id}`)
      toast.success("Restored successfully")
      if (item) {
        setAnnouncements((current) => [{ ...item, isDeleted: false, deletedAt: null, deletedBy: undefined }, ...current])
        addAuditLog(`Restored announcement "${item.title}"`)
      }
    } catch (e) {
      toast.error("Failed to restore announcement.")
      console.error(e)
    }
  }

  async function handlePermanentDeleteAnnouncement(id: string) {
    const item = trashedAnnouncements.find((a) => a.id === id)
    setTrashedAnnouncements((current) => current.filter((a) => a.id !== id))
    try {
      await syncApi("DELETE", `/api/portal/announcements/trash/${id}`)
      toast.success("Permanently deleted successfully")
      if (item) addAuditLog(`Permanently deleted announcement "${item.title}"`)
    } catch (e) {
      toast.error("Failed to permanently delete announcement.")
      console.error(e)
    }
  }

  async function fetchTrashedAnnouncements() {
    try {
      const res = await syncApi<{ data: Announcement[] }>("GET", "/api/portal/announcements/trash")
      setTrashedAnnouncements(res.data ?? [])
    } catch (e) {
      console.error("Failed to fetch trashed announcements", e)
    }
  }

  async function handleCreateQuickLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quickLinkDraft.label.trim()) return
    if (quickLinkDraft.type === "link" && !quickLinkDraft.href.trim()) return
    if (quickLinkDraft.type === "file" && !quickLinkDraft.fileData) return

    const payload: Record<string, unknown> = {
      label: quickLinkDraft.label.trim(),
      href: quickLinkDraft.type === "file" ? quickLinkDraft.fileData : quickLinkDraft.href.trim(),
      type: quickLinkDraft.type,
      fileName: quickLinkDraft.fileName || undefined,
      fileSize: quickLinkDraft.fileSize || undefined,
      imageData: quickLinkDraft.imageData || undefined,
    }

    const result = await syncApi<{ data: QuickLinkRecord }>("POST", "/api/portal/quick-links", payload)
    if (result.data) {
      setQuickLinks((current) => [result.data, ...current])
    }

    setQuickLinkDraft({ label: "", href: "", type: "link", fileName: "", fileSize: 0, fileData: "", imageData: "" })
    setShowQuickLinkForm(false)
    addAuditLog(`Created quick link "${quickLinkDraft.label}"`)
    toast.success("Quick link created.")
  }

  function handleUpdateQuickLink(updated: QuickLinkRecord & { imageData?: string; removeImage?: boolean }) {
    setQuickLinks((current) =>
      current.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
    )
    const payload: Record<string, unknown> = {
      label: updated.label,
      href: updated.href,
      imageData: updated.imageData || undefined,
      removeImage: updated.removeImage || undefined,
    }
    syncApi("PUT", `/api/portal/quick-links/${updated._id}`, payload).then(() =>
      toast.success("Quick link updated.")
    ).catch((e) => {
      toast.error("Failed to update quick link.")
      console.error(e)
    })
    addAuditLog(`Updated quick link "${updated.label}"`)
  }

  function handleDeleteQuickLink(id: string) {
    const item = quickLinks.find((ql) => ql._id === id)
    setQuickLinks((current) => current.filter((ql) => ql._id !== id))
    syncApi("DELETE", `/api/portal/quick-links/${id}`).then(() =>
      toast.success("Quick link deleted.")
    ).catch((e) => {
      toast.error("Failed to delete quick link.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted quick link "${item.label}"`)
  }

  function handleDeleteDownloadable(id: string) {
    const item = downloadables.find((d) => d._id === id)
    setDownloadables((current) => current.filter((d) => d._id !== id))
    syncApi("DELETE", `/api/portal/downloadables/${id}`).then(() =>
      toast.success("Downloadable deleted.")
    ).catch((e) => {
      toast.error("Failed to delete downloadable.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted downloadable "${item.label}"`)
  }

  async function handleUploadStudentManual(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const fileData = typeof reader.result === "string" ? reader.result : ""
          const payload = {
            label: "ISPSC Student Manual",
            href: fileData,
            type: "file",
            fileName: file.name,
            fileSize: file.size,
          }
          const result = await syncApi<{ data: QuickLinkRecord }>("POST", "/api/portal/quick-links", payload)
          if (result.data) {
            setQuickLinks((current) => [result.data, ...current])
          }
          addAuditLog(`Uploaded ISPSC Student Manual`)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  function handleEnlist(eventId: string) {
    const studentId = profile.id
    let updatedEvent: Record<string, unknown> | null = null
    setSeminars((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event
        const alreadyEnlisted = event.enlistedStudentIds.includes(studentId)
        if (alreadyEnlisted) {
          updatedEvent = { enlistedStudentIds: event.enlistedStudentIds.filter((id) => id !== studentId) }
          return { ...event, ...updatedEvent }
        }
        if (event.enlistedStudentIds.length >= event.capacity) return event
        updatedEvent = { enlistedStudentIds: [...event.enlistedStudentIds, studentId] }
        return { ...event, ...updatedEvent }
      })
    )
    if (updatedEvent) {
      const isEnlisting = !seminars.find((e) => e.id === eventId)?.enlistedStudentIds.includes(profile.id)
      syncApi("PUT", `/api/portal/seminars/${eventId}`, updatedEvent).then(() =>
        toast.success(isEnlisting ? "Enlisted in event." : "Unenlisted from event.")
      ).catch((e) => {
        toast.error("Failed to update enlistment.")
        console.error(e)
      })
    }
  }

  function handleFacultySelfStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const facultyMember = faculty.find((f) => f.email === profile.email)
    if (facultyMember) {
      updateFacultyStatus(facultyMember.id, myFacultyStatus, myFacultyNotes)
    }
  }

  function handleCreateCsoReport(report: CsoReport) {
    setCsoReports((current) => [report, ...current])
    syncApi("POST", "/api/portal/cso-reports", report).then(() =>
      toast.success("CSO report created.")
    ).catch((e) => {
      toast.error("Failed to create CSO report.")
      console.error(e)
    })
    addAuditLog(`Created CSO report "${report.title}"`)
  }

  function handleUpdateCsoReport(report: CsoReport) {
    setCsoReports((current) =>
      current.map((r) => (r.id === report.id ? report : r))
    )
    syncApi("PUT", `/api/portal/cso-reports/${report.id}`, report).then(() =>
      toast.success("CSO report updated.")
    ).catch((e) => {
      toast.error("Failed to update CSO report.")
      console.error(e)
    })
    addAuditLog(`Updated CSO report "${report.title}"`)
  }

  function handleDeleteCsoReport(id: string) {
    const item = csoReports.find((r) => r.id === id)
    setCsoReports((current) => current.filter((r) => r.id !== id))
    syncApi("DELETE", `/api/portal/cso-reports/${id}`).then(() =>
      toast.success("CSO report deleted.")
    ).catch((e) => {
      toast.error("Failed to delete CSO report.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted CSO report "${item.title}"`)
  }

  async function handleUpdateCsoInfo(data: CsoInfoRecord) {
    const existing = csoInfo
    try {
      const res = await fetch("/api/portal/cso-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to update CSO info.")
      setCsoInfo(json.data as CsoInfoRecord)
      toast.success("CSO info updated.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update CSO info.")
      if (existing) setCsoInfo(existing)
      console.error(e)
    }
    addAuditLog("Updated CSO info")
  }

  function handleCreateGalleryItem(item: GalleryItem) {
    setGalleryItems((current) => [item, ...current])
    syncApi("POST", "/api/portal/gallery", item).then((result: unknown) => {
      const res = result as { data?: GalleryItem }
      if (res?.data) {
        setGalleryItems((current) =>
          current.map((g) => (g.id === item.id ? res.data! : g))
        )
      }
    }).catch((e) => {
      toast.error("Failed to create gallery item.")
      console.error(e)
    })
    addAuditLog(`Created gallery item "${item.title}"`)
  }

  function handleUpdateGalleryItem(id: string, updated: GalleryItem) {
    setGalleryItems((current) =>
      current.map((item) => (item._id === id || item.id === id ? { ...item, ...updated } : item))
    )
    syncApi("PUT", `/api/portal/gallery/${id}`, updated).then(() =>
      toast.success("Gallery item updated.")
    ).catch((e) => {
      toast.error("Failed to update gallery item.")
      console.error(e)
    })
    addAuditLog(`Updated gallery item "${updated.title}"`)
  }

  function handleDeleteGalleryItem(id: string) {
    const item = galleryItems.find((g) => g._id === id)
    setGalleryItems((current) => current.filter((g) => g._id !== id))
    syncApi("DELETE", `/api/portal/gallery/${id}`).then(() =>
      toast.success("Gallery item deleted.")
    ).catch((e) => {
      toast.error("Failed to delete gallery item.")
      console.error(e)
    })
    if (item) addAuditLog(`Deleted gallery item "${item.title}"`)
  }

  return {
    role,
    activeModule,
    setActiveModule,
    sidebarOpen,
    setSidebarOpen,
    query,
    setQuery,
    users,
    setUsers,
    faculty,
    setFaculty,
    grades,
    setGrades,
    theses,
    setTheses,
    trashedTheses,
    setTrashedTheses,
    seminars,
    setSeminars,
    tickets,
    setTickets,
    announcements,
    setAnnouncements,
    roster,
    setRoster,
    semesters,
    setSemesters,
    subjects,
    setSubjects,
    curricula,
    setCurricula,
    yearSections,
    setYearSections,
    classSchedules,
    setClassSchedules,
    roleFilter,
    setRoleFilter,
    selectedAcademicSection,
    setSelectedAcademicSection,
    showAddSemesterForm,
    setShowAddSemesterForm,
    showAddSubjectForm,
    setShowAddSubjectForm,
    newSemester,
    setNewSemester,
    newSubject,
    setNewSubject,
    selectedClassYear,
    setSelectedClassYear,
    selectedClassSection: activeClassSection,
    setSelectedClassSection,
    selectedGradeSection: activeGradeSection,
    setSelectedGradeSection,
    selectedCurriculumId,
    setSelectedCurriculumId,
    curriculumFilter,
    setCurriculumFilter,
    showThesisUploadForm,
    setShowThesisUploadForm,
    showThesisTrash,
    setShowThesisTrash,
    showAnnouncementForm,
    setShowAnnouncementForm,
    newSectionName,
    setNewSectionName,
    studentDraft,
    setStudentDraft,
    editingStudentId,
    setEditingStudentId,
    scheduleDraft,
    setScheduleDraft,
    newCurriculum,
    setNewCurriculum,
    thesisYearFilter,
    setThesisYearFilter,
    thesisCategoryFilter,
    setThesisCategoryFilter,
    uploadName,
    setUploadName,
    newUser,
    setNewUser,
    feedbackDraft,
    setFeedbackDraft,
    eventDraft,
    setEventDraft,
    thesisDraft,
    setThesisDraft,
    announcementDraft,
    setAnnouncementDraft,
    myFacultyStatus,
    setMyFacultyStatus,
    myFacultyNotes,
    setMyFacultyNotes,
    profileDetails,
    setProfileDetails,
    profilePhotoUrl,
    profile,
    profileSection,
    navigation,
    userStats,
    allClassSections,
    facultyClassSections,
    facultyClassStudents,
    facultyGradeRecords,
    facultySubjects,
    visibleSchedules,
    selectedScheduleEntry,
    setSelectedScheduleEntry,
    selectedScheduleStudents,
    selectedScheduleGrades,
    studentGrades,
    allStudentGrades,
    gradeAverage,
    filteredTheses,
    filteredSeminars,
    filteredAnnouncements,
    filteredCsoReports,
    filteredTickets,
    filteredFaculty,
    filteredUsers,
    deletedUsers,
    trashView,
    setTrashView,
    studentTickets,
    auditLogs,
    setAuditLogs,
    csoInfo,
    setCsoInfo,
    csoReports,
    setCsoReports,
    quickLinks,
    setQuickLinks,
    downloadables,
    setDownloadables,
    galleryItems,
    setGalleryItems,
    quickLinkDraft,
    setQuickLinkDraft,
    showQuickLinkForm,
    setShowQuickLinkForm,
    handleCreateQuickLink,
    handleUpdateQuickLink,
    handleDeleteQuickLink,
    handleDeleteDownloadable,
    handleUploadStudentManual,
    handleToggleCsoOfficer,
    canManageCso,
    selectedNav,
    currentTitle,
    selectModule,
    handleLogout,
    downloadGradeReport,
    downloadGradeReportDocument,
    downloadGradeTemplate,
    downloadUserTemplate,
    downloadAttendees,
    downloadThesisDetails,
    updateGrade,
    updateGradeRemarks,
    refreshDashboardData,
    releaseGradesForSection,
    handleCreateGrade,
    handleUnenrollFromSubject,
    handleAddStudentToSubject,
    handleUpsertCompletedGrade,
    handleDeleteCompletedGrade,
    updateTicketStatus,
    updateFacultyStatus,
    deleteFacultyMember,
    syncFacultyFromUsers,
    pendingConfirm,
    setPendingConfirm,
    confirmAndToggleUserStatus,
    toggleUserStatus,
    confirmAndDeleteUser,
    deleteUser,
    restoreUser,
    permanentlyDeleteUser,
    restoreAllUsers,
    deleteAllUsersPermanently,
    handleUpdateUser,
    confirmAndDeleteThesis,
    handleRestoreThesis,
    handlePermanentDeleteThesis,
    fetchTrashedTheses,
    undoTicketResolution,
    handleSaveProfile,
    handleChangePassword,
    handleProfilePhotoChange,
    resetStudentDraft,
    startEditStudent,
    handleSaveStudent,
    handleDeleteRosterStudent,
    handleToggleEnrolled,
    handleAddClassSection,
    handleCreateSchedule,
    handleUpdateSchedule,
    handleDeleteSchedule,
    handleScheduleUpload,
    handleGradeWorkbookUpload,
    handleAddSemester,
    handleUpdateSemester,
    handleDeleteSemester,
    archiveSemester,
    unarchiveSemester,
    activateSemester,
    setGradingPeriod,
    setSemesterEndDate,
    activeSemester,
    archivedSemesters,
    handleAddSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    handleDeleteCurriculum,
    handleUpdateCurriculum,
    handleAddTermToCurriculum,
    handleDeleteTermFromCurriculum,
    handleAddSubjectToTerm,
    handleUpdateSubjectInTerm,
    handleDeleteSubjectFromTerm,
    handleAddCurriculum,
    handleChangeCurriculum,
    handleAddGradeHistory,
    handleRemoveGradeHistory,
    handleUpdateGradeHistory,
    profileStudentType: profileUser?.studentType,
    profileCurrentYearLevel: profileUser?.currentYearLevel,
    handleAddUser,
    handleFeedbackSubmit,
    handleCreateEvent,
    handleCreateAnnouncement,
    handleUpdateAnnouncement,
    handleDeleteAnnouncement,
    handleRestoreAnnouncement,
    handlePermanentDeleteAnnouncement,
    fetchTrashedAnnouncements,
    trashedAnnouncements,
    setTrashedAnnouncements,
    handleEnlist,
    handleFacultySelfStatus,
    handleCreateCsoReport,
    handleUpdateCsoReport,
    handleDeleteCsoReport,
    handleUpdateCsoInfo,
    handleCreateGalleryItem,
    handleUpdateGalleryItem,
    handleDeleteGalleryItem,
  }
}

export type PortalDashboardModel = ReturnType<typeof usePortalDashboardModel>
