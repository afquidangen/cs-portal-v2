"use client"

import { useRouter } from "next/navigation"
import { type FormEvent, useMemo, useState } from "react"

import { initialModule, roleNavigation } from "../config/navigation"
import {
  type Announcement,
  type AvailabilityStatus,
  type GradeRecord,
  type Role,
  type StudentStatus,
  type ThesisRecord,
  type TicketStatus,
  type UserRecord,
  announcementsSeed,
  classRosterSeed,
  facultySeed,
  feedbackSeed,
  gradeSeed,
  roleProfiles,
  thesisSeed,
  usersSeed,
  sectionSeed,
} from "../data/portal-data"
import { csvEscape, downloadFile } from "../lib/downloads"
import { calculateFinalGrade } from "../lib/grades"
import type { ModuleId } from "../types/navigation"
import { useStoredState } from "./use-stored-state"

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
  const [sections, setSections] = useStoredState<Record<string, string[]>>(
    "comsite-sections",
    sectionSeed
  )
  const [myFacultyStatus, setMyFacultyStatus] =
    useState<AvailabilityStatus>("Available")
  const [myFacultyNotes, setMyFacultyNotes] = useState(
    "Available for consultation."
  )
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)

  const [roleFilter, setRoleFilter] = useState("All")
  const [thesisYearFilter, setThesisYearFilter] = useState("All")
  const [thesisCategoryFilter, setThesisCategoryFilter] = useState("All")
  const [uploadName, setUploadName] = useState("No file selected")
  const [newUser, setNewUser] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "student" as Role,
    year: "1",
    section: "A",
    studentStatus: "Regular" as StudentStatus,
    curriculumId: "1",
    major: "",
    facultyType: "Regular",
    title: "",
    advisoryClass: "",
    contactNumber: "",
    sex: "Male",
    birthday: "",
    address: "",
  })
  const [feedbackDraft, setFeedbackDraft] = useState({
    category: "Academic",
    subject: "",
    description: "",
  })
  const [thesisDraft, setThesisDraft] = useState({
    title: "",
    authors: "",
    year: "2026",
    category: "Software Engineering",
    adviser: "",
    abstract: "",
  })
  const [announcementDraft, setAnnouncementDraft] = useState({
    title: "",
    content: "",
    audience: "All Users" as Announcement["audience"],
    priority: "Medium" as Announcement["priority"],
    imageUrl: "",
  })
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [showUploadThesis, setShowUploadThesis] = useState(false)
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  const profile = roleProfiles[role]
  const navigation = roleNavigation[role]

  const userStats = useMemo(
    () => ({
      students: users.filter((user) => user.role === "student").length,
      faculty: users.filter((user) => user.role === "faculty").length,
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
        thesisCategoryFilter === "All" ||
        thesis.category === thesisCategoryFilter
      return matchesSearch && matchesYear && matchesCategory
    })
  }, [query, theses, thesisCategoryFilter, thesisYearFilter])

  const filteredFaculty = useMemo(() => {
    const search = query.toLowerCase()
    return faculty.filter((member) =>
      [member.firstName, member.lastName, member.position, member.role, member.status, member.notes]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [faculty, query])

  const filteredUsers = useMemo(() => {
    const search = query.toLowerCase()
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.middleName} ${user.lastName}`
      const matchesSearch = [fullName, user.email, user.id, user.role]
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

  const yearSections = useMemo(() => {
    const yearKeys = Object.keys(sections)
    if (selectedYear) {
      return { [selectedYear]: sections[selectedYear] || [] }
    }
    return Object.fromEntries(yearKeys.map((y) => [y, sections[y]]))
  }, [sections, selectedYear])

  const selectedNav = navigation.find((item) => item.id === activeModule)
  const currentTitle = selectedNav?.label ?? "Dashboard"

  function selectModule(moduleId: ModuleId) {
    setActiveModule(moduleId)
    setQuery("")
    setSidebarOpen(false)
    setShowAddUser(false)
    setShowUploadThesis(false)
    setShowCreateAnnouncement(false)
    setSelectedYear(null)
  }

  function handleLogout() {
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

  function downloadThesisPdf(thesis: ThesisRecord) {
    downloadFile(
      `${thesis.id}-${thesis.title.replace(/\s+/g, "-")}.pdf`,
      `Title: ${thesis.title}\nAuthors: ${thesis.authors}\nYear: ${thesis.year}\nCategory: ${thesis.category}\nAdviser: ${thesis.adviser}\n\n${thesis.abstract}`,
      "application/pdf"
    )
  }

  function updateGrade(
    id: string,
    field: "midterm" | "finalTerm" | "remarks",
    value: string
  ) {
    setGrades((current) =>
      current.map((grade) =>
        grade.id === id
          ? {
              ...grade,
              ...(field === "remarks"
                ? { remarks: value }
                : { [field]: Number.isNaN(Number(value)) ? 0 : Number(value) }),
              updatedAt: "May 26, 2026",
            }
          : grade
      )
    )
  }

  function releaseGrades() {
    setGrades((current) =>
      current.map((grade) => ({
        ...grade,
        remarks: grade.remarks || "Passed",
        updatedAt: "May 26, 2026",
      }))
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
              resolvedAt:
                status === "Resolved"
                  ? new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : status === "Pending" && ticket.resolvedAt
                    ? undefined
                    : ticket.resolvedAt,
            }
          : ticket
      )
    )
  }

  function handleFacultySelfStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateFacultyStatus("FAC-014", myFacultyStatus, myFacultyNotes)
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
    const id = newUser.role === "student"
      ? `USR-${String(users.length + 1).padStart(3, "0")}`
      : `FAC-${String(users.length + 1).padStart(3, "0")}`
    setUsers((current) => [
      {
        id,
        firstName: newUser.firstName.trim(),
        middleName: newUser.middleName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        year: newUser.role === "student" ? Number(newUser.year) : undefined,
        section: newUser.role === "student" ? newUser.section : undefined,
        studentStatus: newUser.role === "student" ? newUser.studentStatus : undefined,
        curriculumId: newUser.role === "student" ? newUser.curriculumId : undefined,
        major: newUser.role === "student" ? newUser.major : undefined,
        facultyType: newUser.role === "faculty" ? (newUser.facultyType as "Part Time" | "Regular") : undefined,
        title: newUser.role === "faculty" ? newUser.title : undefined,
        advisoryClass: newUser.role === "faculty" ? newUser.advisoryClass : undefined,
        contactNumber: newUser.contactNumber,
        sex: newUser.sex,
        birthday: newUser.birthday,
        address: newUser.address,
        status: "Active",
      },
      ...current,
    ])
    setNewUser({
      firstName: "", middleName: "", lastName: "", email: "", role: "student",
      year: "1", section: "A", studentStatus: "Regular", curriculumId: "1",
      major: "", facultyType: "Regular", title: "", advisoryClass: "",
      contactNumber: "", sex: "Male", birthday: "", address: "",
    })
    setShowAddUser(false)
    setEditingUser(null)
  }

  function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingUser || !newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) return
    setUsers((current) =>
      current.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              firstName: newUser.firstName.trim(),
              middleName: newUser.middleName.trim(),
              lastName: newUser.lastName.trim(),
              email: newUser.email.trim(),
              role: newUser.role,
              year: newUser.role === "student" ? Number(newUser.year) : undefined,
              section: newUser.role === "student" ? newUser.section : undefined,
              studentStatus: newUser.role === "student" ? newUser.studentStatus : undefined,
              curriculumId: newUser.role === "student" ? newUser.curriculumId : undefined,
              major: newUser.role === "student" ? newUser.major : undefined,
              facultyType: newUser.role === "faculty" ? (newUser.facultyType as "Part Time" | "Regular") : undefined,
              title: newUser.role === "faculty" ? newUser.title : undefined,
              advisoryClass: newUser.role === "faculty" ? newUser.advisoryClass : undefined,
              contactNumber: newUser.contactNumber,
              sex: newUser.sex,
              birthday: newUser.birthday,
              address: newUser.address,
            }
          : user
      )
    )
    setNewUser({
      firstName: "", middleName: "", lastName: "", email: "", role: "student",
      year: "1", section: "A", studentStatus: "Regular", curriculumId: "1",
      major: "", facultyType: "Regular", title: "", advisoryClass: "",
      contactNumber: "", sex: "Male", birthday: "", address: "",
    })
    setShowAddUser(false)
    setEditingUser(null)
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
        studentId: roleProfiles.student.id,
        studentName: roleProfiles.student.name,
        category: feedbackDraft.category,
        subject: feedbackDraft.subject.trim(),
        description: feedbackDraft.description.trim(),
        status: "Pending",
        submittedAt: "May 26, 2026",
        assignedTo: "Admin",
      },
      ...current,
    ])
    setFeedbackDraft({
      category: "Academic",
      subject: "",
      description: "",
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
        tags: thesisDraft.category.split(" ").filter(Boolean).slice(0, 3),
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
    })
    setShowUploadThesis(false)
  }

  function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!announcementDraft.title.trim() || !announcementDraft.content.trim()) {
      return
    }
    if (editingAnnouncement) {
      setAnnouncements((current) =>
        current.map((a) =>
          a.id === editingAnnouncement.id
            ? {
                ...a,
                title: announcementDraft.title.trim(),
                content: announcementDraft.content.trim(),
                audience: announcementDraft.audience,
                priority: announcementDraft.priority,
                imageUrl: announcementDraft.imageUrl || undefined,
              }
            : a
        )
      )
    } else {
      setAnnouncements((current) => [
        {
          id: `ANN-${String(current.length + 1).padStart(3, "0")}`,
          title: announcementDraft.title.trim(),
          content: announcementDraft.content.trim(),
          date: "May 26, 2026",
          audience: announcementDraft.audience,
          priority: announcementDraft.priority,
          imageUrl: announcementDraft.imageUrl || undefined,
        },
        ...current,
      ])
    }
    setAnnouncementDraft({
      title: "",
      content: "",
      audience: "All Users",
      priority: "Medium",
      imageUrl: "",
    })
    setEditingAnnouncement(null)
    setShowCreateAnnouncement(false)
  }

  function handleUserStatusToggle(userId: string) {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" }
          : user
      )
    )
  }

  function deleteUser(userId: string) {
    setUsers((current) => current.filter((user) => user.id !== userId))
  }

  function deleteThesis(thesisId: string) {
    setTheses((current) => current.filter((t) => t.id !== thesisId))
  }

  function deleteAnnouncement(announcementId: string) {
    setAnnouncements((current) =>
      current.filter((a) => a.id !== announcementId)
    )
  }

  function addSection(year: string, sectionName: string) {
    setSections((current) => ({
      ...current,
      [year]: [...(current[year] || []), sectionName],
    }))
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
    tickets,
    setTickets,
    announcements,
    setAnnouncements,
    roster,
    setRoster,
    sections,
    setSections,
    showAddUser,
    setShowAddUser,
    editingUser,
    setEditingUser,
    showUploadThesis,
    setShowUploadThesis,
    showCreateAnnouncement,
    setShowCreateAnnouncement,
    editingAnnouncement,
    setEditingAnnouncement,
    roleFilter,
    setRoleFilter,
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
    thesisDraft,
    setThesisDraft,
    announcementDraft,
    setAnnouncementDraft,
    selectedYear,
    setSelectedYear,
    myFacultyStatus,
    setMyFacultyStatus,
    myFacultyNotes,
    setMyFacultyNotes,
    handleFacultySelfStatus,
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
    yearSections,
    selectModule,
    handleLogout,
    downloadGradeReport,
    downloadGradeTemplate,
    downloadThesisPdf,
    updateGrade,
    releaseGrades,
    updateTicketStatus,
    updateFacultyStatus,
    handleAddUser,
    handleUpdateUser,
    handleFeedbackSubmit,
    handleCreateThesis,
    handleCreateAnnouncement,
    handleUserStatusToggle,
    deleteUser,
    deleteThesis,
    deleteAnnouncement,
    addSection,
  }
}

export type PortalDashboardModel = ReturnType<typeof usePortalDashboardModel>
