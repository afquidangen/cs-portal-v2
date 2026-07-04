"use client"

import { useEffect, useMemo, useState } from "react"
import { Archive, Award, CalendarDays, ChevronDown, ChevronRight, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeRecord } from "../../data/portal-data"
import type { SemesterRecord } from "@/lib/types"

function getSemesterGrades(
  semester: SemesterRecord,
  grades: GradeRecord[],
  schedules: { section: string; subject: string; semesterId: string }[],
  studentId: string
): GradeRecord[] {
  const direct = grades.filter(
    (g) => g.studentId === studentId && g.semesterId === semester.id
  )
  if (direct.length > 0) {
    const seen = new Map<string, GradeRecord>()
    for (const g of direct) {
      const existing = seen.get(g.code)
      if (!existing) {
        seen.set(g.code, g)
      } else if (
        (g.finalGrade != null && existing.finalGrade == null) ||
        (g.transmutedGrade != null && existing.transmutedGrade == null)
      ) {
        seen.set(g.code, g)
      }
    }
    return [...seen.values()]
  }
  const pairs = new Set(
    schedules
      .filter((s) => s.semesterId === semester.id)
      .map((s) => `${s.section}|${s.subject}`)
  )
  const seen = new Set<string>()
  return grades.filter((g) => {
    if (g.studentId !== studentId) return false
    if (!pairs.has(`${g.section}|${g.subject}`)) return false
    if (seen.has(g.code)) return false
    seen.add(g.code)
    return true
  })
}

function getRemarks(g: GradeRecord): string {
  const fr = g.finalRemarks || g.remarks
  const mr = g.midtermRemarks
  const frLower = fr?.toLowerCase()
  const mrLower = mr?.toLowerCase()

  // Only "Passed" if both periods explicitly passed
  if (fr && mr && frLower === "passed" && mrLower === "passed") return "Passed"
  // Midterm non-passing — surface it
  if (mr && mrLower !== "passed") return mr
  // Final non-passing — surface it
  if (fr && frLower !== "passed") return fr
  // Final "Passed" with no midterm data — return as-is
  if (fr) return fr

  if (g.transmutedGrade != null && g.transmutedGrade > 0) {
    return g.transmutedGrade <= 3.0 ? "Passed" : "Failed"
  }
  if (g.finalGrade != null && g.finalGrade > 0) {
    return g.finalGrade >= 75 ? "Passed" : "Failed"
  }
  return "---"
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
  const [dlBySemester, setDlBySemester] = useState<
    Record<string, { isQualified: boolean; rank: number | null } | null>
  >({})

  useEffect(() => {
    const semesterIds = archivedSemesters.map((s) => s.id)
    if (semesterIds.length === 0) return

    let cancelled = false
    Promise.all(
      semesterIds.map(async (semId) => {
        try {
          const res = await fetch(`/api/portal/deans-list/student?semesterId=${semId}`)
          if (!res.ok) return { semId, data: null }
          const json = await res.json()
          return { semId, data: json?.data ?? null }
        } catch {
          return { semId, data: null }
        }
      })
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, { isQualified: boolean; rank: number | null } | null> = {}
      for (const r of results) {
        map[r.semId] = r.data
      }
      setDlBySemester(map)
    })
    return () => { cancelled = true }
  }, [archivedSemesters])

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
      const semGrades = getSemesterGrades(sem, grades, classSchedules, model.profile.id)
      const computedGwa = computeGWA(semGrades)
      const storedGwa = semesterGwas.get(sem.semester)
      const gwa = storedGwa !== undefined && storedGwa !== null ? storedGwa : computedGwa
      const completed = semGrades.filter((g) => getRemarks(g) === "Passed").length
      return { semester: sem, grades: semGrades, gwa, completed }
    })
  }, [archivedSemesters, grades, classSchedules, semesterGwas])

  if (archivedSemesters.length === 0) {
    return (
      <Panel title="Semester History" className="[&>div:first-child]:hidden">
        <div className="mb-5 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Semester History</h1>
          <p className="mt-2 text-sm text-slate-600">Review archived academic terms and released grade records.</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-20 text-center">
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
      <div className="space-y-4">
        <div className="pt-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Semester History</h1>
          <p className="mt-2 text-sm text-slate-600">Review archived academic terms and released grade records.</p>
        </div>

        <div className="space-y-3">
          {semestersWithData.map(({ semester: sem, grades: semGrades, gwa, completed }) => {
            const isOpen = expandedId === sem.id
            return (
              <div
                key={sem.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : sem.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <CalendarDays className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        {sem.semester}, A.Y. {sem.schoolYearStart}-{sem.schoolYearEnd}
                      </p>
                      <p className="text-xs text-slate-500">
                        {semGrades.length} subject{semGrades.length !== 1 ? "s" : ""}
                        {completed > 0 ? ` · ${completed} passed` : ""}
                        {gwa !== null ? ` · GWA: ${gwa.toFixed(2)}` : ""}
                        {dlBySemester[sem.id]?.isQualified ? " · Dean's Lister" : ""}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown className="size-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-slate-200 px-4 pb-4 pt-3">
                    {semGrades.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        No grade records found for this semester.
                      </p>
                    ) : (
                      <>
                        {/* Grade Table */}
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600">
                                <th className="px-3 py-2 font-semibold">Code</th>
                                <th className="px-3 py-2 font-semibold">Subject</th>
                                <th className="px-3 py-2 font-semibold text-right">Units</th>
                                <th className="px-3 py-2 font-semibold text-right">Grade</th>
                                <th className="px-3 py-2 font-semibold text-right">Transmuted</th>
                                <th className="px-3 py-2 font-semibold text-center">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {semGrades
                                .sort((a, b) => a.subject.localeCompare(b.subject))
                                .map((g) => (
                                  <tr key={g.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-mono text-foreground">{g.code}</td>
                                    <td className="px-3 py-2 text-foreground">{g.subject}</td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">{g.units}</td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                                      {g.finalGrade != null ? g.finalGrade.toFixed(2) : g.tentativeFinalGrade != null ? g.tentativeFinalGrade.toFixed(2) : "---"}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                                      {g.transmutedGrade != null ? g.transmutedGrade.toFixed(2) : "---"}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span className={cn(
                                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                                        getRemarks(g) === "Passed"
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                          : getRemarks(g) === "Failed"
                                          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                          : "bg-muted text-muted-foreground"
                                      )}>
                                        {getRemarks(g)}
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

                          {dlBySemester[sem.id]?.isQualified && (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
                              <Award className="size-4 text-emerald-600" />
                              <span className="text-sm font-bold text-emerald-700">
                                Dean's Lister
                                {dlBySemester[sem.id]?.rank
                                  ? ` (#${dlBySemester[sem.id]!.rank})`
                                  : ""}
                              </span>
                            </div>
                          )}
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
