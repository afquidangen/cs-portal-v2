"use client"

import { useMemo } from "react"
import { BookOpen, CalendarDays, Clock, GraduationCap, Layers3 } from "lucide-react"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function MyClassesModule({ model }: PortalModuleProps) {
  const { visibleSchedules, profileSection } = model

  const section = profileSection

  const enrolledSchedules = useMemo(
    () => {
      if (!section) return []
      return visibleSchedules.filter((s) =>
        s.section.includes(section)
      )
    },
    [visibleSchedules, section]
  )

  const enrolledSubjectNames = useMemo(
    () => [...new Set(enrolledSchedules.map((s) => s.subject))],
    [enrolledSchedules]
  )

  const groupedByDay = useMemo(() => {
    const days = ["M", "T", "W", "Th", "F"]
    const grouped: Record<string, typeof enrolledSchedules> = {}
    for (const day of days) {
      grouped[day] = enrolledSchedules.filter((s) => s.day.split(/\s+/).includes(day))
    }
    return grouped
  }, [enrolledSchedules])

  const hasNoSection = !section
  const hasNoSchedules = enrolledSchedules.length === 0

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <CalendarDays className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Clock className="size-4" />
              Weekly Class Planner
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              My Schedule
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              View your enrolled subjects, class times, instructors, and room assignments in one organized schedule.
            </p>
          </div>
        </div>
      </section>

      {hasNoSection ? (
        /* ── No section assigned ── */
        <Panel title="Classes" eyebrow="Weekly schedule">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-base font-medium text-foreground">No section assigned yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your class schedule will appear here once the admin assigns your section and adds classes.
            </p>
          </div>
        </Panel>
      ) : hasNoSchedules ? (
        /* ── Section assigned but no schedules ── */
        <Panel title="Classes" eyebrow={`${section} \u2022 No schedules yet`}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-base font-medium text-foreground">No classes scheduled yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The admin hasn&apos;t added any classes for {section}. Check back later.
            </p>
          </div>
        </Panel>
      ) : (
        <>
          {/* Info Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">My Section</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{section}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Layers3 className="size-5" />
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enrolled Subjects</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{enrolledSubjectNames.length}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <BookOpen className="size-5" />
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Weekly Classes</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{enrolledSchedules.length}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <CalendarDays className="size-5" />
                </span>
              </div>
            </div>
          </div>

          {/* Enrolled Subjects Table */}
          <Panel
            title="My Enrolled Subjects"
            eyebrow={`${section} \u2022 ${enrolledSubjectNames.length} subjects`}
          >
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
          </Panel>

          {/* Weekly Schedule Grid */}
          <Panel
            title="Weekly Class Schedule"
            eyebrow="Day by day overview"
          >
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
                          <p className="text-xs text-foreground/60">{item.room} &bull; {item.instructor}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
