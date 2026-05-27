"use client"

import {
  BarChart3,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Inbox,
  MessageSquareWarning,
  Presentation,
  Users,
} from "lucide-react"

import { auditLogsSeed, roleProfiles } from "../../data/portal-data"
import { calculateFinalGrade, gradeRemarks } from "../../lib/grades"
import { Metric, Panel, StatusBadge } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import { FacultyAvailabilityPanel } from "./availability-module"
import { FacultyGradesPanel } from "./grades-module"
import { SchedulePanel } from "./schedule-panel"
import type { PortalModuleProps } from "./types"

export function OverviewModule({ model }: PortalModuleProps) {
  const {
    gradeAverage,
    role,
    roster,
    seminars,
    studentGrades,
    studentTickets,
    theses,
    tickets,
    userStats,
  } = model

  if (role === "admin") {
    return (
      <div className="space-y-5">
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

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Priority System Modules" eyebrow="PDF roadmap">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Real-time grade notification updates",
                "Online library for existing thesis",
                "Announcements and CS updates",
                "Instructor information and organizational chart",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-800">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent Audit Logs" eyebrow="Traceability">
            <div className="space-y-3">
              {auditLogsSeed.map((log) => (
                <div key={log.id} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    {log.action}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {log.actor} - {log.time}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  if (role === "faculty") {
    const assignedTickets = tickets.filter(
      (ticket) => ticket.assignedTo === roleProfiles.faculty.name
    )
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
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
          <Metric
            label="Pending Tickets"
            value={String(assignedTickets.length)}
            icon={Inbox}
            tone="amber"
          />
          <Metric
            label="Hosted Events"
            value={
              String(
                seminars.filter(
                  (event) => event.host === roleProfiles.faculty.name
                ).length
              )
            }
            icon={Presentation}
            tone="rose"
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <FacultyAvailabilityPanel model={model} />
          <SchedulePanel />
        </div>
        <FacultyGradesPanel model={model} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Current GWA"
          value={gradeAverage}
          icon={BarChart3}
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
        <Metric
          label="Upcoming Events"
          value={String(seminars.filter((event) => event.status === "Active").length)}
          icon={Presentation}
          tone="rose"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SchedulePanel />
        <Panel title="Grade Notifications" eyebrow="Real-time updates">
          <div className="space-y-3">
            {studentGrades.slice(0, 3).map((grade) => (
              <div
                key={grade.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {grade.code} final grade posted
                  </p>
                  <StatusBadge value={gradeRemarks(calculateFinalGrade(grade))} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {grade.subject} - {grade.updatedAt}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <AnnouncementsPanel model={model} />
    </div>
  )
}
