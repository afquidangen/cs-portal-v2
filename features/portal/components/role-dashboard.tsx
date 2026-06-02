"use client"

import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
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
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react"
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
import { newsItems, type NewsItem } from "@/lib/news-data"
import { cn } from "@/lib/utils"

import type { Announcement, Role } from "../data/portal-data"
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
import { GradesModule } from "./modules/grades-module"
import { GreetingCard } from "./modules/greeting-card"
import { InstructorsModule } from "./modules/instructors-module"
import { LiveAnnouncementCard } from "./modules/live-announcement-card"
import { Metric } from "./shared/dashboard-ui"
import { OverviewModule } from "./modules/overview-module"
import { ProfileModule } from "./modules/profile-module"
import { ProfileDialog } from "./modules/profile-dialog"
import { QuickLinksModule } from "./modules/quick-links-module"
import { SchedulePanel } from "./modules/schedule-panel"
import { SeminarsModule } from "./modules/seminars-module"
import { TemplatesModule } from "./modules/templates-module"
import { ThesisLibraryModule } from "./modules/thesis-library-module"
import { UsersModule } from "./modules/users-module"

export function RoleDashboard({ role }: { role: Role }) {
  const model = usePortalDashboardModel(role)
  const [darkMode, setDarkMode] = useState(false)
  const [announcementIndex, setAnnouncementIndex] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
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
      if (role === "admin") return true
      if (role === "student") return a.audience === "All Users" || a.audience === "Students"
      return a.audience === "All Users" || a.audience === "Faculty"
    }),
    [model.announcements, role]
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
      grades: <GradesModule model={model} />,
      thesis: <ThesisLibraryModule model={model} />,
      announcements: <AnnouncementManagerModule model={model} />,
      feedback: <FeedbackModule model={model} />,
      seminars: <SeminarsModule model={model} />,
      availability: <AvailabilityModule model={model} />,
      instructors: <InstructorsModule model={model} />,
      cso: <CsoModule role={role} />,
      schedule: <SchedulePanel model={model} />,
      curriculum: <CurriculumModule model={model} />,
      "quick-links": <QuickLinksModule />,
      users: <UsersModule model={model} />,
      academic: <AcademicModule model={model} />,
      templates: <TemplatesModule model={model} />,
      classes: <ClassesModule model={model} />,
      profile: <ProfileModule model={model} />,
      audit: <AuditModule model={model} />,
      about: <AboutModule />,
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

  const sectionLabel =
    role === "admin"
      ? "Academic operations"
      : role === "faculty"
        ? "Instructor management"
        : "Student services"

  const roleLabel =
    role === "admin"
      ? "System Administrator"
      : role === "faculty"
        ? "Faculty Member"
        : "Student Portal User"

  const navigationGroups = useMemo(() => {
    const items = model.navigation.filter((item: { id: string }) => item.id !== "profile")

    const overview = items.filter((item: { id: string }) => ["overview"].includes(item.id))
    const academics = items.filter((item: { id: string }) =>
      [
        "grades",
        "classes",
        "curriculum",
        "academic",
        "instructors",
        "schedule",
        "availability",
        "seminars",
        "thesis",
      ].includes(item.id)
    )
    const management = items.filter((item: { id: string }) =>
      ["announcements", "feedback", "templates", "users", "audit"].includes(item.id)
    )
    const services = items.filter((item: { id: string }) => ["quick-links", "cso"].includes(item.id))

    return [
      { label: "Overview", items: overview },
      { label: "Academic", items: academics },
      { label: "Management", items: management },
      { label: "Services", items: services },
      {
        label: "Information",
        items: [{ id: "about", label: "About Us", icon: Info }],
      },
    ].filter((group) => group.items.length > 0)
  }, [model.navigation])

  const adminStatusCards = [
    {
      label: "Students",
      value: "2",
      icon: GraduationCap,
      tone: "edu-abyss" as const,
    },
    {
      label: "Faculty",
      value: "2",
      icon: Layers3,
      tone: "edu-lapis" as const,
    },
    {
      label: "Thesis Records",
      value: "3",
      icon: BookOpen,
      tone: "edu-slate" as const,
    },
    {
      label: "Open Tickets",
      value: "2",
      icon: Bell,
      tone: "edu-glacier" as const,
    },
  ]

  const eduCardIcon = (tone: string) => {
    const map: Record<string, string> = {
      "edu-abyss": "edu-abyss edu-ring-abyss",
      "edu-lapis": "edu-lapis edu-ring-lapis",
      "edu-slate": "edu-slate edu-ring-slate",
      "edu-glacier": "edu-glacier edu-ring-glacier",
    }
    return map[tone] || "edu-slate edu-ring-slate"
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

      <div className="mx-auto flex min-h-screen w-full max-w-[1720px]">
        <aside
          className={cn(
            "edu-sidebar-shell fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0",
            model.sidebarOpen ? "translate-x-0" : "-translate-x-full",
            effectivelyCollapsed ? "w-[92px]" : "w-[300px]"
          )}
        >
          <div className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="edu-sidebar-icon flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/10">
                  {role === "admin" ? (
                    <ShieldCheck className="size-5 text-white" />
                  ) : (
                    <GraduationCap className="size-5 text-white" />
                  )}
                </div>

                {!effectivelyCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      ComSite Portal
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
              onClick={() => setProfileOpen(true)}
              className={cn(
                "edu-sidebar-profile mt-4 block w-full rounded-2xl text-left transition-all",
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
                    {group.items.map((item: { id: string; label: string; icon: any }) => {
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
                            "group edu-sidebar-button flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all duration-200 text-white",
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
                "w-full rounded-2xl text-white hover:bg-white/10 hover:text-white",
                effectivelyCollapsed ? "justify-center px-0" : "justify-start"
              )}
            >
              <LogOut className="size-4 text-white" />
              {!effectivelyCollapsed ? <span className="ml-2 text-white">Logout</span> : null}
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-background">
          <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div ref={notifRef}>
                  <Button
                    ref={notifBtnRef}
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-border bg-background shadow-sm"
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
                      className="fixed z-50 w-80 rounded-2xl border border-border bg-white text-[#0c1c2e] shadow-2xl dark:border-[#1d3858] dark:bg-[#0f1b2b] dark:text-[#f5f8f8]"
                      style={{ top: notifPosition.top, right: notifPosition.right }}
                    >
                      <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-[#1d3858]">
                        <div className="flex items-center gap-2">
                          <Bell className="size-4" />
                          <p className="text-sm font-semibold">Notifications</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
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
                              className="rounded-md px-2 py-0.5 text-[11px] font-medium text-[#225688] transition-colors hover:bg-[#eef4f6] dark:text-[#a9cbe0] dark:hover:bg-[#143252]"
                            >
                              Mark all read
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                        {visibleAnnouncements.length === 0 ? (
                          <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                            <Bell className="size-8 text-black/20 dark:text-white/20" />
                            <p className="text-sm font-medium text-black/60 dark:text-white/60">
                              No notifications yet
                            </p>
                            <p className="text-xs text-black/40 dark:text-white/40">
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
                                className="group cursor-pointer rounded-xl border border-transparent px-3 py-3 transition-all hover:border-[#d8e4eb] hover:bg-[#eef4f6] dark:hover:border-[#1d3858] dark:hover:bg-[#143252]"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {!isRead ? (
                                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#225688]" />
                                    ) : null}
                                    <p className={"text-sm truncate " + (isRead ? "font-medium text-black/60 dark:text-white/60" : "font-semibold text-black dark:text-white")}>
                                      {ann.title}
                                    </p>
                                  </div>
                                  <span
                                    className={
                                      "mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none " +
                                      (ann.priority === "High"
                                        ? "bg-red-100 text-red-700"
                                        : ann.priority === "Medium"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-[#f2f7f8] text-[#5f7285] dark:bg-[#0f2034] dark:text-[#9fb4c5]")
                                    }
                                  >
                                    {ann.priority}
                                  </span>
                                </div>
                                <p className={"mt-1 line-clamp-2 text-xs leading-relaxed " + (isRead ? "text-black/50 dark:text-white/50" : "text-black/70 dark:text-white/80")}>
                                  {ann.content}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-black/50 dark:text-white/50">
                                  <span>{ann.date}</span>
                                  <span className="size-1 rounded-full bg-black/20 dark:bg-white/20" />
                                  <span className="rounded bg-[#f2f7f8] px-1.5 py-0.5 text-[#5f7285] dark:bg-[#0f2034] dark:text-[#9fb4c5]">{ann.audience}</span>
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
                  className="rounded-xl border-border bg-background shadow-sm"
                  aria-label="Toggle dark mode"
                  onClick={() => setDarkMode((current) => !current)}
                >
                  {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </Button>
              </div>
            </div>
          </header>

          <section className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {model.activeModule === "overview" ? (
              <div className="mb-8 space-y-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
                  <GreetingCard
                    name={model.profile.name}
                    roleLabel={roleLabel}
                    subtitle={subtitle}
                  />
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <Metric
                      label="Current GWA"
                      value={model.gradeAverage}
                      icon={BarChart3}
                      tone="abyss"
                    />
                    <Metric
                      label="Enrolled Subjects"
                      value={String(model.studentGrades.length)}
                      icon={BookOpen}
                      tone="lapis"
                    />
                    <Metric
                      label="Open Tickets"
                      value={String(
                        model.studentTickets.filter(
                          (t: { status: string }) => t.status !== "Resolved"
                        ).length
                      )}
                      icon={MessageSquareWarning}
                      tone="glacier"
                    />
                  </div>
                ) : null}

                {role === "faculty" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Metric
                        label="Handled Classes"
                        value={String(model.facultyClassSections.length)}
                        icon={ClipboardList}
                        tone="lapis"
                      />
                      <Metric
                        label="Students Enrolled"
                        value={String(
                          model.facultyClassStudents.filter((s) => s.enrolled).length
                        )}
                        icon={Users}
                        tone="abyss"
                      />
                    </div>
                    <SchedulePanel model={model} />
                  </>
                ) : null}

                {role === "admin" ? (
                  <div className="space-y-3 pt-2">
                    <div className="text-center">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Status overview
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {adminStatusCards.map((item) => {
                        const Icon = item.icon
                        const iconClasses = eduCardIcon(item.tone)

                        return (
                          <Card
                            key={item.label}
                            className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                          >
                            <CardContent className="p-5">
                              <div className={iconClasses + " mb-4 flex size-16 items-center justify-center rounded-[22px] border shadow-sm"}>
                                <Icon className="size-7" strokeWidth={2.2} />
                              </div>
                              <p className="text-sm font-semibold text-foreground">
                                {item.label}
                              </p>
                              <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
                                {item.value}
                              </p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {role === "admin" ? (
                <Card className="relative overflow-hidden rounded-[32px] border border-border bg-card shadow-sm">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_32%),radial-gradient(circle_at_right,hsl(var(--foreground)/0.04),transparent_26%)]" />
                  <CardHeader className="relative pb-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
<Badge
  variant="outline"
  className="rounded-full border-border bg-background text-foreground"
>
                        {sectionLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border bg-background/80 text-muted-foreground"
                      >
                        <Sparkles className="mr-1 size-3.5" />
                        Smart academic workspace
                      </Badge>
                    </div>

<CardTitle className="max-w-3xl text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">                      Academic overview
                    </CardTitle>

                    <CardDescription className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                      Real-time insight into institutional activity, platform usage, and
                      academic operations.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    <div className="grid gap-4">                      
                      <div className="rounded-[28px] border border-border bg-background/80 p-5 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Academic activity
                            </p>
<h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">                              Portal performance overview
                            </h3>
                          </div>
                          <div className="rounded-2xl border border-border bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                            This week
                          </div>
                        </div>

                        <div className="flex h-[220px] items-end gap-3 rounded-[24px] border border-border bg-gradient-to-b from-muted/40 to-background px-4 pb-4 pt-8">
                          {[42, 68, 54, 88, 72, 96, 78].map((height, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-3">
                              <div className="relative flex h-full w-full items-end justify-center">
                                <div
                                  className={cn(
                                    "relative w-full rounded-full shadow-sm transition-all duration-300",
                                    index === 0 && "bg-[var(--edu-glacier)]",
                                    index === 1 && "bg-[var(--edu-slate)]",
                                    index === 2 && "bg-[var(--edu-lapis)]",
                                    index === 3 && "bg-[var(--edu-abyss)]",
                                    index === 4 && "bg-[var(--edu-slate)]",
                                    index === 5 && "bg-[var(--edu-lapis)]",
                                    index === 6 && "bg-[var(--edu-glacier)]"
                                  )}
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      </div>
                  </CardContent>
                </Card>
                ) : null}
              </div>
            ) : null}

            {model.activeModule !== "overview" ? (
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {model.currentTitle}
                </h2>
              </div>
            ) : null}

            {renderModule()}
          </section>
        </div>
      </div>

      <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
        <DialogContent className="max-w-2xl rounded-[28px] border border-border bg-card">
          {selectedNews ? (
            <>
              <DialogHeader>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border bg-muted text-muted-foreground"
                  >
                    {selectedNews.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border bg-background text-muted-foreground"
                  >
                    University bulletin
                  </Badge>
                </div>

<DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">                  </DialogTitle>

                <DialogDescription className="pt-2 text-sm leading-7 text-muted-foreground">
                  {selectedNews.summary}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 rounded-[24px] border border-border bg-gradient-to-br from-background to-muted/40 p-5">
                <p className="text-sm leading-8 text-foreground/90">
                  {selectedNews.content}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="edu-sidebar-shell max-w-sm rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Confirm Logout</DialogTitle>
            <DialogDescription className="pt-1 text-white/70">
              Are you sure you want to log out? You will need to sign in again.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 shadow-sm hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="ghost"
              className="rounded-xl border border-red-400/30 bg-red-500/15 text-red-300 shadow-sm hover:bg-red-500/25 hover:text-red-200"
              onClick={() => {
                model.handleLogout()
                setLogoutOpen(false)
              }}
            >
              <LogOut className="mr-1.5 size-4" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} model={model} />

      <Dialog open={!!viewingAnnouncement} onOpenChange={(open) => { if (!open) setViewingAnnouncement(null) }}>
        <DialogContent className="max-w-lg rounded-[28px] border border-border bg-card shadow-2xl">
          {viewingAnnouncement ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl text-foreground">{viewingAnnouncement.title}</DialogTitle>
                  <span
                    className={
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase leading-none " +
                      (viewingAnnouncement.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : viewingAnnouncement.priority === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground")
                    }
                  >
                    {viewingAnnouncement.priority}
                  </span>
                </div>
                <DialogDescription className="pt-1 text-foreground/70">
                  Published on {viewingAnnouncement.date} &middot; For {viewingAnnouncement.audience}
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6">
                <p className="text-sm leading-7 text-foreground/85">
                  {viewingAnnouncement.content}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <footer className="border-t border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1720px] flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>&copy; 2026 ComSite Portal &mdash; ISPSC Computing Studies Unit</span>
          <span className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              comsite@ispsc.edu.ph
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
