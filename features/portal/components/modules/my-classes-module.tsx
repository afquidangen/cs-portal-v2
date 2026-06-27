"use client"

import { useMemo, useState } from "react"
import { BookOpen, CalendarDays, GraduationCap, Layers3, UserRound } from "lucide-react"

import { Panel, Select } from "../shared/dashboard-ui"
import { formatScheduleTime } from "@/components/ui/time-picker"
import type { PortalModuleProps } from "./types"

export function MyClassesModule({ model }: PortalModuleProps) {
  const { visibleSchedules, profileSection } = model

  const section = profileSection

  const enrolledSchedules = visibleSchedules

  const enrolledSubjectNames = useMemo(
    () => [...new Set(enrolledSchedules.map((s) => s.subject))],
    [enrolledSchedules]
  )

  const [instructorFilter, setInstructorFilter] = useState("All")

  const instructorOptions = useMemo(() => {
    const names = [...new Set(enrolledSchedules.map((s) => s.instructor))].sort()
    return ["All", ...names]
  }, [enrolledSchedules])

  const timetableSchedules = useMemo(() => {
    if (instructorFilter === "All") return enrolledSchedules
    return enrolledSchedules.filter((s) => s.instructor === instructorFilter)
  }, [enrolledSchedules, instructorFilter])

  const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const DAYS_SHORT = ["M", "T", "W", "Th", "F"]

  function parseTimeToMinutes(timeStr: string): number {
    const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!m) return 0
    let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase()
    if (p === "PM" && h !== 12) h += 12
    if (p === "AM" && h === 12) h = 0
    return h * 60 + min
  }

  function getStartTime(range: string): string { return range.split(" - ")[0]?.trim() ?? "" }

  const DAY_INDEX: Record<string, number> = { M: 0, T: 1, W: 2, Th: 3, F: 4 }

  const timeSlots = useMemo(() => {
    const set = new Set<string>()
    timetableSchedules.forEach((s) => set.add(s.time))
    return Array.from(set).sort((a, b) => {
      const [hA, mA] = getStartTime(a).split(":").map(Number)
      const [hB, mB] = getStartTime(b).split(":").map(Number)
      return (hA * 60 + mA) - (hB * 60 + mB)
    })
  }, [timetableSchedules])

  const scheduleGrid = useMemo(() => {
    const grid: (typeof timetableSchedules)[][] = timeSlots.map(() => DAYS_SHORT.map(() => [] as typeof timetableSchedules))
    const timeIndex = new Map(timeSlots.map((t, i) => [t, i]))
    for (const s of timetableSchedules) {
      const row = timeIndex.get(s.time)
      if (row === undefined) continue
      for (const d of s.day.split(/\s+/)) {
        const col = DAY_INDEX[d]
        if (col !== undefined) grid[row][col].push(s)
      }
    }
    return grid
  }, [timetableSchedules, timeSlots])

  const hasNoSection = !section && visibleSchedules.length === 0
  const hasNoSchedules = !hasNoSection && visibleSchedules.length === 0

  return (
    <div className="space-y-4 pb-6 pt-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">My Classes</h1>
        <p className="mt-2 text-sm text-slate-600">View your enrolled subjects and weekly class timetable.</p>
      </div>

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
        <Panel title="Classes" eyebrow={`${section} · No schedules yet`}>
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
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">My Section</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{section}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Layers3 className="size-5" />
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Enrolled Subjects</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{enrolledSubjectNames.length}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <BookOpen className="size-5" />
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Weekly Classes</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{enrolledSchedules.length}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <CalendarDays className="size-5" />
                </span>
              </div>
            </div>
          </div>

          {/* Enrolled Subjects Table */}
          <Panel
            title="My Enrolled Subjects"
            eyebrow={`${section} · ${enrolledSubjectNames.length} subjects`}
          >
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Instructor</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Schedule</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Room</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {enrolledSchedules.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{item.subject}</td>
                      <td className="px-4 py-3 text-foreground/80">{item.instructor}</td>
                      <td className="px-4 py-3 text-foreground/80">{item.day}, {formatScheduleTime(item.time)}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">{item.room}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">{item.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Weekly Schedule Timetable */}
          <Panel
            title="Weekly Class Schedule"
            eyebrow="Timetable view"
          >
            {instructorOptions.length > 1 ? (
              <div className="mb-4 w-56">
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <Select
                    value={instructorFilter}
                    onChange={setInstructorFilter}
                    options={instructorOptions}
                  />
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="w-32 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Time</th>
                    {DAYS_LONG.map((day) => (
                      <th key={day} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {timeSlots.map((slot, row) => (
                    <tr key={slot} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-muted-foreground">{formatScheduleTime(slot)}</td>
                      {scheduleGrid[row].map((items, col) => (
                        <td key={col} className="px-3 py-2.5 align-top">
                          {items.length === 0 ? (
                            <span className="block pt-2 text-center text-xs text-muted-foreground/20">&mdash;</span>
                          ) : (
                            <div className="space-y-2">
                              {items.map((item) => (
                                <div key={item.id} className="rounded-lg border border-slate-200 border-l-blue-500 bg-blue-50/40 px-3 py-2.5">
                                  <p className="text-sm font-semibold leading-snug text-slate-950">{item.subject}</p>
                                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.room} - {item.instructor}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
