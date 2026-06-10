"use client"

import { useMemo, useState } from "react"

import { Panel, Select } from "../shared/dashboard-ui"
import { formatScheduleTime } from "@/components/ui/time-picker"
import type { PortalModuleProps } from "./types"

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

  return (
    <Panel title="Weekly Schedule" eyebrow="Classes">
      {role === "admin" ? (
        <div className="mb-4 flex flex-wrap gap-3">
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
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Day</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Time</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Room</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No class schedules found.
                </td>
              </tr>
            ) : (
              filteredSchedules.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{item.day}</td>
                  <td className="px-4 py-3 text-foreground/80">{formatScheduleTime(item.time)}</td>
                  <td className="px-4 py-3 text-foreground/80">{item.subject}</td>
                  <td className="px-4 py-3 text-foreground/80">{item.section}</td>
                  <td className="px-4 py-3 text-foreground/80">{item.room}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
