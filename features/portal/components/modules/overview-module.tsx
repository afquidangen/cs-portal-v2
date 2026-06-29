"use client"

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  DoorOpen,
  FileSpreadsheet,
  GraduationCap,
  Link as LinkIcon,
  Megaphone,
  MessageSquare,
  Quote,
  Target,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatScheduleTime } from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"
import { abbreviateCourse } from "@/lib/constants/courses"

import { availabilityOptions } from "../../data/portal-data"
import type { AvailabilityStatus } from "../../data/portal-data"
import type { ModuleId } from "../../types/navigation"
import type { PortalModuleProps } from "./types"
import { DeansListRankingsCard } from "../shared/deans-list-rankings-card"

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || "Student"
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

type PastelTone = "blue" | "sky" | "violet" | "purple" | "orange" | "amber" | "emerald" | "green"

const pastelIconClasses: Record<PastelTone, string> = {
  blue: "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/25 dark:bg-blue-400/15 dark:text-blue-200",
  sky: "border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/25 dark:bg-sky-400/15 dark:text-sky-200",
  violet: "border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-200",
  purple: "border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-400/25 dark:bg-purple-400/15 dark:text-purple-200",
  orange: "border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-400/25 dark:bg-orange-400/15 dark:text-orange-200",
  amber: "border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-300/30 dark:bg-amber-300/15 dark:text-amber-100",
  emerald: "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-200",
  green: "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-200",
}

const audienceBadgeClass = "rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700 hover:bg-violet-50 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-200 dark:hover:bg-violet-400/20"
const motivationQuoteIconClass = "size-5 fill-violet-600 text-violet-600 dark:fill-violet-300 dark:text-violet-300"

function pastelIconClass(tone: PastelTone) {
  return pastelIconClasses[tone]
}

function MiniSparkline({ tone = "blue" }: { tone?: "blue" | "purple" | "orange" | "green" }) {
  const colors = {
    blue: "#2563eb",
    purple: "#7c3aed",
    orange: "#f97316",
    green: "#16a34a",
  }

  return (
    <svg viewBox="0 0 120 58" className="h-14 w-24 shrink-0 opacity-95 sm:h-16 sm:w-28" aria-hidden="true">
      <path
        d="M4 48 C18 50 18 39 31 43 C45 47 44 19 56 20 C70 21 67 50 82 47 C98 44 94 8 116 4"
        fill="none"
        stroke={colors[tone]}
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M4 58 L4 48 C18 50 18 39 31 43 C45 47 44 19 56 20 C70 21 67 50 82 47 C98 44 94 8 116 4 L116 58 Z"
        fill={colors[tone]}
        opacity="0.08"
      />
    </svg>
  )
}

function HeroArt() {
  return (
    <div className="relative mx-auto flex min-h-[150px] w-full max-w-[320px] items-center justify-center sm:min-h-[180px] lg:min-h-[210px] lg:max-w-none" aria-hidden="true">
      <div className="absolute inset-x-5 bottom-0 h-24 rounded-full bg-blue-50/80 blur-xl" />
      <div className="absolute bottom-2 left-[7%] h-16 w-12 rounded-[50%_50%_12px_12px] bg-emerald-400/20 sm:h-20 sm:w-16 lg:left-8" />
      <div className="absolute bottom-8 left-[12%] h-16 w-4 rounded-full bg-emerald-500 sm:bottom-9 sm:h-20 sm:w-5 lg:left-12" />
      <div className="absolute bottom-9 left-[4%] h-12 w-4 -rotate-[35deg] rounded-full bg-emerald-400 sm:bottom-10 sm:h-16 sm:w-5 lg:left-5" />
      <div className="absolute bottom-9 left-[20%] h-12 w-4 rotate-[35deg] rounded-full bg-emerald-400 sm:bottom-10 sm:h-16 sm:w-5 lg:left-20" />
      <div className="absolute bottom-0 left-[11%] h-9 w-12 rounded-b-2xl rounded-t-md bg-blue-100 shadow-sm sm:h-11 sm:w-16 lg:left-10" />

      <div className="absolute bottom-8 right-[20%] h-11 w-32 -rotate-12 rounded-lg bg-blue-100 shadow-xl sm:bottom-10 sm:right-16 sm:h-14 sm:w-44" />
      <div className="absolute bottom-12 right-[24%] h-11 w-32 -rotate-12 rounded-lg bg-pink-100 shadow-xl sm:bottom-16 sm:right-20 sm:h-14 sm:w-44" />
      <div className="absolute bottom-16 right-[28%] h-11 w-32 -rotate-12 rounded-lg bg-white shadow-xl ring-1 ring-slate-200 sm:bottom-[5.5rem] sm:right-24 sm:h-14 sm:w-44" />
      <div className="absolute bottom-[6.6rem] right-[32%] h-14 w-24 -rotate-12 rounded-sm bg-blue-600 shadow-2xl sm:bottom-[8.5rem] sm:right-28 sm:h-20 sm:w-36">
        <div className="absolute -left-8 top-5 h-1 w-20 bg-blue-800 sm:-left-10 sm:top-7 sm:w-28" />
        <div className="absolute -left-10 top-5 size-2.5 rounded-full bg-blue-900 sm:-left-12 sm:top-6 sm:size-3" />
        <div className="absolute -bottom-8 left-6 h-12 w-1 rounded-full bg-orange-400 sm:-bottom-10 sm:left-9 sm:h-16" />
        <div className="absolute -bottom-10 left-4 h-5 w-4 rounded-full bg-orange-400 sm:-bottom-[3.25rem] sm:left-7 sm:h-6 sm:w-5" />
      </div>
      <div className="absolute bottom-5 right-[3%] h-12 w-24 rotate-12 rounded-full bg-blue-500 shadow-lg sm:bottom-6 sm:right-4 sm:h-16 sm:w-32" />
      <div className="absolute bottom-10 right-[2%] size-11 rounded-full bg-blue-600 shadow-lg sm:bottom-12 sm:right-3 sm:size-14" />
      <span className="absolute right-4 top-8 size-2 rounded-full bg-fuchsia-500" />
      <span className="absolute right-[58%] top-10 size-4 rounded-full bg-blue-200 sm:right-48 sm:top-16 sm:size-5" />
    </div>
  )
}

function AnnouncementArt() {
  return (
    <div className="relative mx-auto flex min-h-[110px] w-full max-w-[170px] items-center justify-center sm:min-h-[150px]" aria-hidden="true">
      <div className="absolute inset-x-2 bottom-5 h-16 rounded-full bg-blue-50 blur-xl" />
      <div className="size-20 rotate-12 rounded-sm bg-blue-600 shadow-xl sm:size-24" />
      <div className="absolute top-12 h-1 w-28 bg-blue-800 sm:top-16 sm:w-32" />
      <div className="absolute right-9 top-11 size-3 rounded-full bg-blue-900 sm:right-8 sm:top-[3.75rem]" />
      <span className="absolute left-2 top-5 size-1.5 rounded-full bg-orange-500" />
      <span className="absolute right-1 top-1 size-1.5 rounded-full bg-fuchsia-500" />
      <span className="absolute bottom-5 left-5 size-1.5 rounded-full bg-emerald-500" />
      <span className="absolute bottom-7 right-4 size-1.5 rounded-full bg-orange-400" />
    </div>
  )
}

function AdminArt() {
  return (
    <div className="relative mx-auto flex min-h-[150px] w-full max-w-[330px] items-center justify-center sm:min-h-[190px] lg:min-h-[220px] lg:max-w-none" aria-hidden="true">
      <div className="absolute inset-x-5 bottom-2 h-24 rounded-full bg-blue-50 blur-xl" />
      <div className="absolute bottom-3 left-[8%] h-28 w-40 rounded-lg border border-slate-200 bg-white shadow-xl sm:h-32 sm:w-48">
        <div className="flex h-9 items-center gap-1.5 border-b border-slate-100 px-3">
          <span className="size-2 rounded-full bg-red-300" />
          <span className="size-2 rounded-full bg-amber-300" />
          <span className="size-2 rounded-full bg-emerald-300" />
        </div>
        <div className="grid h-[calc(100%-2.25rem)] grid-cols-4 items-end gap-2 px-4 pb-4">
          <span className="h-10 rounded-t-md bg-blue-200" />
          <span className="h-16 rounded-t-md bg-blue-500" />
          <span className="h-12 rounded-t-md bg-violet-300" />
          <span className="h-20 rounded-t-md bg-emerald-400" />
        </div>
      </div>
      <div className="absolute bottom-12 right-[8%] size-28 rounded-2xl bg-blue-600 shadow-2xl sm:size-36">
        <div className="absolute inset-5 rounded-xl border border-white/20" />
        <Users className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-white sm:size-16" />
      </div>
      <div className="absolute bottom-5 right-[34%] flex size-16 rotate-12 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-xl ring-1 ring-slate-200 sm:size-20">
        <FileSpreadsheet className="size-8 sm:size-10" />
      </div>
      <span className="absolute right-8 top-8 size-2 rounded-full bg-fuchsia-500" />
      <span className="absolute left-[40%] top-10 size-5 rounded-full bg-blue-200" />
      <span className="absolute right-[42%] bottom-9 size-3 rounded-full bg-emerald-300" />
    </div>
  )
}

export function OverviewModule({ model }: PortalModuleProps) {
  const [announcementIdx, setAnnouncementIdx] = useState(0)
  const totalAnnouncements = model.announcements.length
  useEffect(() => {
    if (totalAnnouncements < 2) return
    const interval = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % totalAnnouncements)
    }, 5000)
    return () => clearInterval(interval)
  }, [totalAnnouncements])

  if (model.role === "faculty") {
    const facultyAnnouncements = model.filteredAnnouncements.length ? model.filteredAnnouncements : model.announcements
    const latestAnnouncement = facultyAnnouncements[announcementIdx % Math.max(1, facultyAnnouncements.length)]
    const facultyAnnouncementCount = facultyAnnouncements.length
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
    const todaySchedules = model.visibleSchedules.filter((item) => item.day === today)
    const facultyMember = model.faculty.find(
      (member) => member.email === model.profile.email || member.name === model.profile.name
    )
    const facultyUser = model.users.find(
      (user) => user.role === "faculty" && (user.email === model.profile.email || user.name === model.profile.name)
    )
    const facultyStatus = (facultyMember?.status ?? "Available") as AvailabilityStatus
    const activeStudents = model.facultyClassStudents.filter((student) => student.enrolled).length
    const advisoryClass = facultyUser?.advisoryClass || "N/A"
    const handledSubjects = new Set(model.visibleSchedules.map((item) => item.subject)).size || model.facultySubjects.length
    const scheduleBlocks = model.visibleSchedules.length

    const statusUi: Record<AvailabilityStatus, {
      helper: string
      icon: typeof CheckCircle2
      iconClass: string
      activeClass: string
      inactiveClass: string
    }> = {
      Available: {
        helper: "Open for student questions, walk-ins, and quick coordination.",
        icon: CheckCircle2,
        iconClass: pastelIconClass("emerald"),
        activeClass: "border-emerald-500 bg-emerald-600 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950",
        inactiveClass: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/35 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
      },
      "Consultation Only": {
        helper: "Available for scheduled consultations and focused advising.",
        icon: Users,
        iconClass: pastelIconClass("violet"),
        activeClass: "border-violet-500 bg-violet-600 text-white shadow-sm dark:border-violet-400 dark:bg-violet-400 dark:text-violet-950",
        inactiveClass: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-800/60 dark:bg-violet-950/35 dark:text-violet-300 dark:hover:bg-violet-900/50",
      },
      "In Class": {
        helper: "Teaching in class right now; availability resumes after the session.",
        icon: BookOpen,
        iconClass: pastelIconClass("sky"),
        activeClass: "border-sky-500 bg-sky-600 text-white shadow-sm dark:border-sky-400 dark:bg-sky-400 dark:text-sky-950",
        inactiveClass: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-950/35 dark:text-sky-300 dark:hover:bg-sky-900/50",
      },
      "Out of Office": {
        helper: "Away from the office; check back later for updated availability.",
        icon: DoorOpen,
        iconClass: pastelIconClass("amber"),
        activeClass: "border-amber-500 bg-amber-500 text-amber-950 shadow-sm dark:border-amber-300 dark:bg-amber-300 dark:text-amber-950",
        inactiveClass: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-300 dark:hover:bg-amber-900/50",
      },
    }
    const currentStatusUi = statusUi[facultyStatus]
    const facultyFacts = [
      { label: "Classes Today", value: String(todaySchedules.length), icon: BookOpen },
      { label: "Handled Subjects", value: String(handledSubjects), icon: BookOpen },
      { label: "Advisory Class", value: advisoryClass, icon: Users },
      { label: "Department", value: facultyUser?.course ? abbreviateCourse(facultyUser.course) : "N/A", icon: GraduationCap },
    ]
    const facultyStats = [
      {
        label: "Availability",
        value: facultyStatus,
        helper: currentStatusUi.helper,
        icon: currentStatusUi.icon,
        tone: "purple" as const,
        iconClass: currentStatusUi.iconClass,
        availability: true,
      },
      {
        label: "Schedule Blocks",
        value: String(scheduleBlocks),
        helper: `${handledSubjects} subject${handledSubjects === 1 ? "" : "s"}`,
        icon: CalendarDays,
        tone: "blue" as const,
        iconClass: pastelIconClass("blue"),
      },
      {
        label: "Roster Students",
        value: String(activeStudents),
        helper: "Student roster",
        icon: Users,
        tone: "blue" as const,
        iconClass: pastelIconClass("sky"),
      },
      {
        label: "Grading Sections",
        value: String(model.facultyClassSections.length),
        helper: "Active sections",
        icon: BarChart3,
        tone: "purple" as const,
        iconClass: pastelIconClass("violet"),
      },
    ]
    const quickActions = [
      { label: "Schedule", module: "schedule" as ModuleId, icon: CalendarDays, className: pastelIconClass("blue") },
      { label: "Roster", module: "student-roster" as ModuleId, icon: Users, className: pastelIconClass("violet") },
      { label: "Grades", module: "manage-grades" as ModuleId, icon: BarChart3, className: pastelIconClass("emerald") },
      { label: "Availability", module: "availability" as ModuleId, icon: Clock, className: pastelIconClass("orange") },
    ]

    return (
      <div className="space-y-4 pb-4 pt-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
            <CardContent className="grid min-h-[252px] gap-5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-center">
              <div className="min-w-0">
                <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-semibold text-blue-600 shadow-sm">
                  <CalendarDays className="size-4" />
                  {formatDate()}
                </span>
                <h1 className="mt-7 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                  {greeting()}, {firstName(model.profile.name) || "Faculty"}!
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Here&apos;s what&apos;s happening with your classes today.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {facultyFacts.map((fact) => {
                    const Icon = fact.icon
                    return (
                      <div key={fact.label} className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card px-4 shadow-sm">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Icon className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <p className="truncate text-xs font-semibold text-muted-foreground">{fact.label}</p>
                          <p className="mt-1 truncate text-base font-semibold text-foreground">{fact.value}</p>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <HeroArt />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
              <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                <Megaphone className="size-5 text-blue-600" />
                Live Announcements
              </CardTitle>
              <button type="button" onClick={() => model.selectModule("announcements")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View all
              </button>
            </CardHeader>
            <CardContent className="grid min-h-[188px] gap-4 px-5 pb-5 pt-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:px-6 sm:pb-6">
              {latestAnnouncement ? (
                <div className="flex min-w-0 flex-col justify-between">
                  <div key={announcementIdx} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    <Badge className={audienceBadgeClass}>
                      {latestAnnouncement.audience}
                    </Badge>
                    <h2 className="mt-5 line-clamp-2 text-base font-bold uppercase tracking-tight text-foreground">
                      {latestAnnouncement.title}
                    </h2>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {latestAnnouncement.content}
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {latestAnnouncement.date}
                    </div>
                  </div>
                  {facultyAnnouncementCount > 1 ? (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {Array.from({ length: facultyAnnouncementCount }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === announcementIdx % facultyAnnouncementCount
                              ? "w-5 bg-primary"
                              : "w-1.5 bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-h-[140px] items-center text-sm text-muted-foreground">
                  No announcements yet.
                </div>
              )}
              <AnnouncementArt />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {facultyStats.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
                <CardContent className="min-h-[178px] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn("flex size-11 items-center justify-center rounded-lg", item.iconClass)}>
                      <Icon className="size-5" />
                    </div>
                    {!item.availability ? <MiniSparkline tone={item.tone} /> : null}
                  </div>
                  <p className="mt-5 text-sm font-semibold text-muted-foreground">{item.label}</p>
                  <p className={cn("mt-5 font-semibold tracking-tight text-foreground", item.availability ? "text-2xl" : "text-3xl")}>
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.helper}</p>
                  {item.availability ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {availabilityOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            model.setMyFacultyStatus(status)
                            if (facultyMember) model.updateFacultyStatus(facultyMember.id, status, model.myFacultyNotes)
                          }}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                            facultyStatus === status ? statusUi[status].activeClass : statusUi[status].inactiveClass
                          )}
                        >
                          {status === "Consultation Only" ? "Consultation" : status}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DeansListRankingsCard
          facultyView={true}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(320px,0.95fr)_minmax(320px,1.08fr)]">
          <Card className="rounded-lg border-border bg-card shadow-sm">
            <CardHeader className="px-6 pb-0 pt-6">
              <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                <CalendarDays className="size-5 text-primary" />
                Today&apos;s Schedule
              </CardTitle>
              <p className="pt-1 text-sm text-muted-foreground">Classes pulled from your assigned schedules.</p>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-6">
              {todaySchedules.length ? (
                <div className="space-y-3">
                  {todaySchedules.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm font-semibold text-foreground">{formatScheduleTime(item.time)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.section} - {item.room}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                  <div className="relative mb-6 flex size-28 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/40">
                    <CalendarDays className="size-12 text-violet-200 dark:text-violet-400/60" />
                    <span className="absolute bottom-4 right-3 flex size-12 items-center justify-center rounded-full border-4 border-white bg-blue-50 text-blue-400 dark:border-border dark:bg-blue-950/40 dark:text-blue-300">
                      <Clock className="size-5" />
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground/80">No classes scheduled for today.</p>
                  <p className="mt-2 text-sm text-muted-foreground">Enjoy your free time or review your materials!</p>
                  <Button type="button" variant="outline" className="mt-6 h-10 rounded-md border-border text-primary" onClick={() => model.selectModule("schedule")}>
                    View My Schedule
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card shadow-sm">
            <CardHeader className="px-6 pb-0 pt-6">
              <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-[250px] flex-wrap items-start gap-7 px-6 pb-6 pt-10">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.module}
                    type="button"
                    onClick={() => model.selectModule(action.module)}
                    className="group flex w-20 flex-col items-center gap-3 text-center"
                  >
                    <span className={cn("flex size-11 items-center justify-center rounded-lg transition-transform group-hover:-translate-y-0.5", action.className)}>
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs font-semibold leading-5 text-muted-foreground">{action.label}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-lg border-border bg-card shadow-sm">
            <div className="absolute -right-16 top-8 size-48 rounded-[38%_62%_49%_51%] bg-violet-200/70" />
            <div className="absolute -right-9 top-14 size-40 rounded-[64%_36%_40%_60%] bg-purple-400/55" />
            <CardHeader className="relative px-6 pb-0 pt-6">
              <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                <Quote className={motivationQuoteIconClass} />
                Motivation Corner
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-6 pb-6 pt-10">
              <blockquote className="max-w-sm text-sm font-medium leading-7 text-slate-800 dark:text-foreground/85">
                &quot;The beautiful thing about learning is nobody can take it away from you.&quot;
              </blockquote>
              <p className="mt-5 text-sm font-semibold text-slate-700 dark:text-muted-foreground">- B.B. King</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (model.role === "admin") {
    const latestAnnouncement = model.announcements[announcementIdx % Math.max(1, model.announcements.length)]
    const openTickets = model.tickets.filter((ticket) => ticket.status !== "Resolved").length
    const activeUsers = model.users.filter((user) => user.status !== "Inactive" && !user.deletedAt).length
    const adminFacts = [
      { label: `ID: ${model.profile.id || "SA-00-0000"}`, icon: ClipboardList },
    ]
    const adminStats = [
      {
        label: "Students",
        value: String(model.userStats.students),
        helper: "Registered accounts",
        icon: GraduationCap,
        tone: "blue" as const,
        iconClass: pastelIconClass("blue"),
      },
      {
        label: "Faculty",
        value: String(model.userStats.faculty),
        helper: "Teaching personnel",
        icon: Users,
        tone: "purple" as const,
        iconClass: pastelIconClass("violet"),
      },
      {
        label: "Thesis Records",
        value: String(model.theses.length),
        helper: "Library records",
        icon: BookOpen,
        tone: "green" as const,
        iconClass: pastelIconClass("emerald"),
      },
      {
        label: "Open Tickets",
        value: String(openTickets),
        helper: "Needs attention",
        icon: MessageSquare,
        tone: "orange" as const,
        iconClass: pastelIconClass("orange"),
      },
    ]
    const analyticsData = [
      { label: "Users", value: model.users.length, color: "#2563eb" },
      { label: "Tickets", value: model.tickets.length, color: "#7c3aed" },
      { label: "Grades", value: model.grades.length, color: "#f97316" },
      { label: "Theses", value: model.theses.length, color: "#16a34a" },
      { label: "Announce.", value: model.announcements.length, color: "#0891b2" },
      { label: "Audit", value: model.auditLogs.length, color: "#475569" },
    ]
    const analyticsMax = Math.max(1, ...analyticsData.map((item) => item.value))
    const recentActivity = model.auditLogs.slice(0, 5).map((item) => ({
      id: item.id,
      label: item.action,
      time: item.time,
    }))
    const performanceMetrics = [
      { label: "Audit Entries", value: model.auditLogs.length.toLocaleString(), trend: "System log" },
      { label: "Users", value: activeUsers.toLocaleString(), trend: "Registered accounts" },
      { label: "Theses", value: model.theses.length.toLocaleString(), trend: "Library records" },
      { label: "Tickets", value: openTickets.toLocaleString(), trend: "Open tickets" },
    ]

    return (
      <div className="space-y-4 pb-4 pt-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="grid min-h-[252px] gap-5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-center">
              <div className="flex min-w-0 flex-col justify-center">
                <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-xs font-semibold text-blue-600 shadow-sm dark:border-blue-400/25 dark:bg-blue-400/15 dark:text-blue-200">
                  <CalendarDays className="size-4" />
                  {formatDate()}
                </span>
                <h1 className="mt-7 text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                  {greeting()}, {firstName(model.profile.name)}!
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Monitor academic operations, users, and institutional activity.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 sm:mt-9">
                  {adminFacts.map((fact) => {
                    const Icon = fact.icon
                    return (
                      <span
                        key={fact.label}
                        className="inline-flex min-h-11 max-w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm sm:px-4"
                      >
                        <Icon className="size-4 text-slate-500" />
                        <span className="truncate">{fact.label}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
              <AdminArt />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
              <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                <Megaphone className="size-5 text-blue-600" />
                Live Announcements
              </CardTitle>
              <button
                type="button"
                onClick={() => model.selectModule("announcements")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </CardHeader>
            <CardContent className="grid min-h-[188px] gap-4 px-5 pb-5 pt-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:px-6 sm:pb-6">
              {latestAnnouncement ? (
                <div className="flex min-w-0 flex-col justify-between">
                  <div key={announcementIdx} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    <Badge className={audienceBadgeClass}>
                      {latestAnnouncement.audience}
                    </Badge>
                    <h2 className="mt-5 line-clamp-2 text-base font-bold uppercase tracking-tight text-slate-950">
                      {latestAnnouncement.title}
                    </h2>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {latestAnnouncement.content}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-4" />
                        {latestAnnouncement.date}
                      </span>
                      {latestAnnouncement.createdBy ? (
                        <span className="inline-flex items-center gap-2">
                          <Users className="size-4" />
                          {latestAnnouncement.classSection || latestAnnouncement.classSections?.length ? latestAnnouncement.createdBy : "ADMIN"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {model.announcements.length > 1 ? (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      {Array.from({ length: model.announcements.length }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === announcementIdx % model.announcements.length
                              ? "w-5 bg-primary"
                              : "w-1.5 bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex min-h-[140px] items-center text-sm text-slate-500">
                  No announcements yet.
                </div>
              )}
              <AnnouncementArt />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminStats.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
                <CardContent className="grid min-h-[156px] grid-cols-[minmax(0,1fr)_auto] gap-4 p-5">
                  <div className="min-w-0">
                    <div className={cn("mb-5 flex size-10 items-center justify-center rounded-lg", item.iconClass)}>
                      <Icon className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                    <p className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.helper}</p>
                  </div>
                  <div className="flex items-end">
                    <MiniSparkline tone={item.tone} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)_minmax(280px,0.8fr)]">
          <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users className="size-4" />
                </span>
                Academic Overview
              </CardTitle>
              <p className="pt-1 text-sm text-slate-500">Real-time insight into institutional activity, platform usage, and academic operations.</p>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-5 sm:px-6 sm:pb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Portal Performance</h3>
                <div className="mt-5 grid gap-5 sm:grid-cols-4">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.label}>
                      <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-600">{metric.trend}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 min-h-[230px] rounded-lg border border-slate-200 bg-white p-4">
                  <svg viewBox="0 0 680 220" className="h-full min-h-[210px] w-full" aria-label="Portal performance line chart">
                    <defs>
                      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3, 4].map((line) => (
                      <line key={`h-${line}`} x1="0" x2="680" y1={line * 42 + 24} y2={line * 42 + 24} stroke="#e2e8f0" />
                    ))}
                    <path
                      d={(() => {
                        const pts = analyticsData.map((item, i) => {
                          const x = 18 + i * (644 / Math.max(1, analyticsData.length - 1))
                          const y = 194 - (item.value / analyticsMax) * 160
                          return { x, y }
                        })
                        if (pts.length < 2) return ""
                        return `M${pts.map((point) => `${point.x},${point.y}`).join(" L")}`
                      })()}
                      fill="none"
                      stroke="#2563eb"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                    <path
                      d={(() => {
                        const pts = analyticsData.map((item, i) => {
                          const x = 18 + i * (644 / Math.max(1, analyticsData.length - 1))
                          const y = 194 - (item.value / analyticsMax) * 160
                          return { x, y }
                        })
                        if (pts.length < 2) return ""
                        return `M${pts.map((point) => `${point.x},${point.y}`).join(" L")} L${pts[pts.length - 1].x},220 L${pts[0].x},220 Z`
                      })()}
                      fill="url(#chartFill)"
                    />
                    {analyticsData.map((item, index) => {
                      const x = 18 + index * (644 / Math.max(1, analyticsData.length - 1))
                      return (
                        <g key={item.label}>
                          <text x={x} y="214" textAnchor="middle" className="fill-slate-600 text-[11px] font-semibold">
                            {item.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-3 px-5 pb-0 pt-5">
              <CardTitle className="text-base font-semibold text-slate-950">Recent Activity</CardTitle>
              <button type="button" onClick={() => model.selectModule("audit")} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View all
              </button>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {recentActivity.length ? recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <CalendarDays className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.time}</p>
                  </div>
                </div>
              )) : (
                <div className="flex min-h-[220px] items-center justify-center text-sm text-slate-500">
                  No recent activity yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
            <div className="absolute -right-16 top-8 size-48 rounded-[38%_62%_49%_51%] bg-violet-200/70" />
            <div className="absolute -right-9 top-14 size-40 rounded-[64%_36%_40%_60%] bg-purple-400/55" />
            <CardHeader className="relative px-6 pb-0 pt-6">
              <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
                <Quote className="size-4 fill-violet-600 text-violet-600 dark:fill-violet-300 dark:text-violet-300" />
                Motivation Corner
              </CardTitle>
            </CardHeader>
            <CardContent className="relative px-6 pb-6 pt-10">
              <blockquote className="max-w-sm text-sm font-medium leading-7 text-slate-800 dark:text-foreground/85">
                &quot;The beautiful thing about learning is nobody can take it away from you.&quot;
              </blockquote>
              <p className="mt-5 text-sm font-semibold text-slate-700 dark:text-muted-foreground">- B.B. King</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (model.role !== "student") return null

  const user = model.users.find((item) => item.id === model.profile.id)
  const displayGwa = model.currentSemesterGwa !== null
    ? model.currentSemesterGwa.toFixed(2)
    : model.currentSemesterGwaPending
      ? "Pending"
      : model.gradeAverage

  const activeSubjectCount = new Set(model.visibleSchedules.map((item) => item.subject)).size
  const unitsTaken = model.currentSemesterTotalUnits || model.totalCompletedUnits || 0
  const progress = model.totalCurriculumUnits > 0
    ? Math.min(100, Math.round((model.totalCompletedUnits / model.totalCurriculumUnits) * 100))
    : 0
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const todaySchedules = model.visibleSchedules.filter((item) => item.day === today)
  const studentAnnouncements = model.filteredAnnouncements.length ? model.filteredAnnouncements : model.announcements
  const latestAnnouncement = studentAnnouncements[announcementIdx % Math.max(1, studentAnnouncements.length)]

  const facts = [
    { label: user?.currentYearLevel ?? model.profileCurrentYearLevel ?? "Year Level", icon: GraduationCap },
    { label: model.profileSection || user?.section || "Section", icon: Users },
    { label: `ID: ${model.profile.id || "N/A"}`, icon: ClipboardList },
  ]

  const stats = [
    {
      label: "Current GWA",
      value: displayGwa,
      helper: "General weighted average",
      icon: BarChart3,
      tone: "purple" as const,
      iconClass: pastelIconClass("violet"),
    },
    {
      label: "Enrolled Subjects",
      value: String(activeSubjectCount),
      helper: "This semester",
      icon: BookOpen,
      tone: "blue" as const,
      iconClass: pastelIconClass("blue"),
    },
    {
      label: "Units Taken",
      value: String(unitsTaken),
      helper: "This semester",
      icon: MessageSquare,
      tone: "orange" as const,
      iconClass: pastelIconClass("orange"),
    },
    {
      label: "Academic Progress",
      value: `${progress}%`,
      helper: "Curriculum completed",
      icon: Target,
      tone: "green" as const,
      iconClass: pastelIconClass("emerald"),
    },
  ]

  const quickActions = [
    { label: "Grades Registry", module: "grade-history" as ModuleId, icon: BarChart3, className: pastelIconClass("violet") },
    { label: "Thesis Library", module: "thesis" as ModuleId, icon: BookOpen, className: pastelIconClass("emerald") },
    { label: "Curriculum", module: "curriculum" as ModuleId, icon: GraduationCap, className: pastelIconClass("orange") },
    { label: "Instructor Info", module: "instructors" as ModuleId, icon: Users, className: pastelIconClass("blue") },
    { label: "Quick Links", module: "quick-links" as ModuleId, icon: LinkIcon, className: pastelIconClass("purple") },
  ]

  return (
    <div className="space-y-4 pb-4 pt-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
          <CardContent className="grid min-h-[252px] gap-5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="flex min-w-0 flex-col justify-center">
              <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md border border-border bg-background px-4 text-xs font-semibold text-blue-600 shadow-sm">
                <CalendarDays className="size-4" />
                {formatDate()}
              </span>
              <h1 className="mt-7 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                {greeting()}, {firstName(model.profile.name)}!
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Welcome to ComScite. Stay on top of your classes, deadlines, and campus updates.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 sm:mt-9">
                {facts.map((fact) => {
                  const Icon = fact.icon
                  return (
                    <span
                      key={fact.label}
                      className="inline-flex min-h-11 max-w-full items-center gap-3 rounded-md border border-border bg-card px-3 text-xs font-semibold text-muted-foreground shadow-sm sm:px-4"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="truncate">{fact.label}</span>
                    </span>
                  )
                })}
              </div>
            </div>
            <HeroArt />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
              <Megaphone className="size-5 text-blue-600" />
               Live Announcements
            </CardTitle>
            <button
              type="button"
              onClick={() => model.selectModule("announcements")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="grid min-h-[188px] gap-4 px-5 pb-5 pt-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:px-6 sm:pb-6">
            {latestAnnouncement ? (
              <div className="flex min-w-0 flex-col justify-between">
                <div key={announcementIdx} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                  <Badge className={audienceBadgeClass}>
                    {latestAnnouncement.audience}
                  </Badge>
                  <h2 className="mt-5 line-clamp-2 text-base font-bold uppercase tracking-tight text-foreground">
                    {latestAnnouncement.title}
                  </h2>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {latestAnnouncement.content}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="size-4" />
                      {latestAnnouncement.date}
                    </span>
                    {latestAnnouncement.createdBy ? (
                      <span className="inline-flex items-center gap-2">
                        <Users className="size-4" />
                        {latestAnnouncement.classSection || latestAnnouncement.classSections?.length ? latestAnnouncement.createdBy : "ADMIN"}
                      </span>
                    ) : null}
                  </div>
                </div>
                {studentAnnouncements.length > 1 ? (
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    {Array.from({ length: studentAnnouncements.length }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === announcementIdx % studentAnnouncements.length
                            ? "w-5 bg-primary"
                            : "w-1.5 bg-muted"
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
              ) : (
                <div className="flex min-h-[140px] items-center text-sm text-muted-foreground">
                  No announcements yet.
                </div>
              )}
              <AnnouncementArt />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
              <CardContent className="grid min-h-[156px] grid-cols-[minmax(0,1fr)_auto] gap-4 p-5">
                <div className="min-w-0">
                  <div className={cn("mb-5 flex size-10 items-center justify-center rounded-lg", item.iconClass)}>
                    <Icon className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
                  <p className="mt-8 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
                </div>
                <div className="flex items-end">
                  <MiniSparkline tone={item.tone} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DeansListRankingsCard
        facultyView={false}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.95fr)_minmax(360px,1.1fr)_minmax(320px,1.15fr)]">
        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
              <CalendarDays className="size-5 text-primary" />
              Today&apos;s Schedule
            </CardTitle>
            <p className="pt-1 text-sm text-muted-foreground">{formatDate()}</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-6">
            {todaySchedules.length ? (
              <div className="space-y-3">
                {todaySchedules.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold text-foreground">{formatScheduleTime(item.time)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.room} - {item.instructor}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                <div className="relative mb-6 flex size-28 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
                  <CalendarDays className="size-12 text-blue-300 dark:text-blue-400/60" />
                  <span className="absolute bottom-4 right-3 flex size-12 items-center justify-center rounded-full border-4 border-white bg-violet-100 text-violet-500 dark:border-border dark:bg-violet-950/40 dark:text-violet-300">
                    <CalendarDays className="size-5" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground/80">No classes scheduled for today.</p>
                <p className="mt-2 text-sm text-muted-foreground">Enjoy your free time or review your lessons!</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-6 h-10 rounded-md border-border text-primary"
                  onClick={() => model.selectModule("my-classes")}
                >
                  View My Class Schedule
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card shadow-sm">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="text-base font-semibold text-foreground">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[250px] flex-wrap items-start gap-7 px-6 pb-6 pt-10">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.module}
                  type="button"
                  onClick={() => model.selectModule(action.module)}
                  className="group flex w-20 flex-col items-center gap-3 text-center"
                >
                  <span className={cn("flex size-11 items-center justify-center rounded-lg transition-transform group-hover:-translate-y-0.5", action.className)}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold leading-5 text-muted-foreground">{action.label}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-lg border-border bg-card shadow-sm">
          <div className="absolute -right-16 top-8 size-48 rounded-[38%_62%_49%_51%] bg-violet-200/70" />
          <div className="absolute -right-9 top-14 size-40 rounded-[64%_36%_40%_60%] bg-purple-400/55" />
          <CardHeader className="relative px-6 pb-0 pt-6">
            <CardTitle className="flex items-center gap-3 text-base font-semibold text-foreground">
              <Quote className={motivationQuoteIconClass} />
              Motivation Corner
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-6 pb-6 pt-10">
            <blockquote className="max-w-sm text-sm font-medium leading-7 text-slate-800 dark:text-foreground/85">
              &quot;The beautiful thing about learning is nobody can take it away from you.&quot;
            </blockquote>
            <p className="mt-5 text-sm font-semibold text-slate-700 dark:text-muted-foreground">- B.B. King</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
