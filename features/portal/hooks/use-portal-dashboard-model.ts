"use client"

import { useRouter } from "next/navigation"
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react"

import { initialModule, roleNavigation } from "../config/navigation"
import type { AuditLogRecord } from "@/lib/types/audit-log"
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
import type { SemesterRecord, SubjectRecord } from "@/lib/types"
import { csvEscape, downloadFile } from "../lib/downloads"
import { calculateFinalGrade, transmutedToEquivalent } from "../lib/grades"
import { parseGradeWorkbook, parseScheduleWorkbook } from "../lib/xlsx"
import type { ModuleId } from "../types/navigation"

type SessionUser = {
  name: string
  email: string
  id: string
  role: Role
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
    updatedAt: new Date(),
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
  const [seminars, setSeminars] = useState<SeminarRecord[]>([])
  const [tickets, setTickets] = useState<FeedbackTicket[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [roster, setRoster] = useState<ClassStudent[]>([])
  const [semesters, setSemesters] = useState<SemesterRecord[]>([])
  const [subjects, setSubjects] = useState<SubjectRecord[]>([])
  const [curricula, setCurricula] = useState<CurriculumRecord[]>([])
  const [yearSections, setYearSections] = useState<YearSectionRecord[]>([])
  const [classSchedules, setClassSchedules] = useState<ScheduleItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [csoReports, setCsoReports] = useState<CsoReport[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLinkRecord[]>([])

  const [roleFilter, setRoleFilter] = useState("All")
  const [selectedAcademicSection, setSelectedAcademicSection] =
    useState("Semesters")
  const [selectedClassYear, setSelectedClassYear] = useState("First Year")
  const [selectedClassSection, setSelectedClassSection] = useState("")
  const [selectedGradeSection, setSelectedGradeSection] = useState("")
  const [selectedScheduleEntry, setSelectedScheduleEntry] = useState<ScheduleItem | null>(null)
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("")
  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [showThesisUploadForm, setShowThesisUploadForm] = useState(false)
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
          return { ...entry, name: newName, section: newSection }
        }
        return entry
      })

      const missing = users.filter(
        (u) => u.role === "student" && u.section && !rosterIds.has(u.id)
      )
      if (missing.length > 0) {
        changed = true
        const newEntries = missing.map((u) => ({
          id: u.id, name: u.name, section: u.section ?? "", enrolled: u.status === "Active"
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
    name: "", email: "", id: "", role, title: "",
  } as SessionUser

  const profileUser = users.find((user) => user.id === profile.id)
  useEffect(() => {
    if (!authenticatedUser) return
    const nameParts = splitProfileName(authenticatedUser.name)
    queueMicrotask(() =>
      setProfileDetails({
        photoUrl: profileUser?.photoUrl ?? "",
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

  const profileSection = roster.find((s) => s.id === profile.id && s.enrolled)?.section ?? profileUser?.section ?? ""
  const visibleSchedules = useMemo(() => {
    if (role === "faculty") {
      const facultyName = profileUser?.name ?? profile.name
      return classSchedules.filter((item) =>
        item.instructor === facultyName
      )
    }
    if (role === "student" && profileSection) {
      return classSchedules.filter((item) => item.section.includes(profileSection))
    }
    return classSchedules
  }, [classSchedules, role, profileSection, profileUser, profile.name])

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
        (grade) => grade.studentId === profile.id && grade.released === true
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
    () => grades.filter((grade) => grade.studentId === profile.id),
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

  const filteredFaculty = useMemo(() => {
    const search = query.toLowerCase()
    return faculty.filter((member) =>
      [member.name, member.position, member.role, member.status, member.notes]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [faculty, query])

  const filteredUsers = useMemo(() => {
    const search = query.toLowerCase()
    const seen = new Set<string>()
    return users.filter((user) => {
      if (seen.has(user.id)) return false
      seen.add(user.id)
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

  const selectedNav = navigation.find((item) => item.id === activeModule)
  const currentTitle = selectedNav?.label ?? "Dashboard"

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
      ["Subject", "Code", "Units", "Midterm", "Final Term", "Final Grade"],
      ...studentGrades.map((grade) => [
        grade.subject,
        grade.code,
        grade.units,
        grade.midterm,
        grade.finalTerm,
        calculateFinalGrade(grade),
      ]),
    ]
    downloadFile(
      "student-grade-report.csv",
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

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
    field: "midterm" | "finalTerm",
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

  function releaseGradesForSection(section: string, subject?: string) {
    const label = subject ? `${section} - ${subject}` : section
    const approved = window.confirm(
      `Release grades for ${label} to students?`
    )
    if (!approved) return

    setGrades((current) =>
      current.map((grade) =>
        grade.section === section && (!subject || grade.subject === subject)
          ? { ...grade, released: true }
          : grade
      )
    )
    void syncApi("POST", "/api/portal/grades/release", { section, subject })
    addAuditLog(`Released grades for ${label}`)
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
      code: selectedScheduleEntry.subject,
      units: 3,
      midtermTransmuted: undefined,
      midterm: 0,
      finalTransmuted: undefined,
      finalTerm: 0,
      released: false,
      updatedAt: new Date(),
    }
    setGrades((current) => [newGrade, ...current])
    void syncApi("POST", "/api/portal/grades", newGrade)
  }

  function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    resolution?: string
  ) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status, resolution: resolution ?? ticket.resolution }
          : ticket
      )
    )
    void syncApi("PUT", `/api/portal/feedback/${ticketId}`, { status, resolution })
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) addAuditLog(`Updated ticket "${ticket.subject}" to ${status}`)
  }

  function updateFacultyStatus(
    facultyId: string,
    status: AvailabilityStatus,
    notes?: string
  ) {
    setFaculty((current) =>
      current.map((member) =>
        member.id === facultyId
          ? { ...member, status, notes: notes ?? member.notes }
          : member
      )
    )
    void syncApi("PUT", `/api/portal/faculty/${facultyId}`, { status, notes })
    const member = faculty.find((f) => f.id === facultyId)
    if (member) addAuditLog(`Updated faculty status for "${member.name}" to ${status}`)
  }

  function deleteFacultyMember(facultyId: string) {
    const member = faculty.find((f) => f.id === facultyId)
    setFaculty((current) => current.filter((item) => item.id !== facultyId))
    void syncApi("DELETE", `/api/portal/faculty/${facultyId}`)
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
    setAuditLogs((current) => [
      {
        id: `LOG-${String(current.length + 1).padStart(3, "0")}`,
        actor: profileName || profile.name,
        action,
        time,
      },
      ...current,
    ])
  }

  function handleAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) return
    const fullName = [newUser.firstName, newUser.middleName, newUser.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ")
    const accountId = newUser.idNumber.trim() || `USR-${String(users.length + 1).padStart(3, "0")}`
    if (users.some((u) => u.id === accountId)) {
      alert(`An account with ID "${accountId}" already exists.`)
      return
    }
    if (users.some((u) => u.email.toLowerCase() === newUser.email.trim().toLowerCase())) {
      alert(`An account with email "${newUser.email.trim()}" already exists.`)
      return
    }
    if (newUser.role === "student" && roster.some((r) => r.id === accountId)) {
      alert(`A roster entry with ID "${accountId}" already exists.`)
      return
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
        studentType:
          newUser.role === "student"
            ? (newUser.studentType as UserRecord["studentType"])
            : undefined,
        curriculum:
          newUser.role === "student" ? newUser.curriculum : undefined,
        curriculumId:
          newUser.role === "student" ? newUser.curriculumId : undefined,
        currentYearLevel:
          newUser.role === "student" ? newUser.currentYearLevel : undefined,
        currentSemester:
          newUser.role === "student" ? newUser.currentSemester : undefined,
        course: newUser.role === "student" ? "BSCS" : undefined,
        year: newUser.role === "student" ? Number(newUser.year) : undefined,
        section: newUser.role === "student" ? newUser.section : undefined,
        advisoryClass:
          newUser.role === "faculty" && newUser.hasAdvisory ? newUser.advisoryClass : undefined,
        employmentType:
          newUser.role === "faculty"
            ? (newUser.employmentType as UserRecord["employmentType"])
            : undefined,
        academicTitle:
          newUser.role === "faculty" ? newUser.academicTitle : undefined,
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
        return [{ id: accountId, name: fullName, section: newUser.section, enrolled: true }, ...current]
      })
      syncApi("POST", "/api/portal/roster", { id: accountId, name: fullName, section: newUser.section, enrolled: true }).catch((e) =>
        console.error(`Failed to sync roster for ${accountId}:`, e)
      )
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

    addAuditLog(`Created ${newUser.role} account "${fullName}" (${newUser.email})`)
    syncApi("POST", "/api/portal/users", {
      id: accountId,
      name: fullName,
      email: newUser.email.trim().toLowerCase(),
      role: newUser.role,
      sex: newUser.sex,
      firstName: newUser.firstName.trim(),
      middleName: newUser.middleName.trim(),
      lastName: newUser.lastName.trim(),
      studentType:
        newUser.role === "student"
          ? (newUser.studentType as UserRecord["studentType"])
          : undefined,
      curriculum:
        newUser.role === "student" ? newUser.curriculum : undefined,
      curriculumId:
        newUser.role === "student" ? newUser.curriculumId : undefined,
      currentYearLevel:
        newUser.role === "student" ? newUser.currentYearLevel : undefined,
      currentSemester:
        newUser.role === "student" ? newUser.currentSemester : undefined,
      course: newUser.role === "student" ? "BSCS" : undefined,
      year: newUser.role === "student" ? Number(newUser.year) : undefined,
      section: newUser.role === "student" ? newUser.section : undefined,
      advisoryClass:
        newUser.role === "faculty" && newUser.hasAdvisory ? newUser.advisoryClass : undefined,
      employmentType:
        newUser.role === "faculty"
          ? (newUser.employmentType as UserRecord["employmentType"])
          : undefined,
      academicTitle:
        newUser.role === "faculty" ? newUser.academicTitle : undefined,
      position: newUser.role === "faculty" ? "Instructor" : undefined,
      status: "Active",
      password: newUser.password || "password123",
    }).catch((e) =>
      console.error(`Failed to sync user ${accountId}:`, e)
    )
  }

  function confirmAndToggleUserStatus(userId: string) {
    const approved = window.confirm(
      "Are you sure you want to edit this account status?"
    )
    if (!approved) return
    toggleUserStatus(userId)
  }

  function toggleUserStatus(userId: string) {
    const user = users.find((u) => u.id === userId)
    const wasActive = user?.status === "Active"
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
    if (user) {
      const newStatus = wasActive ? "Inactive" : "Active"
      addAuditLog(`${newStatus === "Active" ? "Activated" : "Deactivated"} account "${user.name}"`)
    }
  }

  function confirmAndDeleteUser(userId: string) {
    const approved = window.confirm(
      "Are you sure you want to delete this account?"
    )
    if (!approved) return
    deleteUser(userId)
  }

  function deleteUser(userId: string) {
    const user = users.find((u) => u.id === userId)
    setUsers((current) => current.filter((item) => item.id !== userId))
    setRoster((current) => current.filter((item) => item.id !== userId))
    setGrades((current) =>
      current.filter((grade) => grade.studentId !== userId)
    )
    void syncApi("DELETE", `/api/portal/users/${userId}`)
    if (user) {
      addAuditLog(`Deleted ${user.role} account "${user.name}"`)
    }
  }

  function handleUpdateUser(updatedUser: UserRecord) {
    setUsers((current) =>
      current.map((item) => (item.id === updatedUser.id ? updatedUser : item))
    )
    if (updatedUser.role === "student") {
      const section = updatedUser.section ?? ""
      setRoster((current) => {
        const exists = current.some((item) => item.id === updatedUser.id)
        if (!exists) {
          return [{ id: updatedUser.id, name: updatedUser.name, section, enrolled: updatedUser.status === "Active" }, ...current]
        }
        return current.map((item) =>
          item.id === updatedUser.id
            ? { ...item, name: updatedUser.name, section }
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
      syncApi("PUT", `/api/portal/roster/${updatedUser.id}`, { name: updatedUser.name, section }).catch((e) =>
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
    addAuditLog(`Updated account "${updatedUser.name}"`)
    syncApi("PUT", `/api/portal/users/${updatedUser.id}`, updatedUser).catch((e) =>
      console.error(`Failed to sync user ${updatedUser.id}:`, e)
    )
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

    addAuditLog(
      `Changed curriculum for "${student.name}" from ${student.curriculum ?? "N/A"} to ${newCurriculumLabel}`
    )
    void syncApi("PUT", `/api/portal/users/${studentId}`, {
      curriculumId: newCurriculumId,
      curriculum: newCurriculumLabel,
      currentYearLevel: newYearLevel,
      currentSemester: newSemester,
      gradeHistory,
    })
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
      void syncApi("PUT", `/api/portal/users/${studentId}`, updated)
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
      void syncApi("PUT", `/api/portal/users/${studentId}`, updated)
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
      void syncApi("PUT", `/api/portal/users/${studentId}`, updated)
    }
  }

  function confirmAndDeleteThesis(thesisId: string) {
    const approved = window.confirm(
      "Are you sure you want to delete this thesis record?"
    )
    if (!approved) return
    setTheses((current) => current.filter((item) => item.id !== thesisId))
  }

  function undoTicketResolution(ticketId: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status: "In Progress", resolution: undefined }
          : ticket
      )
    )
  }

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setProfileDetails((current) => ({
        ...current,
        photoUrl: typeof reader.result === "string" ? reader.result : "",
      }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile(draft: ProfileDetails) {
    setProfileDetails(draft)
    const fullName = getProfileFullName(draft)

    const result = await syncApi<{ data: { photoUrl?: string } }>("PUT", `/api/portal/users/${profile.id}`, {
      firstName: draft.firstName,
      middleName: draft.middleName,
      lastName: draft.lastName,
      email: draft.email,
      contactNumber: draft.contactNumber,
      sex: draft.sex,
      birthday: draft.birthday,
      address: draft.address,
      photoUrl: draft.photoUrl,
    })

    const photoUrl = result.data?.photoUrl ?? draft.photoUrl
    setProfileDetails((current) => ({ ...current, photoUrl }))

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
            }
          : user
      )
    )

    if (fullName) {
      setRoster((current) =>
        current.map((s) =>
          s.id === profile.id ? { ...s, name: fullName } : s
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
    }
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
    void syncApi("DELETE", `/api/portal/roster/${studentId}`)
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
    void syncApi("PUT", `/api/portal/roster/${studentId}`, { enrolled })
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
  }

  function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleDraft.section.trim() || !scheduleDraft.subject.trim()) return

    const newItem: ScheduleItem = {
      id: `SCH-${Date.now()}`,
      semesterId: scheduleDraft.semesterId,
      day: scheduleDraft.day.trim() || "TBA",
      time: scheduleDraft.time.trim() || "TBA",
      subject: scheduleDraft.subject.trim(),
      room: scheduleDraft.room.trim() || "TBA",
      instructor: scheduleDraft.instructor.trim() || profile.name,
      section: scheduleDraft.section.trim(),
    }
    setClassSchedules((current) => [newItem, ...current])
    void syncApi("POST", "/api/portal/schedules", newItem)

    setScheduleDraft({
      semesterId: scheduleDraft.semesterId,
      day: "",
      time: "",
      subject: "",
      room: "",
      instructor: "",
      section: activeClassSection,
    })
    addAuditLog(`Created schedule for "${scheduleDraft.subject}" (${scheduleDraft.section})`)
  }

  async function handleScheduleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedRows = await parseScheduleWorkbook(file)
      if (!importedRows.length) {
        window.alert("No schedule rows were found in the uploaded workbook.")
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
      window.alert(
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
    void syncApi("PUT", `/api/portal/schedules/${updated.id}`, updated)
    addAuditLog(`Updated schedule for "${updated.subject}"`)
  }

  function handleDeleteSchedule(id: string) {
    const item = classSchedules.find((s) => s.id === id)
    setClassSchedules((current) => current.filter((item) => item.id !== id))
    void syncApi("DELETE", `/api/portal/schedules/${id}`)
    if (item) addAuditLog(`Deleted schedule for "${item.subject}" (${item.section})`)
  }

  async function handleGradeWorkbookUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedRows = await parseGradeWorkbook(file)
      if (!importedRows.length) {
        window.alert("No grade rows were found in the uploaded workbook.")
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
      window.alert(
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
      id: `SEM-${String(semesters.length + 1).padStart(3, "0")}`,
      semester: newSemester.semester,
      schoolYearStart: newSemester.schoolYearStart,
      schoolYearEnd: newSemester.schoolYearEnd,
      status: newSemester.status,
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
    void syncApi("POST", "/api/portal/semesters", semesterData)
  }

  function handleUpdateSemester(updated: SemesterRecord) {
    setSemesters((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    void syncApi("PUT", `/api/portal/semesters/${updated.id}`, updated)
    addAuditLog(`Updated semester "${updated.semester}"`)
  }

  function handleDeleteSemester(id: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) => current.filter((s) => s.id !== id))
    void syncApi("DELETE", `/api/portal/semesters/${id}`)
    if (item) addAuditLog(`Deleted semester "${item.semester}"`)
  }

  function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSubject.code.trim() || !newSubject.name.trim()) return
    const subjectData: SubjectRecord = {
      id: `SUBJ-${String(subjects.length + 1).padStart(3, "0")}`,
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
    void syncApi("POST", "/api/portal/subjects", subjectData)
  }

  function handleUpdateSubject(updated: SubjectRecord) {
    setSubjects((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    void syncApi("PUT", `/api/portal/subjects/${updated.id}`, updated)
    addAuditLog(`Updated subject "${updated.name}"`)
  }

  function handleDeleteSubject(id: string) {
    const item = subjects.find((s) => s.id === id)
    setSubjects((current) => current.filter((s) => s.id !== id))
    void syncApi("DELETE", `/api/portal/subjects/${id}`)
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
        id: `CURR-${String(current.length + 1).padStart(3, "0")}`,
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
  }

  function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!eventDraft.title.trim() || !eventDraft.date.trim()) return
    const newItem = {
      id: `SEM-${String(seminars.length + 1).padStart(3, "0")}`,
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
    void syncApi("POST", "/api/portal/seminars", newItem)
    setEventDraft({
      title: "",
      speaker: "",
      date: "",
      location: "",
      capacity: "30",
    })
    addAuditLog(`Created event "${eventDraft.title}"`)
  }

  function handleCreateThesis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !thesisDraft.title.trim() ||
      !thesisDraft.authors.trim() ||
      !thesisDraft.pdfUrl
    ) {
      return
    }

    const newItem = {
      id: `TH-${String(theses.length + 1).padStart(3, "0")}`,
      title: thesisDraft.title.trim(),
      authors: thesisDraft.authors.trim(),
      year: Number(thesisDraft.year) || 2026,
      category: thesisDraft.category.trim(),
      adviser: thesisDraft.adviser.trim() || "For assignment",
      abstract:
        thesisDraft.abstract.trim() ||
        "Abstract will be supplied after manuscript review.",
      tags: thesisDraft.category
        .split(" ")
        .filter(Boolean)
        .slice(0, 3),
      pdfUrl: thesisDraft.pdfUrl,
      fileName:
        thesisDraft.fileName ||
        `${thesisDraft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
    }
    setTheses((current) => [newItem, ...current])
    void syncApi("POST", "/api/portal/theses", newItem)

    setThesisDraft({
      title: "",
      authors: "",
      year: "2026",
      category: "Software Engineering",
      adviser: "",
      abstract: "",
      pdfUrl: "",
      fileName: "",
    })
    setShowThesisUploadForm(false)
    addAuditLog(`Created curriculum "${newCurriculum.name}"`)
    void syncApi("POST", "/api/portal/curricula", newCurriculum)
  }

  function handleDeleteCurriculum(id: string) {
    const item = curricula.find((c) => c.id === id)
    setCurricula((current) => current.filter((c) => c.id !== id))
    void syncApi("DELETE", `/api/portal/curricula/${id}`)
    if (item) addAuditLog(`Deleted curriculum "${item.name}"`)
  }

  function handleUpdateCurriculum(updated: CurriculumRecord) {
    setCurricula((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    void syncApi("PUT", `/api/portal/curricula/${updated.id}`, updated)
    addAuditLog(`Updated curriculum "${updated.name}"`)
  }

  function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!announcementDraft.title.trim() || !announcementDraft.content.trim()) {
      return
    }
    const newItem = {
      id: `ANN-${String(announcements.length + 1).padStart(3, "0")}`,
      title: announcementDraft.title.trim(),
      content: announcementDraft.content.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      audience: announcementDraft.audience,
      priority: announcementDraft.priority,
    }
    setAnnouncements((current) => [newItem, ...current])
    void syncApi("POST", "/api/portal/announcements", newItem)
    setAnnouncementDraft({
      title: "",
      content: "",
      audience: "All Users",
      priority: "Medium",
    })
    setShowAnnouncementForm(false)
    addAuditLog(`Created announcement "${announcementDraft.title}"`)
  }

  function handleUpdateAnnouncement(updated: Announcement) {
    setAnnouncements((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    void syncApi("PUT", `/api/portal/announcements/${updated.id}`, updated)
    addAuditLog(`Updated announcement "${updated.title}"`)
  }

  function handleDeleteAnnouncement(id: string) {
    const item = announcements.find((a) => a.id === id)
    setAnnouncements((current) => current.filter((item) => item.id !== id))
    void syncApi("DELETE", `/api/portal/announcements/${id}`)
    if (item) addAuditLog(`Deleted announcement "${item.title}"`)
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
    if (updatedEvent) void syncApi("PUT", `/api/portal/seminars/${eventId}`, updatedEvent)
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
    void syncApi("POST", "/api/portal/cso-reports", report)
    addAuditLog(`Created CSO report "${report.title}"`)
  }

  function handleUpdateCsoReport(report: CsoReport) {
    setCsoReports((current) =>
      current.map((r) => (r.id === report.id ? report : r))
    )
    void syncApi("PUT", `/api/portal/cso-reports/${report.id}`, report)
    addAuditLog(`Updated CSO report "${report.title}"`)
  }

  function handleDeleteCsoReport(id: string) {
    const item = csoReports.find((r) => r.id === id)
    setCsoReports((current) => current.filter((r) => r.id !== id))
    void syncApi("DELETE", `/api/portal/cso-reports/${id}`)
    if (item) addAuditLog(`Deleted CSO report "${item.title}"`)
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
    visibleSchedules,
    selectedScheduleEntry,
    setSelectedScheduleEntry,
    selectedScheduleStudents,
    selectedScheduleGrades,
    studentGrades,
    allStudentGrades,
    gradeAverage,
    filteredTheses,
    filteredFaculty,
    filteredUsers,
    studentTickets,
    auditLogs,
    csoReports,
    setCsoReports,
    quickLinks,
    setQuickLinks,
    selectedNav,
    currentTitle,
    selectModule,
    handleLogout,
    downloadGradeReport,
    downloadGradeTemplate,
    downloadUserTemplate,
    downloadAttendees,
    downloadThesisDetails,
    updateGrade,
    updateGradeRemarks,
    releaseGradesForSection,
    handleCreateGrade,
    updateTicketStatus,
    updateFacultyStatus,
    deleteFacultyMember,
    syncFacultyFromUsers,
    confirmAndToggleUserStatus,
    toggleUserStatus,
    confirmAndDeleteUser,
    deleteUser,
    handleUpdateUser,
    confirmAndDeleteThesis,
    undoTicketResolution,
    handleSaveProfile,
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
    handleAddUser,
    handleFeedbackSubmit,
    handleCreateEvent,
    handleCreateThesis,
    handleCreateAnnouncement,
    handleUpdateAnnouncement,
    handleDeleteAnnouncement,
    handleEnlist,
    handleFacultySelfStatus,
    handleCreateCsoReport,
    handleUpdateCsoReport,
    handleDeleteCsoReport,
  }
}

export type PortalDashboardModel = ReturnType<typeof usePortalDashboardModel>
