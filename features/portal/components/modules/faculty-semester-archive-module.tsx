"use client"

import { useMemo, useState } from "react"
import { Archive, BookOpen, CalendarDays, ChevronDown, ChevronRight, GraduationCap, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeRecord, ScheduleItem } from "../../data/portal-data"
import type { SemesterRecord } from "@/lib/types"

function getSemesterSchedules(
  semester: SemesterRecord,
  schedules: ScheduleItem[],
  instructorName: string
): ScheduleItem[] {
  return schedules.filter(
    (s) => s.semesterId === semester.id && s.instructor === instructorName
  )
}

function getSemesterGrades(
  semester: SemesterRecord,
  grades: GradeRecord[],
  schedules: ScheduleItem[]
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

export function FacultySemesterArchiveModule({ model }: PortalModuleProps) {
  const { archivedSemesters, grades, classSchedules, roster } = model
  const instructorName = model.profile.name
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const semestersWithData = useMemo(() => {
    return archivedSemesters
      .map((sem) => {
        const semSchedules = getSemesterSchedules(sem, classSchedules, instructorName)
        if (semSchedules.length === 0) return null
        const semGrades = getSemesterGrades(sem, grades, classSchedules)
        const sections = [...new Set(semSchedules.map((s) => s.section).filter(Boolean))]
        return { semester: sem, schedules: semSchedules, grades: semGrades, sections }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }, [archivedSemesters, grades, classSchedules, instructorName])

  if (semestersWithData.length === 0) {
    return (
      <Panel title="Semester Archive" className="[&>div:first-child]:hidden">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Archive className="size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold text-foreground">No Archived Teaching Data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Archived semesters with your teaching assignments will appear here.
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Semester Archive" className="[&>div:first-child]:hidden">
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <Archive className="size-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Academic Records</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground">Semester Archive</h3>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {semestersWithData.map(({ semester: sem, schedules: semSchedules, grades: semGrades, sections }) => {
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
                        {semSchedules.length} subject{semSchedules.length !== 1 ? "s" : ""}
                        {" · "}{sections.length} section{sections.length !== 1 ? "s" : ""}
                        {" · "}{semGrades.length} grade record{semGrades.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown className="size-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                    {/* Subjects Taught */}
                    {semSchedules.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <BookOpen className="size-3" />
                          Subjects Taught
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-muted/40 text-muted-foreground">
                                <th className="px-3 py-2 font-semibold">Subject</th>
                                <th className="px-3 py-2 font-semibold">Section</th>
                                <th className="px-3 py-2 font-semibold">Schedule</th>
                                <th className="px-3 py-2 font-semibold">Room</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {semSchedules.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/20">
                                  <td className="px-3 py-2 font-medium text-foreground">{s.subject}</td>
                                  <td className="px-3 py-2 text-foreground">{s.section}</td>
                                  <td className="px-3 py-2 text-foreground">{s.day} {s.time}</td>
                                  <td className="px-3 py-2 text-foreground">{s.room}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Student Rosters */}
                    {sections.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Users className="size-3" />
                          Student Rosters
                        </h4>
                        <div className="space-y-2">
                          {sections.map((section) => {
                            const sectionStudents = roster.filter(
                              (r) => r.section === section && r.enrolled
                            )
                            return (
                              <div key={section} className="rounded-xl border border-border bg-muted/10 p-3">
                                <p className="text-xs font-semibold text-foreground mb-2">Section {section} ({sectionStudents.length} students)</p>
                                {sectionStudents.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {sectionStudents.map((s) => (
                                      <span
                                        key={s.id}
                                        className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                                      >
                                        {s.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground">No enrolled students found.</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Grade Records */}
                    {semGrades.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <GraduationCap className="size-3" />
                          Grade Records (View Only)
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-border">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-muted/40 text-muted-foreground">
                                <th className="px-3 py-2 font-semibold">Student</th>
                                <th className="px-3 py-2 font-semibold">Subject</th>
                                <th className="px-3 py-2 font-semibold text-right">Final Grade</th>
                                <th className="px-3 py-2 font-semibold text-right">Transmuted</th>
                                <th className="px-3 py-2 font-semibold text-center">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {semGrades
                                .sort((a, b) => a.student.localeCompare(b.student))
                                .map((g) => (
                                  <tr key={g.id} className="hover:bg-muted/20">
                                    <td className="px-3 py-2 text-foreground">{g.student}</td>
                                    <td className="px-3 py-2 text-foreground">{g.subject}</td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground">
                                      {g.finalGrade != null ? g.finalGrade.toFixed(2) : g.tentativeFinalGrade != null ? g.tentativeFinalGrade.toFixed(2) : "---"}
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
                      </div>
                    )}

                    {/* View-only indicator */}
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/30 px-3 py-2 dark:border-amber-800/30 dark:bg-amber-950/10">
                      <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        This is an archived semester. All records are view-only and cannot be edited.
                      </p>
                    </div>
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
