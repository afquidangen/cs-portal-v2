"use client"

import Image from "next/image"
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  Code2,
  Database,
  DoorOpen,
  Download,
  GraduationCap,
  HardDrive,
  ImageIcon,
  Info,
  Layers3,
  LogOut,
  Mail,
  Menu,
  MessageSquareWarning,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Server,
  Sun,
  Users,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
type NewsItem = {
  id: string
  title: string
  category: string
  summary: string
  content: string
  accent: string
}
import { cn } from "@/lib/utils"
import { formatScheduleTime } from "@/components/ui/time-picker"

import type { Announcement, AvailabilityStatus, Role } from "../data/portal-data"
import { availabilityOptions } from "../data/portal-data"
import { usePortalDashboardModel } from "../hooks/use-portal-dashboard-model"
import type { ModuleId } from "../types/navigation"
import { AcademicModule } from "./modules/academic-module"
import { AnnouncementManagerModule } from "./modules/announcement-manager-module"
import { AuditModule } from "./modules/audit-module"
import { AvailabilityModule } from "./modules/availability-module"
import { AboutModule } from "./modules/about-module"
import { ClassesModule } from "./modules/classes-module"
import { CsoModule } from "./modules/cso-module"
import { CurriculumModule } from "./modules/curriculum-module"
import { FeedbackModule } from "./modules/feedback-module"
import { GradeHistoryModule } from "./modules/grade-history-module"
import { GradesModule } from "./modules/grades-module"
import { IrregularStudentsModule } from "./modules/irregular-students-module"
import { StudentRosterModule } from "./modules/student-roster-module"
import { GreetingCard } from "./modules/greeting-card"
import { InstructorsModule } from "./modules/instructors-module"
import { LiveAnnouncementCard } from "./modules/live-announcement-card"
import { OverviewModule } from "./modules/overview-module"
import { ProfileModule } from "./modules/profile-module"

import { QuickLinksModule } from "./modules/quick-links-module"
import { SchedulePanel } from "./modules/schedule-panel"
import { SemesterHistoryModule } from "./modules/semester-history-module"
import { SemesterManagementModule } from "./modules/semester-management-module"
import { MyClassesModule } from "./modules/my-classes-module"
import { SeminarsModule } from "./modules/seminars-module"
import { TemplatesModule } from "./modules/templates-module"
import { ThesisLibraryModule } from "./modules/thesis-library-module"
import { UsersModule } from "./modules/users-module"
import { ManageGradesModule } from "./modules/manage-grades-module"
import { GradingAdminModule } from "./modules/grading-admin-module"
import { AdminSemesterArchiveModule } from "./modules/admin-semester-archive-module"
import { FacultySemesterArchiveModule } from "./modules/faculty-semester-archive-module"

export function RoleDashboard({ role }: { role: Role }) {
  const model = usePortalDashboardModel(role)

  const chartLabels = ["Users", "Tickets", "Grades", "Theses", "Announce.", "Audit"]

  const activityIcon = useCallback((action: string): LucideIcon => {
    const a = action.toLowerCase()
    if (a.includes("user") || a.includes("account") || a.includes("student") || a.includes("faculty")) return Users
    if (a.includes("thesis")) return BookOpen
    if (a.includes("announcement")) return Bell
    if (a.includes("ticket") || a.includes("feedback")) return MessageSquareWarning
    if (a.includes("grade") || a.includes("roster")) return ClipboardList
    if (a.includes("seminar") || a.includes("event")) return CalendarDays
    if (a.includes("schedule") || a.includes("class")) return Clock
    return Database
  }, [])

  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [dateFilter, setDateFilter] = useState<"week" | "month" | "year">("week")
  const [showCalendar, setShowCalendar] = useState(false)
  const [customDate, setCustomDate] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadServerData() {
      try {
        const res = await fetch("/api/portal/dashboard")
        if (!res.ok) throw new Error("Failed to load dashboard data")
        const json = await res.json()
        if (cancelled) return

        const d = json.data
        model.setUsers(d.users ?? model.users)
        model.setFaculty(d.faculty ?? model.faculty)
        model.setTheses(d.theses ?? model.theses)
        model.setSeminars(d.seminars ?? model.seminars)
        model.setTickets(d.tickets ?? model.tickets)
        model.setAnnouncements(d.announcements ?? model.announcements)
        model.setRoster(d.roster ?? model.roster)
        model.setSemesters(d.semesters ?? model.semesters)
        model.setSubjects(d.subjects ?? model.subjects)
        model.setCurricula(d.curricula ?? model.curricula)
        model.setYearSections(d.yearSections ?? model.yearSections)
        model.setClassSchedules(d.classSchedules ?? model.classSchedules)
        model.setCsoReports(d.csoReports ?? model.csoReports)
        model.setQuickLinks(d.quickLinks ?? model.quickLinks)
        model.setDownloadables(d.downloadables ?? model.downloadables)
        model.setAuditLogs(d.auditLogs ?? model.auditLogs)
        model.setGalleryItems(d.gallery ?? model.galleryItems)
        model.setCsoInfo(d.csoInfo ?? model.csoInfo)
        model.setGrades(d.grades ?? model.grades)
        setDataLoading(false)
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : "Unable to load data")
          setDataLoading(false)
        }
      }
    }

    void loadServerData()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return
      fetch("/api/portal/dashboard")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!json) return
          const d = json.data
          model.setUsers(d.users ?? model.users)
          model.setFaculty(d.faculty ?? model.faculty)
          model.setTheses(d.theses ?? model.theses)
          model.setSeminars(d.seminars ?? model.seminars)
          model.setTickets(d.tickets ?? model.tickets)
          model.setAnnouncements(d.announcements ?? model.announcements)
          model.setRoster(d.roster ?? model.roster)
          model.setSemesters(d.semesters ?? model.semesters)
          model.setSubjects(d.subjects ?? model.subjects)
          model.setCurricula(d.curricula ?? model.curricula)
          model.setYearSections(d.yearSections ?? model.yearSections)
          model.setClassSchedules(d.classSchedules ?? model.classSchedules)
          model.setCsoReports(d.csoReports ?? model.csoReports)
          model.setQuickLinks(d.quickLinks ?? model.quickLinks)
          model.setDownloadables(d.downloadables ?? model.downloadables)
          model.setAuditLogs(d.auditLogs ?? model.auditLogs)
          model.setGalleryItems(d.gallery ?? model.galleryItems)
          model.setCsoInfo(d.csoInfo ?? model.csoInfo)
          model.setGrades(d.grades ?? model.grades)
        })
        .catch(() => {})
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        model.refreshDashboardData()
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)
  const [isMediumScreen, setIsMediumScreen] = useState(
    () => typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches
      : false
  )
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(new Set())
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null)

  const getDateRange = useCallback((range: "week" | "month" | "year") => {
    const now = new Date()
    let start: Date
    let end: Date
    if (range === "week") {
      const day = now.getDay()
      start = new Date(now)
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else if (range === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else {
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    }
    return { start, end }
  }, [])

  const parseDate = useCallback((dateStr: string): Date | null => {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    }
    const parts = dateStr.split(/[, ]+/)
    if (parts.length >= 4) {
      const month = months[parts[0]]
      if (month !== undefined) {
        const day = parseInt(parts[1], 10)
        const year = parseInt(parts[2], 10)
        const timeParts = parts[3].split(":")
        const hour = parseInt(timeParts[0], 10)
        const minute = parseInt(timeParts[1], 10)
        const ampm = parts[4]?.toUpperCase()
        let hours = hour
        if (ampm === "PM" && hour !== 12) hours += 12
        if (ampm === "AM" && hour === 12) hours = 0
        return new Date(year, month, day, hours, minute)
      }
    }
    const iso = new Date(dateStr)
    return isNaN(iso.getTime()) ? null : iso
  }, [])

  const getDaysInMonth = useCallback((year: number, month: number) =>
    new Date(year, month + 1, 0).getDate(), [])

  const getFirstDayOfMonth = useCallback((year: number, month: number) =>
    new Date(year, month, 1).getDay(), [])

  const buildCalendarDays = useCallback((year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const grid: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) grid.push(d)
    while (grid.length % 7 !== 0) grid.push(null)
    return grid
  }, [getDaysInMonth, getFirstDayOfMonth])

  const toISODate = useCallback((year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, [])

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const todayStr = useMemo(() => {
    const d = new Date()
    return toISODate(d.getFullYear(), d.getMonth(), d.getDate())
  }, [toISODate])

  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())

  const calendarGrid = useMemo(
    () => buildCalendarDays(calendarYear, calendarMonth),
    [calendarYear, calendarMonth, buildCalendarDays]
  )

  const handlePrevMonth = useCallback(() => {
    setCalendarMonth((m) => {
      if (m === 0) { setCalendarYear((y) => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCalendarMonth((m) => {
      if (m === 11) { setCalendarYear((y) => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const handleDateSelect = useCallback((day: number) => {
    const iso = toISODate(calendarYear, calendarMonth, day)
    setCustomDate(iso)
    setShowCalendar(false)
  }, [calendarYear, calendarMonth, toISODate])

  const handleDownloadAcademic = useCallback(() => {
    window.print()
  }, [])

  const dateRange = useMemo(() => {
    if (customDate) {
      const start = new Date(customDate + "T00:00:00.000")
      const end = new Date(customDate + "T23:59:59.999")
      return { start, end }
    }
    return getDateRange(dateFilter)
  }, [dateFilter, customDate, getDateRange])

  const filterByDate = useCallback(
    (itemDate: string | number | undefined | null): boolean => {
      if (itemDate == null) return false
      const { start, end } = dateRange
      if (typeof itemDate === "number") return itemDate === start.getFullYear()
      const date = parseDate(itemDate)
      return date !== null && date >= start && date <= end
    },
    [dateRange, parseDate]
  )

  const filteredUsers = useMemo(
    () => model.users.filter((u: { createdAt?: string }) => filterByDate(u.createdAt)),
    [model.users, filterByDate]
  )
  const filteredTickets = useMemo(
    () => model.tickets.filter((t: { submittedAt: string }) => filterByDate(t.submittedAt)),
    [model.tickets, filterByDate]
  )
  const filteredGrades = useMemo(
    () => model.grades.filter((g: { updatedAt: string }) => filterByDate(g.updatedAt)),
    [model.grades, filterByDate]
  )
  const filteredTheses = useMemo(
    () => model.theses.filter((t: { year: number }) => filterByDate(t.year)),
    [model.theses, filterByDate]
  )
  const filteredAnnouncements = useMemo(
    () => model.announcements.filter((a: { date: string }) => filterByDate(a.date)),
    [model.announcements, filterByDate]
  )
  const filteredAuditLogs = useMemo(
    () => model.auditLogs.filter((log: { time: string }) => filterByDate(log.time)),
    [model.auditLogs, filterByDate]
  )

  const adminSparklineData = useMemo(() => [
    filteredUsers.length,
    filteredTickets.length,
    filteredGrades.length,
    filteredTheses.length,
    filteredAnnouncements.length,
    filteredAuditLogs.length,
  ], [filteredUsers.length, filteredTickets.length, filteredGrades.length, filteredTheses.length, filteredAnnouncements.length, filteredAuditLogs.length])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)")
    const handler = (e: MediaQueryListEvent) => setIsMediumScreen(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const effectivelyCollapsed = desktopSidebarCollapsed || isMediumScreen
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifPosition, setNotifPosition] = useState({ top: 0, right: 0 })
  const notifRef = useRef<HTMLDivElement>(null)
  const notifBtnRef = useRef<HTMLButtonElement>(null)

  const visibleAnnouncements = useMemo(
    () => model.announcements.filter((a) => {
      if (role === "admin") return (a.audience === "All Users" || a.audience === "Students" || a.audience === "Faculty") && !a.classSection && (!a.classSections?.length)
      if (role === "student") return a.audience === "All Users" || a.audience === "Students" || a.audience?.split(", ").includes(model.profileSection) || (a.classSections?.includes(model.profileSection) ?? false) || a.classSection === model.profileSection
      return a.audience === "All Users" || a.audience === "Faculty" || a.audience?.split(", ").some((s) => model.facultyClassSections.includes(s)) || (a.classSections?.some((s) => model.facultyClassSections.includes(s)) ?? false) || (a.classSection && model.facultyClassSections.includes(a.classSection)) || a.createdBy === model.profile.name
    }),
    [model.announcements, role, model.profileSection, model.facultyClassSections, model.profile.name]
  )

  const serverReadIds = useMemo(() => {
    const userId = model.profile.id
    if (!userId) return new Set<string>()
    return new Set(
      model.announcements
        .filter((a) => a.readBy?.includes(userId))
        .map((a) => a.id)
    )
  }, [model.announcements, model.profile.id])

  useEffect(() => {
    setReadAnnouncementIds(serverReadIds)
  }, [serverReadIds])

  const unreadCount = useMemo(
    () => visibleAnnouncements.filter((a) => !readAnnouncementIds.has(a.id)).length,
    [visibleAnnouncements, readAnnouncementIds]
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(() => {
    if (visibleAnnouncements.length < 2) return
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % visibleAnnouncements.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [visibleAnnouncements.length])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function renderModule() {
    const moduleMap: Record<string, React.ReactNode> = {
      overview: <OverviewModule model={model} />,
      "my-classes": <MyClassesModule model={model} />,
      thesis: <ThesisLibraryModule model={model} />,
      announcements: <AnnouncementManagerModule model={model} />,
      feedback: <FeedbackModule model={model} />,
      seminars: <SeminarsModule model={model} />,
      availability: <AvailabilityModule model={model} />,
      instructors: <InstructorsModule model={model} />,
      cso: <CsoModule model={model} />,
      classes: <ClassesModule model={model} />,
      grades: <GradesModule model={model} />,
      "manage-grades": <ManageGradesModule model={model} darkMode={darkMode} />,
      "grading-admin": <GradingAdminModule />,
      schedule: <SchedulePanel model={model} />,
      curriculum: <CurriculumModule model={model} />,
      "semester-admin": <SemesterManagementModule model={model} />,
      "semester-history": <SemesterHistoryModule model={model} />,
      "admin-semester-archive": <AdminSemesterArchiveModule model={model} />,
      "faculty-semester-archive": <FacultySemesterArchiveModule model={model} />,
      "quick-links": <QuickLinksModule model={model} />,
      "grade-history": <GradeHistoryModule model={model} />,
      users: <UsersModule model={model} />,
      academic: <AcademicModule model={model} />,
      templates: <TemplatesModule model={model} />,
      profile: <ProfileModule model={model} />,
      audit: <AuditModule model={model} />,
      "irregular-students": <IrregularStudentsModule model={model} />,
      "student-roster": <StudentRosterModule model={model} />,
      about: <AboutModule model={model} />,
    }

    return moduleMap[model.activeModule] || <OverviewModule model={model} />
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()

  const subtitle =
    role === "admin"
      ? "Monitor academic operations, users, and institutional activity."
      : role === "faculty"
        ? "Manage classes, grading workflows, and student-related tasks."
        : role === "csso_officer"
          ? "Manage CSSO records, reports, and student concerns."
          : "Access grades, announcements, seminars, and academic services."

  const totalUserCount = model.users.length || model.userStats.students + model.userStats.faculty + model.userStats.admins

  const navigationGroups = useMemo(() => {
    const items = model.navigation

    const pick = (ids: string[]) =>
      items.filter((item: { id: string }) => ids.includes(item.id))

    const roleGroups =
      role === "admin"
        ? [
            { label: "Workspace", items: pick(["overview", "profile"]) },
            { label: "Academic Setup", items: pick(["academic", "semester-admin", "classes", "curriculum", "grading-admin"]) },
            { label: "People & Records", items: pick(["users", "instructors", "availability", "audit"]) },
            { label: "Communications", items: pick(["announcements", "feedback", "templates"]) },
            { label: "Resources", items: pick(["thesis", "quick-links", "cso"]) },
          ]
        : role === "faculty"
          ? [
              { label: "Workspace", items: pick(["overview", "profile"]) },
              { label: "Teaching", items: pick(["schedule", "student-roster", "manage-grades", "availability"]) },
              { label: "Academic Records", items: pick(["instructors", "thesis", "faculty-semester-archive"]) },
              { label: "Communications", items: pick(["announcements", "feedback"]) },
              { label: "Resources", items: pick(["quick-links", "cso"]) },
            ]
          : role === "csso_officer"
            ? [
                { label: "Workspace", items: pick(["overview", "profile"]) },
                { label: "CSSO", items: pick(["cso", "thesis"]) },
                { label: "Communications", items: pick(["announcements"]) },
                { label: "Resources", items: pick(["quick-links"]) },
              ]
            : [
                { label: "Workspace", items: pick(["overview", "profile"]) },
                { label: "My Academics", items: pick(["my-classes", "grades", "semester-history", "curriculum", "grade-history", "thesis"]) },
                { label: "Campus Support", items: pick(["instructors", "availability", "announcements", "seminars", "feedback"]) },
                { label: "Resources", items: pick(["quick-links", "cso"]) },
              ]

    return [
      ...roleGroups,
      {
        label: "Information",
        items: [{ id: "about", label: "About Us", icon: Info }],
      },
    ].filter((group) => group.items.length > 0)
  }, [model.navigation, role])

  const adminStatusCards = useMemo(() => [
    {
      label: "Students",
      value: String(model.userStats.students),
      icon: GraduationCap,
      accent: "blue",
      sparkline: adminSparklineData,
    },
    {
      label: "Faculty",
      value: String(model.userStats.faculty),
      icon: Layers3,
      accent: "blue",
      sparkline: adminSparklineData,
    },
    {
      label: "Thesis Records",
      value: String(model.theses.length),
      icon: BookOpen,
      accent: "green",
      sparkline: adminSparklineData,
    },
    {
      label: "Open Tickets",
      value: String(model.tickets.filter((t: { status: string }) => t.status !== "Resolved").length),
      icon: Bell,
      accent: "amber",
      sparkline: adminSparklineData,
    },
  ], [model.userStats.students, model.userStats.faculty, model.theses.length, model.tickets, adminSparklineData])

  const performanceMetrics = useMemo(() => [
    { label: "Audit Entries", value: filteredAuditLogs.length.toLocaleString(), trend: "System log" },
    { label: "Users", value: (filteredUsers.length || model.userStats.students + model.userStats.faculty + model.userStats.admins).toLocaleString(), trend: "Registered accounts" },
    { label: "Theses", value: filteredTheses.length.toLocaleString(), trend: "Library records" },
    { label: "Tickets", value: String(filteredTickets.filter((t: { status: string }) => t.status !== "Resolved").length), trend: "Open tickets" },
  ], [filteredAuditLogs.length, filteredUsers.length, model.userStats.students, model.userStats.faculty, model.userStats.admins, filteredTheses.length, filteredTickets])

  const systemHealth = [
    { label: "Database", status: "Operational", icon: Database },
    { label: "Server", status: "Operational", icon: Server },
    { label: "Storage", status: "Operational", icon: HardDrive },
    { label: "API Services", status: "Operational", icon: Code2 },
  ]

  const facultyActiveStudents = model.facultyClassStudents.filter((s: { enrolled: boolean; id: string; section: string }) => {
    if (!s.enrolled) return false
    const studentUser = model.users.find((u: { id: string; studentType?: string }) => u.id === s.id)
    if (studentUser?.studentType && ["Irregular", "Transferee", "Shifter"].includes(studentUser.studentType)) {
      const sectionGrades = model.grades.filter(
        (g: { studentId: string; section: string; remarks?: string }) =>
          g.studentId === s.id && g.section === model.selectedClassSection
      )
      if (sectionGrades.length > 0 && sectionGrades.every((g: { remarks?: string }) => g.remarks === "Passed")) return false
      if (sectionGrades.length === 0) return false
    }
    return true
  })
  const facultyMember = model.faculty.find(
    (member: { email: string; name: string }) =>
      member.email === model.profile.email || member.name === model.profile.name
  )
  const facultyUser = model.users.find(
    (user: { email: string; name: string; role: string }) =>
      user.role === "faculty" && (user.email === model.profile.email || user.name === model.profile.name)
  )
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const facultyTodaySchedules = model.visibleSchedules.filter(
    (item: { day: string }) => item.day === todayLabel
  )
  const facultyFirstName = model.profile.name.split(" ")[0] || model.profile.name
  const facultyGreeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  })()
  const facultyTodayFull = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const facultyStatus = facultyMember?.status ?? "Available"
  const facultyAdvisoryClass = facultyUser?.advisoryClass || "No advisory class"
  const facultyDepartment = "BSCS"
  const availabilityStatusUi: Record<
    AvailabilityStatus,
    {
      helper: string
      icon: LucideIcon
      accent: "emerald" | "sky" | "violet" | "amber"
      activeClass: string
      inactiveClass: string
    }
  > = {
    Available: {
      helper: "Open for student questions, walk-ins, and quick coordination.",
      icon: CheckCircle2,
      accent: "emerald",
      activeClass: "border-emerald-500 bg-emerald-600 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950",
      inactiveClass: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
    },
    "In Class": {
      helper: "Teaching in class right now; availability resumes after the session.",
      icon: BookOpen,
      accent: "sky",
      activeClass: "border-sky-500 bg-sky-600 text-white shadow-sm dark:border-sky-400 dark:bg-sky-400 dark:text-sky-950",
      inactiveClass: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-300 dark:hover:bg-sky-900/50",
    },
    "Consultation Only": {
      helper: "Available for scheduled consultations and focused advising.",
      icon: Users,
      accent: "violet",
      activeClass: "border-violet-500 bg-violet-600 text-white shadow-sm dark:border-violet-400 dark:bg-violet-400 dark:text-violet-950",
      inactiveClass: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800/60 dark:bg-violet-950/35 dark:text-violet-300 dark:hover:bg-violet-900/50",
    },
    "Out of Office": {
      helper: "Away from the office; check back later for updated availability.",
      icon: DoorOpen,
      accent: "amber",
      activeClass: "border-amber-500 bg-amber-500 text-amber-950 shadow-sm dark:border-amber-300 dark:bg-amber-300 dark:text-amber-950",
      inactiveClass: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-300 dark:hover:bg-amber-900/50",
    },
  }
  const facultyAvailabilityUi = availabilityStatusUi[facultyStatus]
  const facultyHeroStats = [
    {
      label: "Classes Today",
      value: String(facultyTodaySchedules.length),
      icon: CalendarDays,
    },
    {
      label: "Handled Subjects",
      value: String(model.facultySubjects.length),
      icon: BookOpen,
    },
    {
      label: "Advisory Class",
      value: facultyAdvisoryClass,
      icon: Users,
    },
    {
      label: "Department",
      value: facultyDepartment,
      icon: GraduationCap,
    },
  ]
  const facultyOverviewCards = useMemo(() => [
    {
      label: "Availability",
      value: facultyStatus,
      helper: facultyAvailabilityUi.helper,
      icon: facultyAvailabilityUi.icon,
      accent: facultyAvailabilityUi.accent,
      interactive: true,
      sparkline: adminSparklineData,
    },
    {
      label: "Schedule Blocks",
      value: String(model.visibleSchedules.length),
      helper: `${model.facultySubjects.length} subject${model.facultySubjects.length === 1 ? "" : "s"}`,
      icon: ClipboardList,
      accent: "blue",
      sparkline: adminSparklineData,
    },
    {
      label: "Roster Students",
      value: String(facultyActiveStudents.length),
      helper: "Student roster",
      icon: Users,
      accent: "sky",
      sparkline: adminSparklineData,
    },
    {
      label: "Grading Sections",
      value: String(model.facultyClassSections.length),
      helper: "Active sections",
      icon: BarChart3,
      accent: "violet",
      sparkline: adminSparklineData,
    },
  ], [facultyStatus, facultyAvailabilityUi.helper, facultyAvailabilityUi.icon, facultyAvailabilityUi.accent, model.visibleSchedules.length, model.facultySubjects.length, facultyActiveStudents.length, model.facultyClassSections.length, adminSparklineData])

  const studentFirstName = model.profile.name.split(" ")[0] || model.profile.name
  const studentUser = model.users.find((u: { id: string }) => u.id === model.profile.id)
  const studentCourse = studentUser?.course ?? "BSCS"
  const studentYearLevel = studentUser?.currentYearLevel ?? (studentUser?.year ? `Year ${studentUser.year}` : "N/A")
  const studentSection = model.profileSection || studentUser?.section || "N/A"

  const allStudentGrades = model.allStudentGrades ?? []
  const totalUnits = allStudentGrades.reduce((s: number, g: { units: number }) => s + (g.units ?? 0), 0)
  const passedUnits = allStudentGrades
    .filter((g: { released?: boolean; remarks?: string }) => g.released && g.remarks === "Passed")
    .reduce((s: number, g: { units: number }) => s + (g.units ?? 0), 0)
  const unitsDisplay = totalUnits > 0 ? `${passedUnits} / ${totalUnits}` : "N/A"

  const studentProfileFacts = [
    { label: "Program", value: studentCourse, icon: BookOpen },
    { label: "Year Level", value: studentYearLevel, icon: GraduationCap },
    { label: "Section", value: studentSection, icon: Users },
    { label: "Student ID", value: model.profile.id, icon: ClipboardList },
  ]

  const studentOverviewCards = useMemo(() => [
    {
      label: "Current GWA",
      value: model.gradeAverage,
      helper: "General weighted average",
      icon: BarChart3,
      accent: "blue",
      sparkline: adminSparklineData,
    },
    {
      label: "Enrolled Subjects",
      value: String(new Set(model.visibleSchedules.map((s: { subject: string }) => s.subject)).size),
      helper: "Currently enrolled this semester",
      icon: BookOpen,
      accent: "sky",
      sparkline: adminSparklineData,
    },
    {
      label: "Open Tickets",
      value: String(model.studentTickets.filter((t: { status: string }) => t.status !== "Resolved").length),
      helper: "Awaiting resolution",
      icon: MessageSquareWarning,
      accent: "amber",
      sparkline: adminSparklineData,
    },
    {
      label: "Units Taken",
      value: unitsDisplay,
      helper: "Passed / Total",
      icon: Layers3,
      accent: "emerald",
      sparkline: adminSparklineData,
    },
  ], [model.gradeAverage, model.visibleSchedules, model.studentTickets, unitsDisplay, adminSparklineData])

  const studentTodaySchedules = model.visibleSchedules.filter(
    (item: { day: string }) => item.day === todayLabel
  )

  const studentQuickActions = [
    { label: "Grades Registry", module: "grade-history" as ModuleId, icon: BarChart3, color: "violet" },
    { label: "Thesis Library", module: "thesis" as ModuleId, icon: BookOpen, color: "emerald" },
    { label: "Curriculum", module: "curriculum" as ModuleId, icon: GraduationCap, color: "amber" },
    { label: "Instructor Info", module: "instructors" as ModuleId, icon: Users, color: "sky" },
  ]

  const timeAgo = useCallback((timeStr: string): string => {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
    const parts = timeStr.split(/[, ]+/)
    if (parts.length < 4) return timeStr
    const month = months[parts[0]]
    if (month === undefined) return timeStr
    const day = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    const timeParts = parts[3].split(":")
    const hour = parseInt(timeParts[0], 10)
    const minute = parseInt(timeParts[1], 10)
    const ampm = parts[4]?.toUpperCase()
    let hours = hour
    if (ampm === "PM" && hour !== 12) hours += 12
    if (ampm === "AM" && hour === 12) hours = 0
    const logDate = new Date(year, month, day, hours, minute)
    const diffMs = Date.now() - logDate.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "Just now"
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
    const diffHrs = Math.floor(diffMin / 60)
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`
    const diffDays = Math.floor(diffHrs / 24)
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
    return timeStr
  }, [])

  const recentActivity = useMemo(() =>
    filteredAuditLogs.slice(0, 5).map((log) => ({
      id: log.id,
      label: `${log.action} — ${log.actor}`,
      time: timeAgo(log.time),
      icon: activityIcon(log.action),
    })),
  [filteredAuditLogs, timeAgo, activityIcon])

  if (dataLoading) {
    return (
      <main className="dashboard-loading-shell flex min-h-screen items-center justify-center bg-background px-4">
        <div
          className="dashboard-loading-terminal"
          role="status"
          aria-label="Loading dashboard"
        >
          <div className="dashboard-loading-terminal-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="dashboard-loading-terminal-lines">
            <span className="dashboard-loading-terminal-line dashboard-loading-terminal-line-command">
              $ comscite dashboard --boot
            </span>
            <span className="dashboard-loading-terminal-line dashboard-loading-terminal-line-session">
              Authenticating session token...
            </span>
            <span className="dashboard-loading-terminal-line dashboard-loading-terminal-line-data">
              Loading workspace modules...
            </span>
            <span className="dashboard-loading-terminal-line dashboard-loading-terminal-line-ready">
              Preparing your dashboard
            </span>
          </div>
        </div>
      </main>
    )
  }

  if (dataError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-700">{dataError}</p>
          <button
            type="button"
            onClick={() => {
              setDataLoading(true)
              setDataError(null)
              window.location.reload()
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      {model.sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => model.setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="mx-auto flex h-full w-full">
        <aside
          className={cn(
            "edu-sidebar-shell fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground shadow-2xl shadow-blue-950/10 transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0",
            model.sidebarOpen ? "translate-x-0" : "-translate-x-full",
            effectivelyCollapsed ? "w-[88px]" : "w-[min(282px,92vw)]"
          )}
        >
          <div className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="edu-sidebar-icon flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/20">
                  {model.csoInfo?.portalLogoUrl ? (
                    <Image
                      src={model.csoInfo.portalLogoUrl}
                      alt="Portal logo"
                      width={32}
                      height={32}
                      className="size-full rounded-lg object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-lg bg-muted">
                      <ImageIcon className="size-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {!effectivelyCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      ComScite Portal
                    </p>
                    <p className="truncate text-xs capitalize text-white/80">
                      {role} workspace
                    </p>
                  </div>
                ) : null}
              </div>

              {!isMediumScreen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden rounded-xl text-white/80 hover:bg-white/10 hover:text-white lg:inline-flex"
                    onClick={() => setDesktopSidebarCollapsed((prev) => !prev)}
                    aria-label="Toggle sidebar width"
                  >
                    {desktopSidebarCollapsed ? (
                      <PanelLeftOpen className="size-4" />
                    ) : (
                      <PanelLeftClose className="size-4" />
                    )}
                  </Button>
                ) : null}
            </div>

            <button
              type="button"
              onClick={() => {
                model.selectModule("profile")
                model.setSidebarOpen(false)
              }}
              className={cn(
                "edu-sidebar-profile mt-4 block w-full rounded-xl text-left transition-all",
                effectivelyCollapsed ? "p-2" : ""
              )}
            >
              <Card className="border-0 bg-transparent text-sidebar-foreground shadow-none">
                <CardContent
                  className={cn(
                    "flex items-center",
                    effectivelyCollapsed ? "justify-center gap-3 p-2" : "gap-4 p-4"
                  )}
                >
                  <Avatar className={cn("ring-1 ring-white/15", effectivelyCollapsed ? "size-10" : "size-16")}>
                    <AvatarImage
                      src={model.profilePhotoUrl || "/avatars/01.png"}
                      alt={model.profile.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-white/10 text-white">
                      {getInitials(model.profile.name)}
                    </AvatarFallback>
                  </Avatar>

                  {!effectivelyCollapsed ? (
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-white">
                        {model.profile.name}
                      </p>
                      <p className="truncate text-sm text-white/80">
                        {model.profile.title}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </button>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-5">
              {navigationGroups.map((group) => (
                <div key={group.label}>
                  {!effectivelyCollapsed ? (
                    <div className="mb-2 px-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
                        {group.label}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    {group.items.map((item: { id: string; label: string; icon: LucideIcon }) => {
                      const Icon = item.icon
                      const active = item.id === model.activeModule

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            model.selectModule(item.id as ModuleId)
                            model.setSidebarOpen(false)
                          }}
                          className={cn(
                            "group edu-sidebar-button flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 text-white",
                            effectivelyCollapsed && "justify-center px-2",
                            active && "edu-sidebar-button-active text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              active ? "text-white" : "text-white/80 group-hover:text-white"
                            )}
                          />
                          {!effectivelyCollapsed ? (
                            <span className="truncate text-white">{item.label}</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <div className="border-t border-sidebar-border p-3">
            <Button
              variant="ghost"
              onClick={() => setLogoutOpen(true)}
              className={cn(
                "w-full rounded-lg text-white hover:bg-white/10 hover:text-white",
                effectivelyCollapsed ? "justify-center px-0" : "justify-start"
              )}
            >
              <LogOut className="size-4 text-white" />
              {!effectivelyCollapsed ? <span className="ml-2 text-white">Logout</span> : null}
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto bg-background">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-3 py-3 sm:min-h-[86px] sm:gap-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl md:hidden"
                  onClick={() => model.setSidebarOpen((open) => !open)}
                  aria-label="Toggle menu"
                >
                  {model.sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
                    {model.currentTitle}
                  </h2>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div ref={notifRef}>
                  <Button
                    ref={notifBtnRef}
                    variant="outline"
                    size="icon"
                    className={cn(
                      "relative rounded-lg border-border bg-background text-foreground shadow-sm transition hover:bg-muted hover:text-foreground",
                      showNotifications && "border-primary/40 bg-primary/10 text-primary"
                    )}
                    aria-label="Notifications"
                    onClick={() => {
                      if (notifBtnRef.current) {
                        const rect = notifBtnRef.current.getBoundingClientRect()
                        setNotifPosition({ top: rect.bottom + 8, right: document.documentElement.clientWidth - rect.right })
                      }
                      setShowNotifications((prev) => !prev)
                    }}
                  >
                    <Bell className="size-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </Button>

                  {showNotifications ? (
                    <div
                      className="fixed left-2 right-2 z-50 overflow-hidden rounded-xl border border-border bg-white text-black shadow-2xl shadow-blue-950/15 sm:left-auto sm:w-[24rem] sm:max-w-[calc(100vw-1rem)] dark:border-[#1d3858] dark:bg-[#071224] dark:text-white dark:shadow-black/40"
                      style={{ top: notifPosition.top, right: notifPosition.right }}
                    >
                      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3 text-foreground dark:bg-[#0f1b2b] dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-foreground dark:border-white/15 dark:bg-white/10 dark:text-white">
                            <Bell className="size-4" />
                          </span>
                          <p className="text-sm font-semibold">Notifications</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-black dark:border-white/15 dark:bg-white/10 dark:text-white">
                            {unreadCount} new
                          </span>
                          {unreadCount > 0 ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const ids = visibleAnnouncements.map((a) => a.id)
                                setReadAnnouncementIds(new Set(ids))
                                const results = await Promise.allSettled(
                                  ids.map((id) =>
                                    fetch(`/api/portal/announcements/${id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ userId: model.profile.id }),
                                    }).then((r) => {
                                      if (!r.ok) console.error("[read-sync] PATCH failed:", id, r.status)
                                    })
                                  )
                                )
                                for (const r of results) {
                                  if (r.status === "rejected") {
                                    console.error("[read-sync] PATCH rejected:", r.reason)
                                  }
                                }
                              }}
                              className="rounded-lg border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-black transition-colors hover:bg-muted dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                            >
                              Mark all read
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="max-h-80 space-y-1 overflow-y-auto bg-white p-2 dark:bg-[#071224]">
                        {visibleAnnouncements.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                            <Bell className="size-8 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">
                              No notifications yet
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              Announcements will appear here
                            </p>
                          </div>
                        ) : (
                          visibleAnnouncements.map((ann) => {
                            const isRead = readAnnouncementIds.has(ann.id)
                            return (
                              <div
                                key={ann.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  setReadAnnouncementIds((prev) => new Set(prev).add(ann.id))
                                  fetch(`/api/portal/announcements/${ann.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ userId: model.profile.id }),
                                  }).then((r) => {
                                    if (!r.ok) console.error("[read-sync] PATCH failed:", ann.id, r.status)
                                  }).catch((e) => console.error("[read-sync] PATCH network error:", e))
                                  setViewingAnnouncement(ann)
                                  setShowNotifications(false)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    setReadAnnouncementIds((prev) => new Set(prev).add(ann.id))
                                    fetch(`/api/portal/announcements/${ann.id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ userId: model.profile.id }),
                                    }).then((r) => {
                                      if (!r.ok) console.error("[read-sync] PATCH failed:", ann.id, r.status)
                                    }).catch((e) => console.error("[read-sync] PATCH network error:", e))
                                    setViewingAnnouncement(ann)
                                    setShowNotifications(false)
                                  }
                                }}
                                className={cn(
                                  "group cursor-pointer rounded-lg border px-3 py-3 transition-all hover:border-primary/30 hover:bg-accent dark:hover:bg-[#123768]",
                                  isRead
                                    ? "border-border bg-white text-black dark:border-[#1d3858] dark:bg-[#0f1b2b] dark:text-white"
                                    : "border-primary/20 bg-[#e6f2ff] text-black dark:border-[#28a7f2]/30 dark:bg-[#123768] dark:text-white"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {!isRead ? (
                                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                                    ) : null}
                                    <p className={"truncate text-sm " + (isRead ? "font-medium text-slate-600 dark:text-white/70" : "font-semibold text-black dark:text-white")}>
                                      {ann.title}
                                    </p>
                                  </div>
                                  <span
                                    className={
                                      "mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none " +
                                      (ann.priority === "High"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : ann.priority === "Medium"
                                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "bg-slate-100 text-slate-700 dark:bg-secondary dark:text-white/80")
                                    }
                                  >
                                    {ann.priority}
                                  </span>
                                </div>
                                <p className={"mt-1 line-clamp-2 text-xs leading-relaxed " + (isRead ? "text-slate-600 dark:text-white/65" : "text-black/85 dark:text-white/80")}>
                                  {ann.content}
                                </p>
                                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-600 dark:text-white/60">
                                  <span>{ann.date}</span>
                                  {ann.createdBy ? (
                                    <>
                                      <span className="size-1 rounded-full bg-muted-foreground/30" />
                                      <span className="text-[11px]">{ann.createdBy} - Faculty</span>
                                    </>
                                  ) : null}
                                  <span className="size-1 rounded-full bg-muted-foreground/30" />
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-[#8bd3ff] dark:text-[#071224]">{ann.audience}</span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-lg border-border bg-background text-foreground shadow-sm transition hover:bg-muted hover:text-foreground",
                    darkMode && "border-primary/40 bg-primary/10 text-primary"
                  )}
                  aria-label="Toggle dark mode"
                  onClick={() => setDarkMode((current) => !current)}
                >
                  {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </Button>
              </div>
            </div>
          </header>

          <section className="min-w-0 px-3 pb-6 sm:px-6 lg:px-8">
            {model.activeModule === "overview" ? (
              <div className="mb-8 space-y-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                  {role === "faculty" ? (
                    <Card className="relative overflow-hidden rounded-xl border-0 bg-[linear-gradient(115deg,#1551b8_0%,#1f6fe5_58%,#35b8f4_100%)] text-white shadow-[0_18px_45px_rgb(31_111_229_/_0.24)] dark:bg-[linear-gradient(115deg,#071224_0%,#1551b8_58%,#1f6fe5_100%)]">
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_top_right,rgba(151,224,255,0.58),transparent_46%)]" />
                      <CardContent className="relative grid min-h-[265px] gap-6 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/86">
                            <span className="inline-flex items-center gap-2 rounded-xl border border-white/16 bg-white/14 px-3 py-1 shadow-sm backdrop-blur">
                              <CalendarDays className="size-3.5" />
                              {facultyTodayFull}
                            </span>
                          </div>

                          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
                            {facultyGreeting}, {facultyFirstName}
                          </h1>
                          <p className="mt-4 max-w-xl text-sm leading-6 text-white/86">
                            Here&apos;s what&apos;s happening with your classes today.
                          </p>
                        </div>

                        <div className="grid gap-3 text-sm text-white/88 sm:grid-cols-2">
                          {facultyHeroStats.map((stat) => {
                            const Icon = stat.icon
                            return (
                              <div
                                key={stat.label}
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/16 bg-white/16 px-4 py-3 shadow-sm backdrop-blur"
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/16 bg-white/14 text-white">
                                  <Icon className="size-4" />
                                </span>
                                <span className="min-w-0">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">
                                    {stat.label}
                                  </p>
                                  <p className="mt-1 truncate text-sm font-semibold text-white">
                                    {stat.value}
                                  </p>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ) : role === "student" ? (
                    <Card className="relative overflow-hidden rounded-xl border-0 bg-[linear-gradient(115deg,#1551b8_0%,#1f6fe5_58%,#35b8f4_100%)] text-white shadow-[0_18px_45px_rgb(31_111_229_/_0.24)] dark:bg-[linear-gradient(115deg,#071224_0%,#1551b8_58%,#1f6fe5_100%)]">
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_top_right,rgba(151,224,255,0.58),transparent_46%)]" />
                      <CardContent className="relative grid min-h-[265px] gap-6 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/86">
                            <span className="inline-flex items-center gap-2 rounded-xl border border-white/16 bg-white/14 px-3 py-1 shadow-sm backdrop-blur">
                              <CalendarDays className="size-3.5" />
                              {facultyTodayFull}
                            </span>
                          </div>
                          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
                            {facultyGreeting}, {studentFirstName}
                          </h1>
                          <p className="mt-4 max-w-xl text-sm leading-6 text-white/86">
                            {subtitle}
                          </p>
                        </div>
                        <div className="grid gap-3 text-sm text-white/88 sm:grid-cols-2">
                          {studentProfileFacts.map((fact) => {
                            const Icon = fact.icon
                            return (
                              <div
                                key={fact.label}
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/16 bg-white/16 px-4 py-3 shadow-sm backdrop-blur"
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/16 bg-white/14 text-white">
                                  <Icon className="size-4" />
                                </span>
                                <span className="min-w-0">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">
                                    {fact.label}
                                  </p>
                                  <p className="mt-1 truncate text-sm font-semibold text-white">
                                    {fact.value}
                                  </p>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <GreetingCard
                      name={model.profile.name}
                      subtitle={subtitle}
                      stats={{
                        totalUsers: String(totalUserCount),
                        activeSessions: String(Math.max(18, Math.round(totalUserCount * 0.08))),
                        systemStatus: "All Systems Operational",
                      }}
                    />
                  )}
                  {visibleAnnouncements.length > 0 ? (
                    <LiveAnnouncementCard
                      announcement={visibleAnnouncements[announcementIndex % visibleAnnouncements.length]}
                      index={announcementIndex}
                      onViewAll={() => model.selectModule("announcements")}
                    />
                  ) : (
                    <LiveAnnouncementCard
                      announcement={{
                        id: "default",
                        title: "No announcements yet",
                        content: "Stay tuned for official university notices and updates.",
                        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                        audience: "All Users",
                        priority: "Low",
                      }}
                      index={0}
                      onViewAll={() => model.selectModule("announcements")}
                    />
                  )}
                </div>

                {role === "student" ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {studentOverviewCards.map((item) => {
                        const Icon = item.icon
                        const accentClass =
                          item.accent === "sky"
                            ? "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                            : item.accent === "violet"
                              ? "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                              : item.accent === "amber"
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                : item.accent === "emerald"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                  : "border-primary/20 bg-primary/10 text-primary"
                        const stroke =
                          item.accent === "sky"
                            ? "#38bdf8"
                            : item.accent === "violet"
                              ? "#8b5cf6"
                              : item.accent === "amber"
                                ? "#d7a11f"
                                : item.accent === "emerald"
                                  ? "#10b981"
                                  : "#2478ff"

                        return (
                          <Card
                            key={item.label}
                            className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <CardContent className="grid min-h-[138px] grid-cols-[minmax(0,1fr)_86px] gap-3 p-4 sm:p-5">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  {item.label}
                                </p>
                                <p className={cn("mt-5 truncate font-semibold tracking-tight text-foreground", item.label === "Units Taken" ? "text-xl" : "text-3xl")}>
                                  {item.value}
                                </p>
                                <p className="mt-3 truncate text-xs text-muted-foreground">
                                  {item.helper}
                                </p>
                              </div>
                              <div className="flex flex-col items-end justify-between gap-3">
                                <span className={cn("flex size-11 items-center justify-center rounded-lg border shadow-sm", accentClass)}>
                                  <Icon className="size-5" strokeWidth={2.1} />
                                </span>
                                <svg viewBox="0 0 92 42" className="h-11 w-full opacity-80">
                                  <polyline
                                    fill="none"
                                    stroke={stroke}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.25"
                                    points={item.sparkline.map((point, index) => `${index * 13},${40 - point}`).join(" ")}
                                  />
                                </svg>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.7fr)]">
                      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <CardHeader className="border-b border-border bg-muted/40 px-4 py-4 sm:px-5">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                            <CalendarDays className="size-5 text-primary" />
                            Today&apos;s Schedule
                          </CardTitle>
                          <CardDescription>
                            Classes pulled from your enrolled schedules.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          {studentTodaySchedules.length === 0 ? (
                            <div className="px-5 py-10 text-sm text-muted-foreground">
                              No classes scheduled for today.
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {studentTodaySchedules.slice(0, 4).map((item: { id: string; time: string; subject: string; section: string; room: string }) => (
                                <div key={item.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                                  <p className="text-sm font-semibold text-foreground">
                                    {formatScheduleTime(item.time)}
                                  </p>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {item.subject}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.section} - {item.room}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="w-fit rounded-lg border-primary/15 bg-primary/10 text-primary">
                                    {item.time.split(" - ")[0] ? "Today" : todayLabel}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="rounded-xl border border-border bg-card shadow-sm">
                        <CardHeader className="border-b border-border bg-muted/40 px-4 py-4 sm:px-5">
                          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                            Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                          {studentQuickActions.map((action) => {
                            const Icon = action.icon
                            const colorMap: Record<string, string> = {
                              sky: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300",
                              violet: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-300",
                              emerald: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
                              amber: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
                            }
                            return (
                              <button
                                key={action.module}
                                type="button"
                                onClick={() => model.selectModule(action.module)}
                                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 text-center transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-md"
                              >
                                <span className={cn("flex size-10 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-105", colorMap[action.color])}>
                                  <Icon className="size-5" />
                                </span>
                                <span className="text-xs font-semibold text-foreground">{action.label}</span>
                              </button>
                            )
                          })}
                          </CardContent>
                        </Card>
                    </div>
                  </div>
                ) : null}

                {role === "faculty" ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {facultyOverviewCards.map((item) => {
                        const Icon = item.icon
                        const accentClass =
                          item.accent === "sky"
                            ? "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                            : item.accent === "violet"
                              ? "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                              : item.accent === "amber"
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                : "border-primary/20 bg-primary/10 text-primary"
                        const stroke =
                          item.accent === "sky"
                            ? "#38bdf8"
                            : item.accent === "violet"
                              ? "#8b5cf6"
                              : item.accent === "amber"
                                ? "#d7a11f"
                                : "#2478ff"

                        return (
                          <Card
                            key={item.label}
                            className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <CardContent
                              className={cn(
                                "grid min-h-[138px] gap-3 p-4 sm:p-5",
                                item.interactive ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_86px]"
                              )}
                            >
                              <div className="min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                      {item.label}
                                    </p>
                                    <p className={cn("mt-5 truncate font-semibold tracking-tight text-foreground", item.interactive ? "text-2xl" : "text-3xl")}>
                                      {item.value}
                                    </p>
                                  </div>
                                  {item.interactive ? (
                                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg border shadow-sm", accentClass)}>
                                      <Icon className="size-5" strokeWidth={2.1} />
                                    </span>
                                  ) : null}
                                </div>
                                <p className={cn("mt-3 text-xs text-muted-foreground", item.interactive ? "line-clamp-2 leading-5" : "truncate")}>
                                  {item.helper}
                                </p>
                                {item.interactive ? (
                                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {availabilityOptions.map((status) => {
                                      const optionUi = availabilityStatusUi[status]
                                      return (
                                        <button
                                          key={status}
                                          type="button"
                                          onClick={() => {
                                            model.setMyFacultyStatus(status)
                                            if (facultyMember) {
                                              model.updateFacultyStatus(facultyMember.id, status, model.myFacultyNotes)
                                            }
                                          }}
                                          className={cn(
                                            "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors",
                                            facultyStatus === status ? optionUi.activeClass : optionUi.inactiveClass
                                          )}
                                        >
                                          {status === "Consultation Only" ? "Consultation" : status}
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </div>
                              {!item.interactive ? (
                                <div className="flex flex-col items-end justify-between gap-3">
                                  <span className={cn("flex size-11 items-center justify-center rounded-lg border shadow-sm", accentClass)}>
                                    <Icon className="size-5" strokeWidth={2.1} />
                                  </span>
                                  <svg viewBox="0 0 92 42" className="h-11 w-full opacity-80">
                                    <polyline
                                      fill="none"
                                      stroke={stroke}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2.25"
                                      points={item.sparkline.map((point, index) => `${index * 13},${40 - point}`).join(" ")}
                                    />
                                  </svg>
                                </div>
                              ) : null}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
                      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <CardHeader className="border-b border-border bg-muted/40 px-4 py-4 sm:px-5">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                            <CalendarDays className="size-5 text-primary" />
                            Today&apos;s Schedule
                          </CardTitle>
                          <CardDescription>
                            Classes pulled from your assigned schedules.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          {facultyTodaySchedules.length === 0 ? (
                            <div className="px-5 py-10 text-sm text-muted-foreground">
                              No classes scheduled for today.
                            </div>
                          ) : (
                            <div className="divide-y divide-border">
                              {facultyTodaySchedules.slice(0, 4).map((item: { id: string; time: string; subject: string; section: string; room: string }) => (
                                <div key={item.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                                  <p className="text-sm font-semibold text-foreground">
                                    {formatScheduleTime(item.time)}
                                  </p>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {item.subject}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.section} - {item.room}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="w-fit rounded-lg border-primary/15 bg-primary/10 text-primary">
                                    {item.time.split(" - ")[0] ? "Today" : todayLabel}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="flex flex-col gap-5">
                        <Card className="rounded-xl border border-border bg-card shadow-sm">
                          <CardHeader className="border-b border-border bg-muted/40 px-4 py-4 sm:px-5">
                            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                              Quick Actions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                            {[
                              { label: "Schedule", module: "schedule", icon: CalendarDays, color: "sky" },
                              { label: "Roster", module: "student-roster", icon: Users, color: "violet" },
                              { label: "Grades", module: "grades", icon: BarChart3, color: "emerald" },
                              { label: "Availability", module: "availability", icon: Clock, color: "amber" },
                            ].map((action) => {
                              const Icon = action.icon
                              const colorMap: Record<string, string> = {
                                sky: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300",
                                violet: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-300",
                                emerald: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
                                amber: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
                              }
                              return (
                                <button
                                  key={action.module}
                                  type="button"
                                  onClick={() => model.selectModule(action.module as ModuleId)}
                                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 text-center transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-md"
                                >
                                  <span className={cn("flex size-10 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-105", colorMap[action.color])}>
                                    <Icon className="size-5" />
                                  </span>
                                  <span className="text-xs font-semibold text-foreground">{action.label}</span>
                                </button>
                              )
                            })}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ) : null}

                {role === "admin" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {adminStatusCards.map((item) => {
                        const Icon = item.icon
                        const lineColor =
                          item.accent === "green"
                            ? "#25a66a"
                            : item.accent === "amber"
                              ? "#d7a11f"
                              : "#225688"
                        const iconClass =
                          item.accent === "green"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : item.accent === "amber"
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                              : "edu-bg-soft-lapis edu-ring-lapis text-primary"

                        return (
                          <Card key={item.label} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <CardContent className="grid min-h-[116px] gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_116px] sm:p-5">
                              <div className="min-w-0">
                                <div className={cn("mb-3 flex size-11 items-center justify-center rounded-xl border shadow-sm", iconClass)}>
                                  <Icon className="size-5" strokeWidth={2.1} />
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                                  {item.value}
                                </p>

                              </div>
                              <svg viewBox="0 0 120 58" className="hidden h-16 w-full self-end opacity-90 sm:block">
                                <polyline
                                  fill="none"
                                  stroke={lineColor}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  points={(() => {
                                    const data = item.sparkline
                                    const m = Math.max(1, ...data)
                                    return data.map((p, i) => `${i * 17},${56 - (p / m) * 50}`).join(" ")
                                  })()}
                                />
                              </svg>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <Card id="academic-overview-print" className="rounded-xl border border-border bg-card shadow-sm">
                      <CardHeader className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                            <Users className="size-5 text-primary" />
                            Academic Overview
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm text-muted-foreground">
                            Real-time insight into institutional activity, platform usage, and academic operations.
                          </CardDescription>
                        </div>
                        <div className="no-print flex w-full flex-wrap items-center gap-2 text-xs sm:w-auto">
                          {(["week", "month", "year"] as const).map((range) => (
                            <button
                              key={range}
                              type="button"
                              className={cn(
                                "rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-muted",
                                !customDate && dateFilter === range && "bg-primary/10 text-primary"
                              )}
                              onClick={() => { setDateFilter(range); setCustomDate(null) }}
                            >
                              {range === "week" ? "This Week" : range === "month" ? "This Month" : "This Year"}
                            </button>
                          ))}
                          {customDate && (
                            <span className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                              {new Date(customDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                          <button
                            type="button"
                            className={cn(
                              "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted",
                              customDate && "bg-primary/10 text-primary"
                            )}
                            onClick={() => {
                              const d = customDate ? new Date(customDate + "T00:00:00") : new Date()
                              setCalendarMonth(d.getMonth())
                              setCalendarYear(d.getFullYear())
                              setShowCalendar(true)
                            }}
                            title="Select a specific date"
                          >
                            <CalendarDays className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                            onClick={handleDownloadAcademic}
                            title="Download Academic Overview as PDF"
                          >
                            <Download className="size-4" />
                          </button>
                        </div>
                      </CardHeader>

                      <CardContent className="grid gap-6 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.55fr)_minmax(280px,0.65fr)]">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">Portal Performance</h3>
                          <div className="mt-4 grid gap-4 sm:grid-cols-4">
                            {performanceMetrics.map((metric) => (
                              <div key={metric.label}>
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                                <p className="mt-2 text-lg font-semibold text-foreground">{metric.value}</p>
                                <p className="mt-1 text-xs font-medium text-emerald-600">{metric.trend}</p>
                              </div>
                            ))}
                          </div>
                          <div className="edu-bg-soft-glacier mt-5 h-[200px] rounded-xl border border-border p-4">
                            <svg viewBox="0 0 680 170" className="h-full w-full">
                              {[0, 1, 2, 3].map((line) => (
                                <line key={line} x1="0" x2="680" y1={line * 42 + 8} y2={line * 42 + 8} stroke="currentColor" className="text-border" />
                              ))}
                              <path
                                d={(() => {
                                  const max = Math.max(1, ...adminSparklineData)
                                  const pts = adminSparklineData.map((v: number, i: number) => {
                                    const x = 10 + i * (660 / (adminSparklineData.length - 1 || 1))
                                    const y = 160 - (v / max) * 150
                                    return `${x},${y}`
                                  }).join(" L")
                                  return `M${pts}`
                                })()}
                                fill="none"
                                stroke="var(--primary)"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <path
                                d={(() => {
                                  const max = Math.max(1, ...adminSparklineData)
                                  const pts = adminSparklineData.map((v: number, i: number) => {
                                    const x = 10 + i * (660 / (adminSparklineData.length - 1 || 1))
                                    const y = 160 - (v / max) * 150
                                    return `${x},${y}`
                                  }).join(" L")
                                  return `M${pts} L670 170 L10 170 Z`
                                })()}
                                fill="url(#portalLineFill)"
                              />
                              <defs>
                                <linearGradient id="portalLineFill" x1="0" x2="0" y1="0" y2="1">
                                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div className="mt-2 grid grid-cols-6 text-center text-xs text-muted-foreground">
                            {chartLabels.map((label) => (
                              <span key={label}>{label}</span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-base font-semibold text-foreground">System Health</h3>
                          <div className="mt-5 space-y-4">
                            {systemHealth.map((item) => {
                              const Icon = item.icon
                              return (
                                <div key={item.label} className="flex items-center gap-3">
                                  <span className="edu-bg-soft-slate edu-ring-slate flex size-9 items-center justify-center rounded-lg border text-primary">
                                    <Icon className="size-4" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                                    <p className="text-xs font-semibold text-emerald-600">{item.status}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
                            <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => model.selectModule("audit")}>
                              View All
                            </button>
                          </div>
                          <div className="mt-5 space-y-4">
                            {recentActivity.filter((item) =>
                              model.query
                                ? item.label.toLowerCase().includes(model.query.toLowerCase())
                                : true
                            ).map((item) => {
                              const Icon = item.icon
                              return (
                                <div key={item.id} className="flex gap-3">
                                  <span className="edu-bg-soft-lapis edu-ring-lapis flex size-9 items-center justify-center rounded-lg border text-primary">
                                    <Icon className="size-4" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.time}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>
            ) : null}

            {renderModule()}
          </section>

        </div>
      </div>

      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNews ? (
            <>
              <DialogHeader>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-border bg-muted text-muted-foreground"
                  >
                    {selectedNews.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border bg-background text-muted-foreground"
                  >
                    University bulletin
                  </Badge>
                </div>

                <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                  {selectedNews.title}
                </DialogTitle>

                <DialogDescription className="pt-2 text-sm leading-7 text-muted-foreground">
                  {selectedNews.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 rounded-xl border border-border bg-card p-5 shadow-sm dark:bg-[#0f1b2b]">
                <p className="text-sm leading-8 text-foreground/90">
                  {selectedNews.content}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm overflow-hidden p-0">
          <div className="bg-[linear-gradient(120deg,#18479f_0%,#1f6fe5_60%,#28a7f2_100%)] px-6 py-5 text-white">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-white/20 bg-white/15">
              <LogOut className="size-5" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Confirm Logout</DialogTitle>
              <DialogDescription className="pt-1 text-white/78">
                You will need to sign in again to access this workspace.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 pt-4">
            <p className="text-sm leading-6 text-muted-foreground">
              End the current portal session for {model.profile.name}?
            </p>
            <DialogFooter className="mt-5 gap-2">
              <DialogClose asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  model.handleLogout()
                  setLogoutOpen(false)
                }}
              >
                <LogOut className="mr-1.5 size-4" />
                Logout
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingAnnouncement} onOpenChange={(open) => { if (!open) setViewingAnnouncement(null) }}>
        <DialogContent className="max-w-lg">
          {viewingAnnouncement ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl text-foreground">{viewingAnnouncement.title}</DialogTitle>
                  <span
                    className={
                      "shrink-0 px-2 py-0.5 text-[11px] font-semibold uppercase leading-none " +
                      (viewingAnnouncement.priority === "High"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : viewingAnnouncement.priority === "Medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    {viewingAnnouncement.priority}
                  </span>
                </div>
                <DialogDescription className="pt-1 text-muted-foreground">
                  Published on {viewingAnnouncement.date} &middot; For {viewingAnnouncement.audience}{viewingAnnouncement.createdBy ? ` · By ${viewingAnnouncement.createdBy} - Faculty` : ""}
                </DialogDescription>
              </DialogHeader>
              <div>
                <p className="text-sm leading-7 text-foreground/85">
                  {viewingAnnouncement.content}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!model.pendingConfirm}
        onOpenChange={(o) => { if (!o) model.setPendingConfirm(null) }}
        onConfirm={() => model.pendingConfirm?.onConfirm()}
        title={model.pendingConfirm?.title ?? ""}
        description={model.pendingConfirm?.description ?? ""}
        variant={model.pendingConfirm?.variant}
        confirmLabel={model.pendingConfirm?.confirmLabel}
        cancelLabel={model.pendingConfirm?.cancelLabel}
      />

      <Dialog open={showCalendar} onOpenChange={(open) => { if (!open) setShowCalendar(false) }}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
          </DialogHeader>
          <div className="p-1">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={handlePrevMonth}>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-semibold text-foreground">{monthNames[calendarMonth]} {calendarYear}</span>
              <button type="button" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={handleNextMonth}>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {dayHeaders.map((d) => (<span key={d}>{d}</span>))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarGrid.map((day, i) => {
                if (day === null) return <div key={i} />
                const iso = toISODate(calendarYear, calendarMonth, day)
                const isToday = iso === todayStr
                const isSelected = iso === customDate
                return (
                  <button
                    key={iso}
                    type="button"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => handleDateSelect(day)}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </main>
  )
}
