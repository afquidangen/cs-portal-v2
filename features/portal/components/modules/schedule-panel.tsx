"use client"

import { useMemo, useState } from "react"
import { CalendarDays, MapPinned } from "lucide-react"

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
      <div className="mb-5 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Weekly Schedule</h1>
        <p className="mt-2 text-sm text-slate-600">View class blocks, room assignments, and section schedules for the week.</p>
      </div>

      {role === "admin" ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
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
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          <CalendarDays className="mx-auto mb-3 size-10 text-slate-300" />
          No class schedules found.
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {timeSlots.map((slot, row) => (
              <div key={slot} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 pb-2 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-950">{formatScheduleTime(slot)}</p>
                </div>
                <div className="space-y-2">
                  {scheduleGrid[row].map((items, col) => {
                    if (items.length === 0) return null
                    return items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 border-l-blue-500 bg-blue-50/40 px-3 py-2.5">
                        <p className="text-sm font-semibold leading-snug text-slate-950">{item.subject}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {DAYS_LONG[col]} · {item.section} - {item.room}
                        </p>
                      </div>
                    ))
                  })}
                  {scheduleGrid[row].every((items) => items.length === 0) && (
                    <p className="text-center text-xs text-muted-foreground/40 py-2">No classes</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr className="border-b border-slate-200">
                  <th className="w-32 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">Time</th>
                  {DAYS_LONG.map((day) => (
                    <th key={day} className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {timeSlots.map((slot, row) => (
                  <tr key={slot} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-500">
                      {formatScheduleTime(slot)}
                    </td>
                    {scheduleGrid[row].map((items, col) => (
                      <td key={col} className="px-3 py-2.5 align-top">
                        {items.length === 0 ? (
                          <span className="block pt-2 text-center text-xs text-muted-foreground/20">&mdash;</span>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div key={item.id} className="rounded-lg border border-slate-200 border-l-blue-500 bg-blue-50/40 px-3 py-2.5">
                                <p className="text-sm font-semibold leading-snug text-slate-950">{item.subject}</p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                  {item.section} - {item.room}
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
        </>
      )}
    </Panel>
  )
}
