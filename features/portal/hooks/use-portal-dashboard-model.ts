"use client"

import { useRouter } from "next/navigation"
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"

import {
  testAccounts,
  testSessionStorageKey,
} from "@/features/auth/data/test-accounts"

import { initialModule, roleNavigation } from "../config/navigation"
import {
  type Announcement,
  type AvailabilityStatus,
  type CurriculumRecord,
  type Role,
  type SeminarRecord,
  type ThesisRecord,
  type TicketStatus,
  type UserRecord,
  announcementsSeed,
  classRosterSeed,
  curriculumCatalogSeed,
  facultySeed,
  feedbackSeed,
  gradeSeed,
  roleProfiles,
  seminarSeed,
  thesisSeed,
  usersSeed,
  yearSectionsSeed,
} from "../data/portal-data"
import { csvEscape, downloadFile } from "../lib/downloads"
import { calculateFinalGrade } from "../lib/grades"
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

export function usePortalDashboardModel(role: Role) {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<ModuleId>(
    initialModule[role]
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState("")
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
  const [curricula, setCurricula] = useStoredState<CurriculumRecord[]>(
    "comsite-curricula",
    curriculumCatalogSeed
  )
  const [yearSections, setYearSections] = useStoredState(
    "comsite-year-sections",
    yearSectionsSeed
  )

  const [roleFilter, setRoleFilter] = useState("All")
  const [selectedUserType, setSelectedUserType] =
    useState<"student" | "faculty">("student")
  const [selectedAcademicSection, setSelectedAcademicSection] =
    useState("Semesters")
  const [selectedClassYear, setSelectedClassYear] = useState("First Year")
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("CURR-001")
  const [curriculumFilter, setCurriculumFilter] = useState("All")
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [showThesisUploadForm, setShowThesisUploadForm] = useState(false)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
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
    role: "student" as "student" | "faculty",
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
    setUsers((current) => {
      const missingAccounts = testAccounts.filter(
        (account) =>
          !current.some(
            (user) => user.email.toLowerCase() === account.email.toLowerCase()
          )
      )

      if (!missingAccounts.length) return current

      const migratedUsers: UserRecord[] = missingAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        course: account.role === "student" ? "BSCS" : undefined,
        year: account.role === "student" ? 3 : undefined,
        section: account.role === "student" ? "A" : undefined,
        position:
          account.role === "admin"
            ? account.title.replace(" - CS Department", "")
            : account.role === "faculty"
              ? account.title.split(" - ")[0]
              : undefined,
        status: "Active",
      }))

      return [...migratedUsers, ...current]
    })
  }, [setUsers])

  useEffect(() => {
    setCurricula((current) => {
      const seededIds = new Set(curriculumCatalogSeed.map((item) => item.id))
      const customCurricula = current.filter((item) => !seededIds.has(item.id))
      return [...curriculumCatalogSeed, ...customCurricula]
    })
  }, [setCurricula])

  const profile = sessionProfile ?? roleProfiles[role]
  const navigation = roleNavigation[role]

  const userStats = useMemo(
    () => ({
      students: users.filter((user) => user.role === "student").length,
      faculty: users.filter((user) => user.role === "faculty").length,
      admins: users.filter((user) => user.role === "admin").length,
    }),
    [users]
  )

  const studentGrades = useMemo(
    () => grades.filter((grade) => grade.studentId === roleProfiles.student.id),
    [grades]
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
    return users.filter((user) => {
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
      ticket.studentId === roleProfiles.student.id ||
      ticket.studentName === roleProfiles.student.name
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
      ["Student ID", "Student Name", "Subject Code", "Midterm", "Final Term"],
      ...roster.map((student) => [student.id, student.name, "CS311", "", ""]),
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
    downloadFile(
      `${thesis.id}-manuscript.pdf`,
      [
        thesis.title,
        `Authors: ${thesis.authors}`,
        `Year: ${thesis.year}`,
        `Category: ${thesis.category}`,
        `Adviser: ${thesis.adviser}`,
        "",
        thesis.abstract,
      ].join("\n"),
      "application/pdf"
    )
  }

  function updateGrade(
    id: string,
    field: "midterm" | "finalTerm",
    value: string
  ) {
    const numericValue = Number(value)
    setGrades((current) =>
      current.map((grade) =>
        grade.id === id
          ? {
              ...grade,
              [field]: Number.isNaN(numericValue) ? 0 : numericValue,
              updatedAt: "May 26, 2026",
            }
          : grade
      )
    )
  }

  function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    resolution?: string
  ) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              resolution: resolution ?? ticket.resolution,
            }
          : ticket
      )
    )
  }

  function updateFacultyStatus(
    facultyId: string,
    status: AvailabilityStatus,
    notes?: string
  ) {
    setFaculty((current) =>
      current.map((member) =>
        member.id === facultyId
          ? {
              ...member,
              status,
              notes: notes ?? member.notes,
            }
          : member
      )
    )
  }

  function handleAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) return
    const fullName = [newUser.firstName, newUser.middleName, newUser.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ")
    setUsers((current) => [
      {
        id: `USR-${String(current.length + 1).padStart(3, "0")}`,
        name: fullName,
        email: newUser.email.trim(),
        role: newUser.role,
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
    setNewUser({
      name: "",
      email: "",
      role: selectedUserType,
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
    setShowAddUserForm(false)
  }

  function confirmAndToggleUserStatus(userId: string) {
    const approved = window.confirm(
      "Are you sure you want to edit this account status?"
    )
    if (!approved) return
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
  }

  function confirmAndDeleteUser(userId: string) {
    const approved = window.confirm(
      "Are you sure you want to delete this account?"
    )
    if (!approved) return
    setUsers((current) => current.filter((item) => item.id !== userId))
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
  }

  function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!feedbackDraft.subject.trim() || !feedbackDraft.description.trim()) {
      return
    }
    const id = `FB-${1000 + tickets.length + 1}`
    setTickets((current) => [
      {
        id,
        studentId: feedbackDraft.anonymous ? undefined : roleProfiles.student.id,
        studentName: feedbackDraft.anonymous
          ? "Anonymous"
          : roleProfiles.student.name,
        category: feedbackDraft.category,
        subject: feedbackDraft.subject.trim(),
        description: feedbackDraft.description.trim(),
        status: "Pending",
        submittedAt: "May 26, 2026",
        assignedTo: "Admin",
        anonymous: feedbackDraft.anonymous,
      },
      ...current,
    ])
    setFeedbackDraft({
      category: "Academic",
      subject: "",
      description: "",
      anonymous: false,
    })
  }

  function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!eventDraft.title.trim() || !eventDraft.date.trim()) return
    setSeminars((current) => [
      {
        id: `SEM-${String(current.length + 1).padStart(3, "0")}`,
        title: eventDraft.title.trim(),
        speaker: eventDraft.speaker.trim() || "To be announced",
        date: eventDraft.date.trim(),
        location: eventDraft.location.trim() || "CS Department",
        description: "New seminar created from the admin event manager.",
        capacity: Number(eventDraft.capacity) || 30,
        enlistedStudentIds: [],
        host: roleProfiles.faculty.name,
        status: "Active",
      },
      ...current,
    ])
    setEventDraft({
      title: "",
      speaker: "",
      date: "",
      location: "",
      capacity: "30",
    })
  }

  function handleCreateThesis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!thesisDraft.title.trim() || !thesisDraft.authors.trim()) return

    setTheses((current) => [
      {
        id: `TH-${String(current.length + 1).padStart(3, "0")}`,
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
      },
      ...current,
    ])

    setThesisDraft({
      title: "",
      authors: "",
      year: "2026",
      category: "Software Engineering",
      adviser: "",
      abstract: "",
      pdfUrl: "",
    })
  }

  function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!announcementDraft.title.trim() || !announcementDraft.content.trim()) {
      return
    }
    setAnnouncements((current) => [
      {
        id: `ANN-${String(current.length + 1).padStart(3, "0")}`,
        title: announcementDraft.title.trim(),
        content: announcementDraft.content.trim(),
        date: "May 26, 2026",
        audience: announcementDraft.audience,
        priority: announcementDraft.priority,
      },
      ...current,
    ])
    setAnnouncementDraft({
      title: "",
      content: "",
      audience: "All Users",
      priority: "Medium",
    })
  }

  function handleEnlist(eventId: string) {
    const studentId = roleProfiles.student.id
    setSeminars((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event
        const alreadyEnlisted = event.enlistedStudentIds.includes(studentId)
        if (alreadyEnlisted) {
          return {
            ...event,
            enlistedStudentIds: event.enlistedStudentIds.filter(
              (id) => id !== studentId
            ),
          }
        }
        if (event.enlistedStudentIds.length >= event.capacity) return event
        return {
          ...event,
          enlistedStudentIds: [...event.enlistedStudentIds, studentId],
        }
      })
    )
  }

  function handleFacultySelfStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateFacultyStatus("FAC-014", myFacultyStatus, myFacultyNotes)
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
    curricula,
    setCurricula,
    yearSections,
    setYearSections,
    roleFilter,
    setRoleFilter,
    selectedUserType,
    setSelectedUserType,
    selectedAcademicSection,
    setSelectedAcademicSection,
    selectedClassYear,
    setSelectedClassYear,
    selectedCurriculumId,
    setSelectedCurriculumId,
    curriculumFilter,
    setCurriculumFilter,
    showAddUserForm,
    setShowAddUserForm,
    showThesisUploadForm,
    setShowThesisUploadForm,
    showAnnouncementForm,
    setShowAnnouncementForm,
    newSectionName,
    setNewSectionName,
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
    profile,
    navigation,
    userStats,
    studentGrades,
    gradeAverage,
    filteredTheses,
    filteredFaculty,
    filteredUsers,
    studentTickets,
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
    updateTicketStatus,
    updateFacultyStatus,
    confirmAndToggleUserStatus,
    confirmAndDeleteUser,
    confirmAndDeleteThesis,
    undoTicketResolution,
    handleAddClassSection,
    handleAddCurriculum,
    handleAddUser,
    handleFeedbackSubmit,
    handleCreateEvent,
    handleCreateThesis,
    handleCreateAnnouncement,
    handleEnlist,
    handleFacultySelfStatus,
  }
}

export type PortalDashboardModel = ReturnType<typeof usePortalDashboardModel>