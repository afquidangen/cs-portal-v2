"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Clock, MapPinned } from "lucide-react"

import { Panel, Select } from "../shared/dashboard-ui"
import { formatScheduleTime } from "@/components/ui/time-picker"
import type { PortalModuleProps } from "./types"

const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const DAYS_SHORT = ["M", "T", "W", "Th", "F"]
const DAY_INDEX: Record<string, number> = { M: 0, T: 1, W: 2, Th: 3, F: 4 }

function parseTimeToMinutes(timeStr: string): number {
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return 0
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase()
  if (p === "PM" && h !== 12) h += 12
  if (p === "AM" && h === 12) h = 0
  return h * 60 + min
}

function getStartTime(range: string): string { return range.split(" - ")[0]?.trim() ?? "" }

export function SchedulePanel({ model }: PortalModuleProps) {
  const {
    role,
    classSchedules,
    yearSections,
    visibleSchedules,
  } = model

  const [yearFilter, setYearFilter] = useState("All")
  const [sectionFilter, setSectionFilter] = useState("All")

  const yearOptions = useMemo(
    () => ["All", ...yearSections.map((y) => y.year)],
    [yearSections]
  )

  const sectionOptions = useMemo(() => {
    if (yearFilter === "All") return ["All", ...yearSections.flatMap((y) => y.sections)]
    const found = yearSections.find((y) => y.year === yearFilter)
    return ["All", ...(found?.sections ?? [])]
  }, [yearFilter, yearSections])

  const filteredSchedules = useMemo(() => {
    if (role !== "admin" || (yearFilter === "All" && sectionFilter === "All")) {
      return visibleSchedules
    }
    return classSchedules.filter((s) => {
      const matchesSection =
        sectionFilter === "All" || s.section === sectionFilter
      return matchesSection
    })
  }, [classSchedules, visibleSchedules, role, yearFilter, sectionFilter])

  const timeSlots = useMemo(() => {
    const set = new Set<string>()
    filteredSchedules.forEach((s) => set.add(getStartTime(s.time)))
    return Array.from(set).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b))
  }, [filteredSchedules])

  const scheduleGrid = useMemo(() => {
    const grid: (typeof filteredSchedules)[][] = timeSlots.map(() => DAYS_SHORT.map(() => [] as typeof filteredSchedules))
    const timeIndex = new Map(timeSlots.map((t, i) => [t, i]))
    for (const s of filteredSchedules) {
      const row = timeIndex.get(getStartTime(s.time))
      if (row === undefined) continue
      for (const d of s.day.split(/\s+/)) {
        const col = DAY_INDEX[d]
        if (col !== undefined) grid[row][col].push(s)
      }
    }
    return grid
  }, [filteredSchedules, timeSlots])

  return (
    <Panel title="Weekly Schedule" className="[&>div:first-child]:hidden">
      <div className="mb-5 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-center shadow-sm sm:px-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <CalendarDays className="size-8" />
        </div>
        <p className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <Clock className="size-4" />
          Classes and Room Assignments
        </p>
        <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
          Weekly Schedule
        </h3>
      </div>

      {role === "admin" ? (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPinned className="size-4" />
            Schedule Filters
          </p>
        <div className="flex flex-wrap gap-3">
          <div className="w-44">
            <Select
              label="Year"
              value={yearFilter}
              onChange={(v) => {
                setYearFilter(v)
                setSectionFilter("All")
              }}
              options={yearOptions}
            />
          </div>
          <div className="w-44">
            <Select
              label="Section"
              value={sectionFilter}
              onChange={setSectionFilter}
              options={sectionOptions}
            />
          </div>
        </div>
        </div>
      ) : null}

      {filteredSchedules.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          No class schedules found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
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
                <tr key={slot} className="transition-colors hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-muted-foreground">
                    {formatScheduleTime(slot)}
                  </td>
                  {scheduleGrid[row].map((items, col) => (
                    <td key={col} className="px-3 py-2.5 align-top">
                      {items.length === 0 ? (
                        <span className="block pt-2 text-center text-xs text-muted-foreground/20">&mdash;</span>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="rounded-lg border-l-[3px] border-l-primary/40 border border-border/60 bg-muted/20 px-3 py-2.5">
                              <p className="text-sm font-semibold leading-snug text-foreground">{item.subject}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground/75">
                                {item.section} &bull; {item.room}
                              </p>
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
      )}
    </Panel>
  )
}
