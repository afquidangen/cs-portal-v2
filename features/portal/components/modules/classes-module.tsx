"use client"

import { scheduleSeed } from "../../data/portal-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function ClassesModule({ model }: PortalModuleProps) {
  const {
    handleAddClassSection,
    newSectionName,
    role,
    roster,
    selectedClassYear,
    setNewSectionName,
    setRoster,
    setSelectedClassYear,
    yearSections,
  } = model

  if (role === "faculty") {
    return (
      <Panel title="Manage Class" eyebrow="Checklist enrollment">
        <div className="space-y-3">
          {roster.map((student) => (
            <label
              key={student.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
            >
              <div>
                <p className="font-medium text-foreground">{student.name}</p>
                <p className="text-sm text-foreground/70">
                  {student.id} - {student.section}
                </p>
              </div>

              <input
                type="checkbox"
                checked={student.enrolled}
                onChange={(event) =>
                  setRoster((current) =>
                    current.map((item) =>
                      item.id === student.id
                        ? { ...item, enrolled: event.target.checked }
                        : item
                    )
                  )
                }
                className="size-5 rounded-md border border-border bg-background accent-primary"
              />
            </label>
          ))}
        </div>
      </Panel>
    )
  }

  const selectedYear = yearSections.find((item) => item.year === selectedClassYear)

  return (
    <div className="space-y-5">
      <Panel title="Year Sections" eyebrow="Click a year to view sections">
        <div className="flex flex-wrap gap-2">
          {yearSections.map((item) => (
            <Button
              key={item.year}
              type="button"
              variant={selectedClassYear === item.year ? "default" : "outline"}
              onClick={() => setSelectedClassYear(item.year)}
              className="rounded-xl"
            >
              {item.year}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedYear?.sections.map((section) => (
            <StatusBadge key={section} value={section} />
          ))}
        </div>

        <form
          onSubmit={handleAddClassSection}
          className="mt-4 flex max-w-md gap-2"
        >
          <Input
            value={newSectionName}
            onChange={(event) => setNewSectionName(event.target.value)}
            placeholder="Add section, e.g. BSCS 1E"
            className="h-10 rounded-2xl"
          />
          <Button type="submit" className="rounded-2xl">
            Add
          </Button>
        </form>
      </Panel>

      <Panel title="Class Schedule Upload" eyebrow="Manual or Excel .xlsx">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input type="file" accept=".xlsx" className="h-10 rounded-2xl" />
          <Button type="button" variant="outline" className="rounded-2xl">
            Upload Schedule
          </Button>
        </div>
      </Panel>

      <Panel title="Encoded Schedules" eyebrow="Schedules and sections">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Section
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Subject
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Instructor
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Schedule
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Room
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-card">
              {scheduleSeed.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.section}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.subject}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.instructor}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.day}, {item.time}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.room}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}