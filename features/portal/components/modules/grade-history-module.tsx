"use client"

import { useMemo, useState } from "react"
import { BookOpen, Pencil, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeHistoryEntry, GradeRecord } from "../../data/portal-data"

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
  const activeSemester = useMemo(
    () => (model.semesters as Array<{ semester: string; status: string }> | undefined)?.find((s) => s.status === "Active"),
    [model.semesters]
  )

  const history = useMemo(() => {
    const base = studentUser?.gradeHistory ? [...studentUser.gradeHistory] : []
    const releasedGrades = (model.allStudentGrades as GradeRecord[] | undefined)?.filter(
      (g) => g.finalGrade !== undefined && g.transmutedGrade !== undefined
    ) ?? []
    if (releasedGrades.length === 0) return base
    const curriculumId = studentUser?.curriculumId ?? ""
    const yearLevel = model.profileCurrentYearLevel ?? ""
    const semester = activeSemester?.semester ?? ""
    for (const grade of releasedGrades) {
      const existingIdx = base.findIndex((h) => h.subjectCode === grade.code)
      const entry: GradeHistoryEntry = {
        subjectCode: grade.code,
        subjectName: grade.subject,
        finalPercentile: grade.finalGrade!,
        transmutedGrade: grade.transmutedGrade!,
        remarks: grade.finalRemarks || grade.midtermRemarks || grade.remarks || "Passed",
        curriculumId,
        yearLevel,
        semester,
        section: grade.section,
      }
      if (existingIdx >= 0) {
        base[existingIdx] = { ...base[existingIdx], ...entry }
      } else {
        base.push(entry)
      }
    }
    return base
  }, [studentUser?.gradeHistory, model.allStudentGrades, activeSemester])

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

  const semesterGwas = useMemo(() => {
    const gwas = studentUser?.semesterGwas ?? []
    const map = new Map<string, number | null>()
    for (const g of gwas) {
      map.set(g.semester, g.gwa)
    }
    return map
  }, [studentUser?.semesterGwas])

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

  const [editingGwaSemester, setEditingGwaSemester] = useState<string | null>(null)
  const [editGwaValue, setEditGwaValue] = useState("")

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

          {grouped.map((group) => {
            const gwa = semesterGwas.get(group.semester)
            return (
              <div key={`${group.yearLevel}-${group.semester}`}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-6 w-1 rounded-full bg-primary/60" />
                  <p className="text-sm font-bold text-foreground">
                    {YEAR_MAP[group.yearLevel] ?? group.yearLevel} &mdash; {group.semester}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {group.entries.length} {group.entries.length === 1 ? "subject" : "subjects"}
                  </span>
                  {editingGwaSemester === group.semester ? (
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="1.00"
                        max="5.00"
                        value={editGwaValue}
                        onChange={(e) => setEditGwaValue(e.target.value)}
                        className="h-7 w-20 rounded-md border border-border bg-background px-2 text-xs font-mono tabular-nums outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => {
                          const parsed = parseFloat(editGwaValue)
                          const semRec = (model.semesters as Array<{ id: string; semester: string; schoolYearStart: number; schoolYearEnd: number }> | undefined)?.find((s) => s.semester === group.semester)
                          model.handleSaveGwa(
                            studentUser?.id ?? "",
                            semRec?.id ?? "",
                            group.semester,
                            semRec?.schoolYearStart ?? 0,
                            semRec?.schoolYearEnd ?? 0,
                            isNaN(parsed) ? null : parsed
                          )
                          setEditingGwaSemester(null)
                        }}
                        className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingGwaSemester(null)}
                        className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      {gwa !== undefined && gwa !== null ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                          <Trophy className="size-3" />
                          GWA: {gwa.toFixed(2)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-0.5 text-[10px] font-medium text-muted-foreground">
                          GWA: —
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingGwaSemester(group.semester)
                          setEditGwaValue(gwa !== undefined && gwa !== null ? gwa.toFixed(2) : "")
                        }}
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                        title="Set GWA"
                      >
                        <Pencil className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Subject Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Subject Title
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Final Grade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/80">
                          Remarks
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
                          <td className="px-4 py-3 text-center font-mono tabular-nums text-foreground">
                            {entry.transmutedGrade.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge value={entry.remarks} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
