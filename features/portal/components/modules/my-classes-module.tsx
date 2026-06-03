"use client"

import { useMemo } from "react"
import { CalendarDays, GraduationCap } from "lucide-react"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function MyClassesModule({ model }: PortalModuleProps) {
  const { visibleSchedules, profileSection, classSchedules, roster, subjects, profile, users } = model

  const enrolledStudent = useMemo(
    () => roster.find((s) => s.id === profile.id && s.enrolled),
    [roster, profile.id]
  )

  const studentUser = useMemo(
    () => users.find((u) => u.id === profile.id),
    [users, profile.id]
  )

  const enrolledSchedules = useMemo(
    () => visibleSchedules.filter((s) => {
      if (!profileSection) return true
      return s.section.includes(profileSection)
    }),
    [visibleSchedules, profileSection]
  )

  const enrolledSubjectNames = useMemo(
    () => [...new Set(enrolledSchedules.map((s) => s.subject))],
    [enrolledSchedules]
  )

  const groupedByDay = useMemo(() => {
    const days = ["M", "T", "W", "Th", "F"]
    const grouped: Record<string, typeof enrolledSchedules> = {}
    for (const day of days) {
      grouped[day] = enrolledSchedules.filter((s) => s.day === day)
    }
    return grouped
  }, [enrolledSchedules])

  const section = studentUser?.section ?? profileSection

  return (
    <div className="space-y-5">
      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">My Section</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{section || "Not assigned"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enrolled Subjects</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{enrolledSubjectNames.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Weekly Classes</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{enrolledSchedules.length}</p>
        </div>
      </div>

      {/* Enrolled Subjects */}
      <Panel
        title="My Enrolled Subjects"
        eyebrow={section ? `${section} \u2022 ${enrolledSubjectNames.length} subjects` : "No section assigned"}
      >
        {enrolledSubjectNames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {section ? "No class schedules found for your section." : "No section assigned. Contact your instructor."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Instructor</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Schedule</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {enrolledSchedules.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{item.subject}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.instructor}</td>
                    <td className="px-4 py-3 text-foreground/80">{item.day}, {item.time}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">{item.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Weekly Schedule */}
      <Panel
        title="Weekly Class Schedule"
        eyebrow="Day by day overview"
      >
        {Object.keys(groupedByDay).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No classes scheduled for this week.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Object.entries(groupedByDay).map(([day, classes]) => (
              <div key={day} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{day}</h4>
                  <StatusBadge value={`${classes.length}`} />
                </div>
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {classes.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border bg-muted/30 p-2.5 text-sm">
                        <p className="font-medium text-foreground">{item.subject}</p>
                        <p className="text-xs text-foreground/70">{item.time}</p>
                        <p className="text-xs text-foreground/60">{item.room} \u2022 {item.instructor}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
