"use client"

import { useMemo, useState } from "react"
import { Archive, BookOpen, CalendarDays, ChevronDown, ChevronRight, GraduationCap, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeRecord } from "../../data/portal-data"
import type { SemesterRecord } from "@/lib/types"

function getSemesterGrades(
  semester: SemesterRecord,
  grades: GradeRecord[],
  schedules: { section: string; subject: string; semesterId: string }[]
): GradeRecord[] {
  const direct = grades.filter((g) => g.semesterId === semester.id)
  if (direct.length > 0) return direct
  const pairs = new Set(
    schedules
      .filter((s) => s.semesterId === semester.id)
      .map((s) => `${s.section}|${s.subject}`)
  )
  return grades.filter((g) => pairs.has(`${g.section}|${g.subject}`))
}

function computeGWA(grades: GradeRecord[]): number | null {
  const tg = grades
    .filter((g) => g.transmutedGrade != null && g.transmutedGrade > 0)
    .map((g) => g.transmutedGrade!)
  if (tg.length === 0) return null
  return tg.reduce((a, b) => a + b, 0) / tg.length
}

export function SemesterHistoryModule({ model }: PortalModuleProps) {
  const { archivedSemesters, grades, classSchedules } = model
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const studentUser = model.users.find((u) => u.id === model.profile.id)
  const semesterGwas = useMemo(() => {
    const gwas = studentUser?.semesterGwas ?? []
    const map = new Map<string, number | null>()
    for (const g of gwas) {
      map.set(g.semester, g.gwa)
    }
    return map
  }, [studentUser?.semesterGwas])

  const semestersWithData = useMemo(() => {
    return archivedSemesters.map((sem) => {
      const semGrades = getSemesterGrades(sem, grades, classSchedules)
      const computedGwa = computeGWA(semGrades)
      const storedGwa = semesterGwas.get(sem.semester)
      const gwa = storedGwa !== undefined && storedGwa !== null ? storedGwa : computedGwa
      const completed = semGrades.filter((g) => g.remarks === "Passed").length
      return { semester: sem, grades: semGrades, gwa, completed }
    })
  }, [archivedSemesters, grades, classSchedules, semesterGwas])

  if (archivedSemesters.length === 0) {
    return (
      <Panel title="Semester History" className="[&>div:first-child]:hidden">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Archive className="size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold text-foreground">No Semester History</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Archived semesters will appear here once the admin marks a semester as done.
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Semester History" className="[&>div:first-child]:hidden">
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <GraduationCap className="size-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Academic Records</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground">Semester History</h3>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {semestersWithData.map(({ semester: sem, grades: semGrades, gwa, completed }) => {
            const isOpen = expandedId === sem.id
            return (
              <div
                key={sem.id}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : sem.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {sem.semester}, A.Y. {sem.schoolYearStart}-{sem.schoolYearEnd}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {semGrades.length} subject{grades.length !== 1 ? "s" : ""}
                        {completed > 0 ? ` · ${completed} passed` : ""}
                        {gwa !== null ? ` · GWA: ${gwa.toFixed(2)}` : ""}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown className="size-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    {semGrades.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        No grade records found for this semester.
                      </p>
                    ) : (
                      <>
                        {/* Grade Table */}
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-muted/40 text-muted-foreground">
                                <th className="px-3 py-2 font-semibold">Code</th>
                                <th className="px-3 py-2 font-semibold">Subject</th>
                                <th className="px-3 py-2 font-semibold text-right">Units</th>
                                <th className="px-3 py-2 font-semibold text-right">Grade</th>
                                <th className="px-3 py-2 font-semibold text-right">Transmuted</th>
                                <th className="px-3 py-2 font-semibold text-center">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {semGrades
                                .sort((a, b) => a.subject.localeCompare(b.subject))
                                .map((g) => (
                                  <tr key={g.id} className="hover:bg-muted/20">
                                    <td className="px-3 py-2 font-mono text-foreground">{g.code}</td>
                                    <td className="px-3 py-2 text-foreground">{g.subject}</td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">{g.units}</td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                                      {g.finalGrade ?? g.tentativeFinalGrade ?? "---"}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                                      {g.transmutedGrade ?? "---"}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={cn(
                                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                                        g.remarks === "Passed"
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                          : g.remarks === "Failed"
                                          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                          : "bg-muted text-muted-foreground"
                                      )}>
                                        {g.remarks ?? "---"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>

                        {/* GWA & Summary */}
                        <div className="flex flex-wrap items-center gap-4">
                          {gwa !== null && (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-2">
                              <Trophy className="size-4 text-amber-500" />
                              <span className="text-sm font-bold text-foreground">
                                GWA: {gwa.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-2">
                            <BookOpen className="size-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              <strong className="text-foreground">{completed}</strong> of <strong className="text-foreground">{semGrades.length}</strong> subjects completed
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
