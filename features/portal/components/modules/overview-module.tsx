"use client"

import { calculateFinalGrade, gradeRemarks } from "../../lib/grades"
import { Panel, StatusBadge } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import type { PortalModuleProps } from "./types"

export function OverviewModule({ model }: PortalModuleProps) {
  const {
    role,
    studentGrades,
  } = model

  if (role === "admin" || role === "faculty") {
    return null
  }

  return (
    <div className="space-y-6">
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

      <AnnouncementsPanel model={model} />
    </div>
  )
}
