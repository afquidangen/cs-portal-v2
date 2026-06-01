"use client"

import {
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
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCircle,
  X,
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { liveAnnouncements, newsItems, type NewsItem } from "@/lib/news-data"
import { cn } from "@/lib/utils"

import type { Role } from "../data/portal-data"
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
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % liveAnnouncements.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
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
      cso: <CsoModule />,
      schedule: <SchedulePanel model={model} />,
      curriculum: <CurriculumModule />,
      "quick-links": <QuickLinksModule />,
      users: <UsersModule model={model} />,
      academic: <AcademicModule model={model} />,
      templates: <TemplatesModule model={model} />,
      classes: <ClassesModule model={model} />,
      profile: <ProfileModule model={model} />,
      audit: <AuditModule />,
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
    const items = model.navigation.filter((item) => item.id !== "profile")

    const overview = items.filter((item) => ["overview"].includes(item.id))
    const academics = items.filter((item) =>
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
    const management = items.filter((item) =>
      ["announcements", "feedback", "templates", "users", "audit"].includes(item.id)
    )
    const services = items.filter((item) => ["quick-links", "cso"].includes(item.id))

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

  const quickAccessItems =
    role === "admin"
      ? [
          {
            label: "Manage Users",
            description: "Access accounts, roles, and permissions",
            icon: ShieldCheck,
            tone: "edu-ring-glacier edu-bg-soft-glacier",
            iconTone:
              "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
            moduleId: "users",
          },
          {
            label: "Announcements",
            description: "Publish updates and official notices",
            icon: Bell,
            tone: "edu-ring-lapis edu-bg-soft-lapis",
            iconTone:
              "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
            moduleId: "announcements",
          },
          {
            label: "Curriculum",
            description: "Review programs, subjects, and structures",
            icon: BookOpen,
            tone: "edu-ring-slate edu-bg-soft-slate",
            iconTone:
              "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300",
            moduleId: "curriculum",
          },
          {
            label: "Audit Logs",
            description: "Monitor records and system activity",
            icon: ClipboardList,
            tone: "edu-ring-abyss edu-bg-soft-abyss",
            iconTone:
              "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
            moduleId: "audit",
          },
        ]
      : role === "faculty"
        ? [
            {
              label: "My Classes",
              description: "View assigned classes and sections",
              icon: GraduationCap,
              tone: "edu-ring-glacier edu-bg-soft-glacier",
              iconTone:
                "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
              moduleId: "classes",
            },
            {
              label: "Grade Encoding",
              description: "Submit and review student grades",
              icon: BookOpen,
              tone: "edu-ring-lapis edu-bg-soft-lapis",
              iconTone:
                "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
              moduleId: "grades",
            },
          ]
        : [
            {
              label: "My Grades",
              description: "Check academic performance and updates",
              icon: GraduationCap,
              tone: "edu-ring-glacier edu-bg-soft-glacier",
              iconTone:
                "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
              moduleId: "grades",
            },
            {
              label: "Curriculum",
              description: "Browse year levels and subject plans",
              icon: BookOpen,
              tone: "edu-ring-lapis edu-bg-soft-lapis",
              iconTone:
                "border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
              moduleId: "curriculum",
            },
            {
              label: "Quick Links",
              description: "Open essential university services",
              icon: Layers3,
              tone: "edu-ring-slate edu-bg-soft-slate",
              iconTone:
                "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-300",
              moduleId: "quick-links",
            },
            {
              label: "My Profile",
              description: "View and edit your personal information",
              icon: UserCircle,
              tone: "edu-ring-abyss edu-bg-soft-abyss",
              iconTone:
                "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
              moduleId: "profile",
            },
          ]

  const adminStatusCards = [
    {
      label: "Students",
      value: "2",
      icon: GraduationCap,
      cardTone: "border-border bg-card",
      iconTone:
        "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Faculty",
      value: "2",
      icon: Layers3,
      cardTone: "border-border bg-card",
      iconTone:
        "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Thesis Records",
      value: "3",
      icon: BookOpen,
      cardTone: "border-border bg-card",
      iconTone:
        "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Open Tickets",
      value: "2",
      icon: Bell,
      cardTone: "border-border bg-card",
      iconTone:
        "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    },
  ]

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
            desktopSidebarCollapsed ? "w-[92px]" : "w-[300px]"
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

                {!desktopSidebarCollapsed ? (
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

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden rounded-xl text-white/80 hover:bg-white/10 hover:text-white md:inline-flex"
                onClick={() => setDesktopSidebarCollapsed((prev) => !prev)}
                aria-label="Toggle sidebar width"
              >
                {desktopSidebarCollapsed ? (
                  <PanelLeftOpen className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className={cn(
                "edu-sidebar-profile mt-4 block w-full rounded-2xl text-left transition-all",
                desktopSidebarCollapsed ? "p-2" : ""
              )}
            >
              <Card className="border-0 bg-transparent text-sidebar-foreground shadow-none">
                <CardContent
                  className={cn(
                    "flex items-center gap-3",
                    desktopSidebarCollapsed ? "justify-center p-2" : "p-4"
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

                  {!desktopSidebarCollapsed ? (
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
                  {!desktopSidebarCollapsed ? (
                    <div className="mb-2 px-2">
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
                        {group.label}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
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
                            desktopSidebarCollapsed && "justify-center px-2",
                            active && "edu-sidebar-button-active text-white"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              active ? "text-white" : "text-white/80 group-hover:text-white"
                            )}
                          />
                          {!desktopSidebarCollapsed ? (
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
              onClick={model.handleLogout}
              className={cn(
                "w-full rounded-2xl text-white hover:bg-white/10 hover:text-white",
                desktopSidebarCollapsed ? "justify-center px-0" : "justify-start"
              )}
            >
              <LogOut className="size-4 text-white" />
              {!desktopSidebarCollapsed ? <span className="ml-2 text-white">Logout</span> : null}
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
                <div ref={notifRef} className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-border bg-background shadow-sm"
                    aria-label="Notifications"
                    onClick={() => setShowNotifications((prev) => !prev)}
                  >
                    <Bell className="size-5" />
                  </Button>

                  {showNotifications ? (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
                      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                        <Bell className="size-4" />
                        <p className="text-sm font-semibold">Notifications</p>
                      </div>
                      <div className="max-h-64 space-y-1 overflow-y-auto p-2">
                        {model.announcements.length === 0 ? (
                          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                            No notifications yet.
                          </p>
                        ) : (
                          model.announcements.slice(0, 5).map((ann) => (
                            <div
                              key={ann.id}
                              className="rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                            >
                              <p className="text-sm font-medium text-foreground">
                                {ann.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {ann.date} &middot; {ann.priority}
                              </p>
                            </div>
                          ))
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
                  <LiveAnnouncementCard
                    announcement={liveAnnouncements[announcementIndex]}
                    index={announcementIndex}
                  />
                </div>

                {/* --- STATUS OVERVIEW PLACED AT THE TOP OF QUICK ACCESS LINKS --- */}
                {role === "admin" ? (
                  <div className="space-y-3 pt-2">
                    <div className="text-center">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-foreground">
                        Status overview
                      </p>
                    </div>

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {adminStatusCards.map((item) => {
                        const Icon = item.icon

                        return (
                          <div key={item.label}>                            
<Card
  className={cn(
    "overflow-hidden rounded-[28px] border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
    item.cardTone
  )}
>
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">                                  <div
                                    className={cn(
                                      "mb-4 flex size-16 items-center justify-center rounded-[22px] border shadow-sm",
                                      item.iconTone
                                    )}
                                  >
                                    <Icon className="size-7" strokeWidth={2.2} />
                                  </div>

<p className="text-sm font-semibold text-foreground">
  {item.label}
</p>

<p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
  {item.value}
</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                {role !== "faculty" ? (
                  <>
                    <div className="pt-2 text-center">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Quick access
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {quickAccessItems.map((item) => {
                        const Icon = item.icon

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => model.selectModule(item.moduleId as ModuleId)}
                            className="group text-left"
                          >
                            <Card
                              className={cn(
                                "overflow-hidden rounded-[28px] border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                                item.tone
                              )}
                            >
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-base font-semibold tracking-tight text-foreground">
                                      {item.label}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </div>

                                  <div
                                    className={cn(
                                      "flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-sm transition-transform duration-200 group-hover:scale-105",
                                      item.iconTone
                                    )}
                                  >
                                    <Icon className="size-6" strokeWidth={2.2} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : null}

                {role === "admin" ? (
                <Card className="relative overflow-hidden rounded-[32px] border border-border bg-card shadow-sm">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_32%),radial-gradient(circle_at_right,hsl(var(--foreground)/0.04),transparent_26%)]" />
                  <CardHeader className="relative pb-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
<Badge
  variant="outline"
  className="rounded-full border-border bg-white text-black dark:bg-background dark:text-muted-foreground"
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

<CardTitle className="max-w-3xl text-2xl font-semibold tracking-tight text-black dark:text-white lg:text-3xl">                      Academic overview
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
<h3 className="mt-1 text-xl font-semibold tracking-tight text-black dark:text-white">                              Portal performance overview
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
                                    index === 0 && "bg-[#A9CBE0]",
                                    index === 1 && "bg-[#668CA9]",
                                    index === 2 && "bg-[#225688]",
                                    index === 3 && "bg-[#092C56]",
                                    index === 4 && "bg-[#668CA9]",
                                    index === 5 && "bg-[#225688]",
                                    index === 6 && "bg-[#A9CBE0]"
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

                      <div className="hidden xl:block" />
                    </div>
                  </CardContent>
                </Card>
                ) : null}

                <Card className="overflow-hidden rounded-[32px] border border-border bg-card shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-black dark:text-white">
                          {role === "faculty"
                            ? "Announcements and CS Updates"
                            : "News & Announcements"}
                        </CardTitle>
                        <CardDescription className="mt-1 text-muted-foreground">
                          Featured updates with highlighted headlines and full article view
                        </CardDescription>
                      </div>

                      <Badge
                        variant="outline"
                        className="rounded-full border-border bg-muted text-muted-foreground"
                      >
                        Top stories
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 lg:grid-cols-3">
                      {newsItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedNews(item)}
                          className="group text-left"
                        >
<div className="relative h-full overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                            <div className="relative p-5">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-border bg-background/85 text-muted-foreground"
                                >
                                  {item.category}
                                </Badge>

                                <div className="edu-glacier edu-ring-glacier flex size-10 items-center justify-center rounded-2xl border shadow-sm">
                                  <FileText className="size-4" />
                                </div>
                              </div>

<h3 className="line-clamp-3 text-lg font-semibold tracking-tight text-foreground">
  {item.headline}
</h3>

<p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
  {item.summary}
</p>

<div className="mt-5 inline-flex items-center text-sm font-medium text-foreground">                                Read full update
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {model.activeModule !== "overview" ? (
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {model.currentTitle}
                </h2>
              </div>
            ) : null}

            <Separator className="mb-6" />

            <div className="min-h-[640px] rounded-[30px] border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-7">
              {renderModule()}
            </div>
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
                <p className="text-sm leading-8 text-foreground/90 dark:text-foreground">
                  {selectedNews.content}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} model={model} />

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
