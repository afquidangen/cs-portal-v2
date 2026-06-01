"use client"

import {
  BarChart3,
  BookOpen,
  ClipboardList,
  MessageSquareWarning,
  Presentation,
  Users,
} from "lucide-react"

import { calculateFinalGrade, gradeRemarks } from "../../lib/grades"
import { Metric, Panel, StatusBadge } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import { SchedulePanel } from "./schedule-panel"
import type { PortalModuleProps } from "./types"

export function OverviewModule({ model }: PortalModuleProps) {
  const {
    facultyClassSections,
    facultyClassStudents,
    gradeAverage,
    role,
    seminars,
    studentGrades,
    studentTickets,
  } = model

  if (role === "admin") {
    return <div className="hidden" />
  }

  if (role === "faculty") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Metric
            label="Handled Classes"
            value={String(facultyClassSections.length)}
            icon={ClipboardList}
            tone="sky"
          />
          <Metric
            label="Students Enrolled"
            value={String(
              facultyClassStudents.filter((student) => student.enrolled).length
            )}
            icon={Users}
            tone="emerald"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          value={String(
            studentTickets.filter((t) => t.status !== "Resolved").length
          )}
          icon={MessageSquareWarning}
          tone="amber"
        />
        <Metric
          label="Upcoming Events"
          value={String(
            seminars.filter((event) => event.status === "Active").length
          )}
          icon={Presentation}
          tone="rose"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SchedulePanel model={model} />

        <Panel title="Grade Notifications" eyebrow="Real-time updates">
          <div className="space-y-3">
            {studentGrades.slice(0, 3).map((grade) => (
              <div
                key={grade.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {grade.code} final grade posted
                  </p>
                  <StatusBadge value={gradeRemarks(calculateFinalGrade(grade))} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
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
