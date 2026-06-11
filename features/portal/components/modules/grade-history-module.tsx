"use client"

import { useMemo } from "react"
import { BookOpen } from "lucide-react"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeHistoryEntry } from "../../data/portal-data"

const YEAR_ORDER: Record<string, number> = {
  "1st Year": 1, "First Year": 1,
  "2nd Year": 2, "Second Year": 2,
  "3rd Year": 3, "Third Year": 3,
  "4th Year": 4, "Fourth Year": 4,
}

const YEAR_MAP: Record<string, string> = {
  "1st Year": "FIRST YEAR",
  "2nd Year": "SECOND YEAR",
  "3rd Year": "THIRD YEAR",
  "4th Year": "FOURTH YEAR",
  "First Year": "FIRST YEAR",
  "Second Year": "SECOND YEAR",
  "Third Year": "THIRD YEAR",
  "Fourth Year": "FOURTH YEAR",
}

const semesterOrder: Record<string, number> = {
  "First Semester": 1,
  "Midyear": 2,
  "Second Semester": 3,
}

function sortYearLevel(a: string, b: string) {
  return (YEAR_ORDER[a] ?? 0) - (YEAR_ORDER[b] ?? 0)
}

function sortSemester(a: string, b: string) {
  return (semesterOrder[a] ?? 99) - (semesterOrder[b] ?? 99)
}

export function GradeHistoryModule({ model }: PortalModuleProps) {
  const studentUser = model.users.find((u) => u.id === model.profile.id)
  const history = useMemo(() => studentUser?.gradeHistory ?? [], [studentUser?.gradeHistory])

  const grouped = useMemo(() => {
    const map = new Map<string, GradeHistoryEntry[]>()
    for (const entry of history) {
      const key = `${entry.yearLevel}\x00${entry.semester}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    return [...map.entries()]
      .map(([key, entries]) => {
        const [yearLevel, semester] = key.split("\x00")
        return { yearLevel, semester, entries }
      })
      .sort((a, b) => {
        const y = sortYearLevel(b.yearLevel, a.yearLevel)
        if (y !== 0) return y
        return sortSemester(b.semester, a.semester)
      })
  }, [history])

  const totalUnits = useMemo(() => {
    return history.reduce((sum, entry) => {
      if (entry.units !== undefined) return sum + entry.units
      const curriculum = model.curricula.find((c) => c.id === entry.curriculumId)
      if (curriculum) {
        for (const term of curriculum.terms) {
          const subject = term.subjects.find((s) => s.code === entry.subjectCode)
          if (subject) return sum + subject.total
        }
      }
      return sum + 3
    }, 0)
  }, [history, model.curricula])

  return (
    <Panel title="Grades Registry" eyebrow="Grades Registry">
      {grouped.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-border bg-muted/30 px-6 py-14 text-center shadow-sm">
          <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm leading-7 text-muted-foreground">
            No grade history records yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Units Done
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {totalUnits}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Terms
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {grouped.length}
              </p>
            </div>
          </div>

          {grouped.map((group) => (
            <div key={`${group.yearLevel}-${group.semester}`}>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-primary/60" />
                <p className="text-sm font-bold text-foreground">
                  {YEAR_MAP[group.yearLevel] ?? group.yearLevel} &mdash; {group.semester}
                </p>
                <span className="text-xs text-muted-foreground">
                  {group.entries.length} {group.entries.length === 1 ? "subject" : "subjects"}
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Final %
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Trans. Grade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Remarks
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {group.entries.map((entry, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {entry.subjectCode}
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {entry.subjectName}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {entry.finalPercentile}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {entry.transmutedGrade.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={entry.remarks} />
                        </td>
                        <td className="px-4 py-3 text-foreground/60 text-xs">
                          {entry.section ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
