"use client"

import { useRouter } from "next/navigation"
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"

import {
  testSessionStorageKey,
} from "@/features/auth/data/test-accounts"

import { initialModule, roleNavigation } from "../config/navigation"
import {
  type Announcement,
  type AvailabilityStatus,
  type ClassStudent,
  type CsoReport,
  type CurriculumRecord,
  type GradeRecord,
  type ProfileDetails,
  type Role,
  type ScheduleItem,
  type SeminarRecord,
  type SemesterRecord,
  type SubjectRecord,
  type ThesisRecord,
  type TicketStatus,
  type UserRecord,
  announcementsSeed,
  auditLogsSeed,
  classRosterSeed,
  csoReportsSeed,
  curriculumCatalogSeed,
  facultyHandledSections,
  facultySeed,
  feedbackSeed,
  gradeSeed,
  roleProfiles,
  scheduleSeed,
  semestersSeed,
  subjectsSeed,
  seminarSeed,
  thesisSeed,
  usersSeed,
  yearSectionsSeed,
} from "../data/portal-data"
import { csvEscape, downloadFile } from "../lib/downloads"
import { calculateFinalGrade, transmutedToEquivalent } from "../lib/grades"
import { parseGradeWorkbook, parseScheduleWorkbook } from "../lib/xlsx"
import type { ModuleId } from "../types/navigation"
import { useStoredState } from "./use-stored-state"

type TestSessionProfile = {
  name: string
  title: string
  email: string
  id: string
  role: Role
}

function subscribeToTestSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  return () => window.removeEventListener("storage", onStoreChange)
}

function getTestSessionSnapshot() {
  return window.localStorage.getItem(testSessionStorageKey)
}

function getServerTestSessionSnapshot() {
  return null
}

function parseTestSession(value: string | null) {
  if (!value) return null

  try {
    const parsedSession = JSON.parse(value) as Partial<TestSessionProfile>
    if (
      !parsedSession.name ||
      !parsedSession.title ||
      !parsedSession.email ||
      !parsedSession.id ||
      !parsedSession.role
    ) {
      return null
    }

    return parsedSession as TestSessionProfile
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

function createProfileDetails(
  profile: TestSessionProfile | typeof roleProfiles[Role],
  user?: UserRecord
): ProfileDetails {
  const nameParts = splitProfileName(profile.name)

  return {
    photoUrl: user?.photoUrl ?? "",
    firstName: user?.firstName ?? nameParts.firstName,
    middleName: user?.middleName ?? nameParts.middleName,
    lastName: user?.lastName ?? nameParts.lastName,
    email: user?.email ?? profile.email,
    contactNumber: user?.contactNumber ?? "0917 000 0000",
    sex: user?.sex ?? "Female",
    birthday: user?.birthday ?? "",
    address: user?.address ?? "Candon City, Ilocos Sur",
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
    updatedAt: "June 1, 2026",
  }
}

export function usePortalDashboardModel(role: Role) {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<ModuleId>(
    initialModule[role]
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState("")

  async function syncApi(method: string, url: string, body?: unknown) {
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      // Silently fail — local state is already updated
    }
  }

  const [users, setUsers] = useStoredState<UserRecord[]>(
    "comsite-users",
    usersSeed
  )
  const [faculty, setFaculty] = useStoredState("comsite-faculty", facultySeed)
  const [grades, setGrades] = useStoredState("comsite-grades", gradeSeed)
  const [theses, setTheses] = useStoredState("comsite-theses", thesisSeed)
  const [seminars, setSeminars] = useStoredState(
    "comsite-seminars",
    seminarSeed
  )
  const [tickets, setTickets] = useStoredState(
    "comsite-feedback",
    feedbackSeed
  )
  const [announcements, setAnnouncements] = useStoredState(
    "comsite-announcements",
    announcementsSeed
  )
  const [roster, setRoster] = useStoredState(
    "comsite-class-roster",
    classRosterSeed
  )
  const [semesters, setSemesters] = useStoredState<SemesterRecord[]>(
    "comsite-semesters",
    semestersSeed
  )
  const [subjects, setSubjects] = useStoredState<SubjectRecord[]>(
    "comsite-subjects",
    subjectsSeed
  )
  const [curricula, setCurricula] = useStoredState<CurriculumRecord[]>(
    "comsite-curricula",
    curriculumCatalogSeed
  )
  const [yearSections, setYearSections] = useStoredState(
    "comsite-year-sections",
    yearSectionsSeed
  )
  const [classSchedules, setClassSchedules] = useStoredState<ScheduleItem[]>(
    "comsite-class-schedules",
    scheduleSeed
  )
  const [auditLogs, setAuditLogs] = useStoredState(
    "comsite-audit-logs",
    auditLogsSeed
  )
  const [csoReports, setCsoReports] = useStoredState(
    "comsite-cso-reports",
    csoReportsSeed
  )

  const [roleFilter, setRoleFilter] = useState("All")
  const [selectedAcademicSection, setSelectedAcademicSection] =
    useState("Semesters")
  const [selectedClassYear, setSelectedClassYear] = useState("First Year")
  const [selectedClassSection, setSelectedClassSection] = useState("BSCS 3A")
  const [selectedGradeSection, setSelectedGradeSection] = useState("BSCS 3A")
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("CURR-001")
  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [showThesisUploadForm, setShowThesisUploadForm] = useState(false)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [studentDraft, setStudentDraft] = useState({
    id: "",
    name: "",
    section: "BSCS 3A",
  })
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [scheduleDraft, setScheduleDraft] = useState({
    day: "",
    time: "",
    subject: "",
    room: "",
    instructor: "",
    section: "BSCS 3A",
  })
  const [showAddSemesterForm, setShowAddSemesterForm] = useState(false)
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false)
  const [newSemester, setNewSemester] = useState({
    name: "",
    schoolYear: "",
    enrollment: "Open",
    gradeSubmission: "",
  })
  const [newSubject, setNewSubject] = useState({
    code: "",
    title: "",
    units: "3",
    instructor: "",
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
    curriculum: "Old Curriculum",
    year: "1",
    section: "A",
    advisoryClass: "BSCS 3A",
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
  const sessionSnapshot = useSyncExternalStore(
    subscribeToTestSession,
    getTestSessionSnapshot,
    getServerTestSessionSnapshot
  )
  const sessionProfile = useMemo(
    () => parseTestSession(sessionSnapshot),
    [sessionSnapshot]
  )

  useEffect(() => {
    const storedSession = window.localStorage.getItem(testSessionStorageKey)
    if (!storedSession) {
      router.replace("/")
      return
    }

    try {
      const parsedSession = JSON.parse(storedSession) as {
        name?: string
        title?: string
        email?: string
        id?: string
        role?: Role
      }
      if (
        parsedSession.role !== role ||
        !parsedSession.name ||
        !parsedSession.title ||
        !parsedSession.email ||
        !parsedSession.id
      ) {
        router.replace("/")
        return
      }
    } catch {
      window.localStorage.removeItem(testSessionStorageKey)
      router.replace("/")
    }
  }, [role, router])

  useEffect(() => {
    setRoster((current) => {
      const rosterIds = new Set(current.map((s) => s.id))
      const missing = users.filter(
        (u) => u.role === "student" && u.section && !rosterIds.has(u.id)
      )
      if (missing.length === 0) return current
      const newEntries = missing.map((u) => {
        const rawSection = u.section ?? ""
        const rosterSection = rawSection.startsWith("BSCS")
          ? rawSection
          : `BSCS ${u.year ?? ""}${rawSection}`
        return { id: u.id, name: u.name, section: rosterSection, enrolled: u.status === "Active" }
      })
      return [...newEntries, ...current]
    })
  }, [users, setRoster])

  const rawProfile = sessionProfile ?? roleProfiles[role]
  const profileUser = users.find((user) => user.id === rawProfile.id)
  const [profileDetails, setProfileDetails] = useStoredState<ProfileDetails>(
    `comsite-profile-details-${rawProfile.id}`,
    createProfileDetails(rawProfile, profileUser)
  )
  const profileName = getProfileFullName(profileDetails)
  const profile = {
    ...rawProfile,
    name: profileName || rawProfile.name,
    email: profileDetails.email || rawProfile.email,
    title: role === "faculty" ? "Faculty Member" : rawProfile.title,
  }
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
    const configured = facultyHandledSections[profile.id] ?? []
    const advisory = profileAdvisoryClass ? [profileAdvisoryClass] : []
    const scheduleSections = classSchedules
      .filter((item) => item.instructor === profile.name)
      .map((item) => item.section)

    return Array.from(
      new Set([...configured, ...advisory, ...scheduleSections])
    ).filter(Boolean)
  }, [classSchedules, profile.id, profile.name, profileAdvisoryClass])

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

  const visibleSchedules = useMemo(() => {
    if (role !== "faculty") return classSchedules
    return classSchedules.filter((item) =>
      facultyClassSections.includes(item.section)
    )
  }, [classSchedules, facultyClassSections, role])

  const studentGrades = useMemo(
    () =>
      grades.filter(
        (grade) => grade.studentId === profile.id && grade.released !== false
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

  function handleLogout() {
    window.localStorage.removeItem(testSessionStorageKey)
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
    field: "midterm" | "finalTerm" | "midtermTransmuted" | "finalTransmuted",
    value: string
  ) {
    const numericValue = Number(value)
    setGrades((current) =>
      current.map((grade) => {
        if (grade.id !== id) return grade

        const safeValue = Number.isNaN(numericValue) ? 0 : numericValue
        const nextGrade = {
          ...grade,
          [field]: safeValue,
          updatedAt: "June 1, 2026",
        }

        if (field === "midtermTransmuted") {
          nextGrade.midterm = transmutedToEquivalent(safeValue)
        }

        if (field === "finalTransmuted") {
          nextGrade.finalTerm = transmutedToEquivalent(safeValue)
        }

        nextGrade.gradePercentage =
          nextGrade.midtermTransmuted !== undefined &&
          nextGrade.finalTransmuted !== undefined
            ? Number(
                (
                  (nextGrade.midtermTransmuted + nextGrade.finalTransmuted) /
                  2
                ).toFixed(2)
              )
            : nextGrade.gradePercentage

        return nextGrade
      })
    )
  }

  function updateGradeRemarks(id: string, remarks: string) {
    setGrades((current) =>
      current.map((grade) =>
        grade.id === id ? { ...grade, remarks, updatedAt: "June 1, 2026" } : grade
      )
    )
    void syncApi("PUT", `/api/portal/grades/${id}`, { remarks })
  }

  function releaseGradesForSection(section: string) {
    const approved = window.confirm(
      `Release grades for ${section} to students?`
    )
    if (!approved) return

    setGrades((current) =>
      current.map((grade) =>
        grade.section === section ? { ...grade, released: true } : grade
      )
    )
    addAuditLog(`Released grades for ${section}`)
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
    setUsers((current) => [
      {
        id: accountId,
        name: fullName,
        email: newUser.email.trim(),
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
        course: newUser.role === "student" ? "BSCS" : undefined,
        year: newUser.role === "student" ? Number(newUser.year) : undefined,
        section: newUser.role === "student" ? newUser.section : undefined,
        advisoryClass:
          newUser.role === "faculty" ? newUser.advisoryClass : undefined,
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
    const customAccountsKey = "comsite-custom-accounts"
    const existing = JSON.parse(
      window.localStorage.getItem(customAccountsKey) || "[]"
    ) as Array<{ email: string; password: string; role: string; name: string; title: string; id: string; route: string }>
    const routeMap: Record<string, string> = { student: "/student", faculty: "/faculty", admin: "/admin" }
    existing.push({
      email: newUser.email.trim(),
      password: newUser.password || "password123",
      role: newUser.role,
      name: fullName,
      title: newUser.role === "student"
        ? `BSCS ${newUser.year}${newUser.section} - ${newUser.studentType} Student`
        : newUser.role === "faculty"
          ? `Instructor - Computer Science`
          : "System Administrator - CS Department",
      id: accountId,
      route: routeMap[newUser.role] || "/student",
    })
    window.localStorage.setItem(customAccountsKey, JSON.stringify(existing))

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
      curriculum: "Old Curriculum",
      year: "1",
      section: "A",
      advisoryClass: "BSCS 3A",
      employmentType: "Regular",
      academicTitle: "MIT",
    })
    if (newUser.role === "student") {
      const rosterSection = newUser.section.startsWith("BSCS")
        ? newUser.section
        : `BSCS ${newUser.year}${newUser.section}`
      setRoster((current) => {
        const exists = current.some((s) => s.id === accountId)
        if (exists) return current
        return [{ id: accountId, name: fullName, section: rosterSection, enrolled: true }, ...current]
      })
    }

    addAuditLog(`Created ${newUser.role} account "${fullName}" (${newUser.email})`)
    void syncApi("POST", "/api/portal/users", { id: accountId, name: fullName, email: newUser.email.trim(), role: newUser.role, status: "Active", password: newUser.password || "password123" })
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
    const customAccountsKey = "comsite-custom-accounts"
    try {
      const existing = JSON.parse(window.localStorage.getItem(customAccountsKey) || "[]") as Array<Record<string, string>>
      if (wasActive) {
        const filtered = existing.filter((a) => a.id !== userId)
        window.localStorage.setItem(customAccountsKey, JSON.stringify(filtered))
      } else if (user) {
        const routeMap: Record<string, string> = { student: "/student", faculty: "/faculty", admin: "/admin" }
        existing.push({
          email: user.email,
          password: "password123",
          role: user.role,
          name: user.name,
          title: user.role === "student"
            ? `BSCS ${user.year ?? ""}${user.section ?? ""} - ${user.studentType ?? "Regular"} Student`
            : user.role === "faculty"
              ? `Instructor - Computer Science`
              : "System Administrator - CS Department",
          id: user.id,
          route: routeMap[user.role] || "/student",
        })
        window.localStorage.setItem(customAccountsKey, JSON.stringify(existing))
      }
    } catch { /* ignore */ }
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
    const customAccountsKey = "comsite-custom-accounts"
    try {
      const existing = JSON.parse(window.localStorage.getItem(customAccountsKey) || "[]") as Array<Record<string, string>>
      const filtered = existing.filter((a) => a.id !== userId)
      window.localStorage.setItem(customAccountsKey, JSON.stringify(filtered))
    } catch { /* ignore */ }
    if (user) {
      addAuditLog(`Deleted ${user.role} account "${user.name}"`)
    }
  }

  function handleUpdateUser(updatedUser: UserRecord) {
    setUsers((current) =>
      current.map((item) => (item.id === updatedUser.id ? updatedUser : item))
    )
    if (updatedUser.role === "student") {
      const rawSection = updatedUser.section ?? ""
      const rosterSection = rawSection.startsWith("BSCS")
        ? rawSection
        : `BSCS ${updatedUser.year}${rawSection}`
      setRoster((current) => {
        const exists = current.some((item) => item.id === updatedUser.id)
        if (!exists) {
          return [{ id: updatedUser.id, name: updatedUser.name, section: rosterSection, enrolled: updatedUser.status === "Active" }, ...current]
        }
        return current.map((item) =>
          item.id === updatedUser.id
            ? { ...item, name: updatedUser.name, section: rosterSection }
            : item
        )
      })
      setGrades((current) =>
        current.map((grade) =>
          grade.studentId === updatedUser.id
            ? { ...grade, student: updatedUser.name, section: rosterSection }
            : grade
        )
      )
    }
    const customAccountsKey = "comsite-custom-accounts"
    try {
      const existing = JSON.parse(window.localStorage.getItem(customAccountsKey) || "[]") as Array<Record<string, string>>
      const idx = existing.findIndex((a) => a.id === updatedUser.id)
      if (idx !== -1) {
        existing[idx].email = updatedUser.email
        existing[idx].name = updatedUser.name
        existing[idx].role = updatedUser.role
      } else {
        const routeMap: Record<string, string> = { student: "/student", faculty: "/faculty", admin: "/admin" }
        existing.push({
          email: updatedUser.email,
          password: "password123",
          role: updatedUser.role,
          name: updatedUser.name,
          title: updatedUser.role === "student"
            ? `BSCS ${updatedUser.year ?? ""}${updatedUser.section ?? ""} - ${updatedUser.studentType ?? "Regular"} Student`
            : updatedUser.role === "faculty"
              ? `Instructor - Computer Science`
              : "System Administrator - CS Department",
          id: updatedUser.id,
          route: routeMap[updatedUser.role] || "/student",
        })
      }
      window.localStorage.setItem(customAccountsKey, JSON.stringify(existing))
    } catch { /* ignore */ }
    addAuditLog(`Updated account "${updatedUser.name}"`)
    void syncApi("PUT", `/api/portal/users/${updatedUser.id}`, updatedUser)
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

  function handleSaveProfile(draft: ProfileDetails) {
    setProfileDetails(draft)
    const fullName = getProfileFullName(draft)
    setUsers((current) =>
      current.map((user) =>
        user.id === rawProfile.id
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
              photoUrl: draft.photoUrl,
            }
          : user
      )
    )
    void syncApi("PUT", `/api/portal/users/${rawProfile.id}`, {
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

    const newItem = {
      id: `SCH-${String(classSchedules.length + 1).padStart(3, "0")}`,
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

      setClassSchedules((current) => [
        ...importedRows.map((row, index) => ({
          id: `SCH-UP-${Date.now()}-${index}`,
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
    if (!newSemester.name.trim() || !newSemester.schoolYear.trim()) return
    setSemesters((current) => [
      {
        id: `SEM-${String(current.length + 1).padStart(3, "0")}`,
        name: newSemester.name.trim(),
        schoolYear: newSemester.schoolYear.trim(),
        enrollment: newSemester.enrollment,
        gradeSubmission: newSemester.gradeSubmission.trim(),
      },
      ...current,
    ])
    setNewSemester({ name: "", schoolYear: "", enrollment: "Open", gradeSubmission: "" })
    setShowAddSemesterForm(false)
    addAuditLog(`Created semester "${newSemester.name}"`)
    void syncApi("POST", "/api/portal/semesters", newSemester)
  }

  function handleUpdateSemester(updated: SemesterRecord) {
    setSemesters((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    )
    void syncApi("PUT", `/api/portal/semesters/${updated.id}`, updated)
    addAuditLog(`Updated semester "${updated.name}"`)
  }

  function handleDeleteSemester(id: string) {
    const item = semesters.find((s) => s.id === id)
    setSemesters((current) => current.filter((s) => s.id !== id))
    void syncApi("DELETE", `/api/portal/semesters/${id}`)
    if (item) addAuditLog(`Deleted semester "${item.name}"`)
  }

  function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newSubject.code.trim() || !newSubject.title.trim()) return
    setSubjects((current) => [
      {
        code: newSubject.code.trim().toUpperCase(),
        title: newSubject.title.trim(),
        units: Number(newSubject.units) || 0,
        instructor: newSubject.instructor.trim(),
      },
      ...current,
    ])
    setNewSubject({ code: "", title: "", units: "3", instructor: "" })
    setShowAddSubjectForm(false)
    addAuditLog(`Created subject "${newSubject.title}"`)
    void syncApi("POST", "/api/portal/subjects", newSubject)
  }

  function handleUpdateSubject(updated: SubjectRecord) {
    setSubjects((current) =>
      current.map((item) => (item.code === updated.code ? updated : item))
    )
    void syncApi("PUT", `/api/portal/subjects/${updated.code}`, updated)
    addAuditLog(`Updated subject "${updated.title}"`)
  }

  function handleDeleteSubject(code: string) {
    const item = subjects.find((s) => s.code === code)
    setSubjects((current) => current.filter((s) => s.code !== code))
    void syncApi("DELETE", `/api/portal/subjects/${code}`)
    if (item) addAuditLog(`Deleted subject "${item.title}"`)
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
    const id = `FB-${1000 + tickets.length + 1}`
    const newItem = {
      id,
      studentId: feedbackDraft.anonymous ? undefined : roleProfiles.student.id,
      studentName: feedbackDraft.anonymous
        ? "Anonymous"
        : roleProfiles.student.name,
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
      host: roleProfiles.faculty.name,
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
    const studentId = roleProfiles.student.id
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
    navigation,
    userStats,
    allClassSections,
    facultyClassSections,
    facultyClassStudents,
    facultyGradeRecords,
    visibleSchedules,
    studentGrades,
    gradeAverage,
    filteredTheses,
    filteredFaculty,
    filteredUsers,
    studentTickets,
    auditLogs,
    csoReports,
    setCsoReports,
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
    updateTicketStatus,
    updateFacultyStatus,
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
