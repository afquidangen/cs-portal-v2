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
  Search,
  Server,
  Sun,
  Users,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

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
import { MyClassesModule } from "./modules/my-classes-module"
import { SeminarsModule } from "./modules/seminars-module"
import { TemplatesModule } from "./modules/templates-module"
import { ThesisLibraryModule } from "./modules/thesis-library-module"
import { UsersModule } from "./modules/users-module"

export function RoleDashboard({ role }: { role: Role }) {
  const model = usePortalDashboardModel(role)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

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
        model.setGrades(d.grades ?? model.grades)
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
          model.setGrades(d.grades ?? model.grades)
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
      schedule: <SchedulePanel model={model} />,
      curriculum: <CurriculumModule model={model} />,
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
            { label: "Academic Setup", items: pick(["academic", "classes", "curriculum"]) },
            { label: "People & Records", items: pick(["users", "irregular-students", "instructors", "availability", "audit"]) },
            { label: "Communications", items: pick(["announcements", "feedback", "templates"]) },
            { label: "Resources", items: pick(["thesis", "quick-links", "cso"]) },
          ]
        : role === "faculty"
          ? [
              { label: "Workspace", items: pick(["overview", "profile"]) },
              { label: "Teaching", items: pick(["schedule", "student-roster", "grades", "availability"]) },
              { label: "Academic Records", items: pick(["instructors", "thesis"]) },
              { label: "Communications", items: pick(["announcements", "feedback"]) },
              { label: "Resources", items: pick(["quick-links", "cso"]) },
            ]
          : [
              { label: "Workspace", items: pick(["overview", "profile"]) },
              { label: "My Academics", items: pick(["my-classes", "grades", "curriculum", "grade-history", "thesis"]) },
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

  const adminStatusCards = [
    {
      label: "Students",
      value: String(model.userStats.students),
      icon: GraduationCap,
      delta: "+2 this week",
      accent: "blue",
      sparkline: [18, 24, 22, 30, 27, 43, 35, 31],
    },
    {
      label: "Faculty",
      value: String(model.userStats.faculty),
      icon: Layers3,
      delta: "No change",
      accent: "blue",
      sparkline: [16, 18, 15, 23, 17, 19, 18, 20],
    },
    {
      label: "Thesis Records",
      value: String(model.theses.length),
      icon: BookOpen,
      delta: "+1 this week",
      accent: "green",
      sparkline: [14, 17, 18, 24, 31, 19, 21, 20],
    },
    {
      label: "Open Tickets",
      value: String(model.tickets.filter((t: { status: string }) => t.status !== "Resolved").length),
      icon: Bell,
      delta: "+1 this week",
      accent: "amber",
      sparkline: [12, 14, 13, 18, 16, 23, 18, 15],
    },
  ]

  const performanceMetrics = [
    { label: "Page Views", value: "1,248", trend: "18.2%" },
    { label: "Users", value: String(totalUserCount), trend: "9.3%" },
    { label: "Sessions", value: String(Math.max(18, totalUserCount * 3)), trend: "12.5%" },
    { label: "Bounce Rate", value: "24.6%", trend: "-4.1%" },
  ]

  const systemHealth = [
    { label: "Database", status: "Operational", icon: Database },
    { label: "Server", status: "Operational", icon: Server },
    { label: "Storage", status: "Operational", icon: HardDrive },
    { label: "API Services", status: "Operational", icon: Code2 },
  ]

  const facultyActiveStudents = model.facultyClassStudents.filter((s: { enrolled: boolean; id: string; section: string }) => {
    if (!s.enrolled) return false
    const studentUser = model.users.find((u: { id: string; studentType?: string }) => u.id === s.id)
    if (studentUser?.studentType && ["Irregular", "Transferee", "Shifter", "Overstayed"].includes(studentUser.studentType)) {
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
  const facultyOverviewCards = [
    {
      label: "Availability",
      value: facultyStatus,
      helper: facultyAvailabilityUi.helper,
      icon: facultyAvailabilityUi.icon,
      accent: facultyAvailabilityUi.accent,
      interactive: true,
      sparkline: [14, 17, 20, 18, 19, 16, 15, 22],
    },
    {
      label: "Schedule Blocks",
      value: String(model.visibleSchedules.length),
      helper: `${model.facultySubjects.length} subject${model.facultySubjects.length === 1 ? "" : "s"}`,
      icon: ClipboardList,
      accent: "blue",
      sparkline: [18, 22, 20, 24, 23, 27, 21, 30],
    },
    {
      label: "Roster Students",
      value: String(facultyActiveStudents.length),
      helper: "Student roster",
      icon: Users,
      accent: "sky",
      sparkline: [22, 28, 26, 25, 29, 27, 31, 24],
    },
    {
      label: "Grade Records",
      value: String(model.facultyGradeRecords.length),
      helper: "Grades module",
      icon: BarChart3,
      accent: "violet",
      sparkline: [12, 18, 14, 16, 15, 19, 11, 22],
    },
  ]

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

  const studentOverviewCards = [
    {
      label: "Current GWA",
      value: model.gradeAverage,
      helper: "General weighted average",
      icon: BarChart3,
      accent: "blue",
      sparkline: [18, 20, 16, 22, 19, 24, 21, 23],
    },
    {
      label: "Enrolled Subjects",
      value: String(new Set(model.visibleSchedules.map((s: { subject: string }) => s.subject)).size),
      helper: "Currently enrolled this semester",
      icon: BookOpen,
      accent: "sky",
      sparkline: [14, 16, 13, 18, 15, 20, 17, 19],
    },
    {
      label: "Open Tickets",
      value: String(model.studentTickets.filter((t: { status: string }) => t.status !== "Resolved").length),
      helper: "Awaiting resolution",
      icon: MessageSquareWarning,
      accent: "amber",
      sparkline: [8, 6, 10, 5, 7, 4, 9, 6],
    },
    {
      label: "Units Taken",
      value: unitsDisplay,
      helper: "Passed / Total",
      icon: Layers3,
      accent: "emerald",
      sparkline: [12, 14, 13, 18, 16, 23, 18, 15],
    },
  ]

  const studentTodaySchedules = model.visibleSchedules.filter(
    (item: { day: string }) => item.day === todayLabel
  )

  const studentQuickActions = [
    { label: "Grades Registry", module: "grade-history" as ModuleId, icon: BarChart3, color: "violet" },
    { label: "Thesis Library", module: "thesis" as ModuleId, icon: BookOpen, color: "emerald" },
    { label: "Curriculum", module: "curriculum" as ModuleId, icon: GraduationCap, color: "amber" },
    { label: "Instructor Info", module: "instructors" as ModuleId, icon: Users, color: "sky" },
  ]

  const recentActivity = [
    { label: "New user registered", time: "2 minutes ago", icon: Users },
    { label: "Thesis record updated", time: "15 minutes ago", icon: BookOpen },
    { label: "Announcement published", time: "1 hour ago", icon: Bell },
    { label: "System backup completed", time: "2 hours ago", icon: Database },
    { label: "New ticket created", time: "3 hours ago", icon: MessageSquareWarning },
  ]

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
    <main className="min-h-screen bg-background text-foreground">
      {model.sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => model.setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="mx-auto flex min-h-screen w-full">
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
                  <Image
                    src="/portal-logo.svg"
                    alt="Portal logo placeholder"
                    width={32}
                    height={32}
                    className="size-full rounded-lg object-contain"
                  />
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
                    "flex items-center gap-3",
                    effectivelyCollapsed ? "justify-center p-2" : "p-4"
                  )}
                >
                  <Avatar className="size-10 ring-1 ring-white/15">
                    <AvatarImage
                      src={model.profilePhotoUrl || "/avatars/01.png"}
                      alt={model.profile.name}
                    />
                    <AvatarFallback className="bg-white/10 text-white">
                      {getInitials(model.profile.name)}
                    </AvatarFallback>
                  </Avatar>

                  {!effectivelyCollapsed ? (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {model.profile.name}
                      </p>
                      <p className="truncate text-xs text-white/80">
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

        <div className="min-w-0 flex-1 overflow-hidden bg-background">
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
                <div className="relative hidden w-[260px] lg:block xl:w-[340px]">
                  <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search portal..."
                    className="edu-topbar-highlight h-11 w-full rounded-lg border border-border bg-background px-11 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground hover:bg-muted/40 focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    Ctrl K
                  </span>
                </div>
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
                    {visibleAnnouncements.length > 0 ? (
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground shadow-sm">
                        {visibleAnnouncements.length > 9 ? "9+" : visibleAnnouncements.length}
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
                            {visibleAnnouncements.length} new
                          </span>
                          {visibleAnnouncements.length > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setReadAnnouncementIds(
                                  new Set(visibleAnnouncements.map((a) => a.id))
                                )
                              }
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
                                  setViewingAnnouncement(ann)
                                  setShowNotifications(false)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    setReadAnnouncementIds((prev) => new Set(prev).add(ann.id))
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
                                <p
                                  className={cn(
                                    "mt-3 text-xs font-medium",
                                    item.accent === "amber" ? "text-amber-600 dark:text-amber-300" : item.accent === "green" ? "text-emerald-600 dark:text-emerald-300" : "text-primary"
                                  )}
                                >
                                  {item.delta}
                                </p>
                              </div>
                              <svg viewBox="0 0 120 58" className="hidden h-16 w-full self-end opacity-90 sm:block">
                                <polyline
                                  fill="none"
                                  stroke={lineColor}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  points={item.sparkline.map((point, index) => `${index * 17},${56 - point}`).join(" ")}
                                />
                              </svg>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    <Card className="rounded-xl border border-border bg-card shadow-sm">
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
                        <div className="flex w-full flex-wrap items-center gap-2 text-xs sm:w-auto">
                          {["This Week", "This Month", "This Year"].map((label, index) => (
                            <button
                              key={label}
                              type="button"
                              className={cn(
                                "rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-muted",
                                index === 0 && "bg-primary/10 text-primary"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                          <button type="button" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                            <CalendarDays className="size-4" />
                          </button>
                          <button type="button" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
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
                                d="M10 116 C70 76, 115 78, 155 66 S235 36, 275 75 S350 126, 405 82 S475 49, 528 114 S610 122, 670 78"
                                fill="none"
                                stroke="var(--primary)"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              <path
                                d="M10 116 C70 76, 115 78, 155 66 S235 36, 275 75 S350 126, 405 82 S475 49, 528 114 S610 122, 670 78 L670 170 L10 170 Z"
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
                          <div className="mt-2 grid grid-cols-7 text-center text-xs text-muted-foreground">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                              <span key={day}>{day}</span>
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
                            <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                              View All
                            </button>
                          </div>
                          <div className="mt-5 space-y-4">
                            {recentActivity.map((item) => {
                              const Icon = item.icon
                              return (
                                <div key={item.label} className="flex gap-3">
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

      <footer className="border-t border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1720px] flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; 2026 ComScite Portal &mdash; ISPSC Computing Studies Unit</span>
          <span className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              comscite@ispsc.edu.ph
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" />
              077 000 0000
            </span>
            <span className="hidden sm:inline">San Nicolas, Candon City, Ilocos Sur</span>
          </span>
        </div>
      </footer>
    </main>
  )
}
