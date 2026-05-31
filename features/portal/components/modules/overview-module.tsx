"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock,
  GraduationCap,
  MessageSquareWarning,
  Users,
} from "lucide-react"

import { roleProfiles } from "../../data/portal-data"
import { Metric, Panel, StatusBadge } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import type { PortalModuleProps } from "./types"

function GreetingSection({ name, role }: { name: string; role: string }) {
  const [greeting, setGreeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    else if (hour < 18) return "Good Afternoon"
    else return "Good Evening"
  })
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="rounded-xl border border-glacier bg-white p-6 dark:border-lapis dark:bg-abyss/50">
      <h2 className="text-2xl font-bold text-abyss dark:text-quartz">
        {greeting}, {name}!
      </h2>
      <p className="mt-1 text-slate-blue dark:text-glacier">
        Welcome to the ComSite Student Portal.
      </p>
      <div className="mt-3 flex items-center gap-4 text-sm text-slate-blue dark:text-glacier">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-4" />
          <span className="tabular-nums">{timeStr}</span>
        </div>
      </div>
    </div>
  )
}

export function OverviewModule({ model }: PortalModuleProps) {
  const {
    gradeAverage,
    role,
    roster,
    studentGrades,
    studentTickets,
    theses,
    tickets,
    userStats,
  } = model

  const profile = roleProfiles[role]

  if (role === "admin") {
    return (
      <div className="space-y-5">
        <GreetingSection name={profile.name} role={role} />
        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Students"
            value={String(userStats.students)}
            icon={GraduationCap}
            tone="sky"
          />
          <Metric
            label="Faculty"
            value={String(userStats.faculty)}
            icon={Users}
            tone="emerald"
          />
          <Metric
            label="Thesis Records"
            value={String(theses.length)}
            icon={BookMarked}
            tone="amber"
          />
          <Metric
            label="Open Tickets"
            value={String(tickets.filter((t) => t.status !== "Resolved").length)}
            icon={MessageSquareWarning}
            tone="rose"
          />
        </div>
        <AnnouncementsPanel model={model} />
      </div>
    )
  }

  if (role === "faculty") {
    return (
      <div className="space-y-5">
        <GreetingSection name={profile.name} role={role} />
        <div className="grid gap-4 md:grid-cols-2">
          <Metric
            label="Handled Classes"
            value="4"
            icon={ClipboardList}
            tone="sky"
          />
          <Metric
            label="Students Enrolled"
            value={String(roster.filter((student) => student.enrolled).length)}
            icon={Users}
            tone="emerald"
          />
        </div>
        <AnnouncementsPanel model={model} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <GreetingSection name={profile.name} role={role} />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric
          label="Current GWA"
          value={gradeAverage}
          icon={BookOpen}
          tone="emerald"
        />
        <Metric
          label="Enrolled Subjects"
          value={String(studentGrades.length)}
          icon={BookOpen}
          tone="sky"
        />
        <Metric
          label="Open Tickets"
          value={String(studentTickets.filter((t) => t.status !== "Resolved").length)}
          icon={MessageSquareWarning}
          tone="amber"
        />
      </div>
      <AnnouncementsPanel model={model} />
    </div>
  )
}
