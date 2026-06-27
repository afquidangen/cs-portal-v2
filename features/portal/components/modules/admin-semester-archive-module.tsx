"use client"

import { useMemo, useState } from "react"
import { Archive, BookOpen, CalendarDays, ChevronDown, ChevronRight, Download, GraduationCap, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PortalModuleProps } from "./types"
import type { GradeRecord, ScheduleItem } from "../../data/portal-data"
import type { SemesterRecord } from "@/lib/types"

function getSemesterSchedules(
  semester: SemesterRecord,
  schedules: ScheduleItem[]
): ScheduleItem[] {
  return schedules.filter((s) => s.semesterId === semester.id)
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

export function AdminSemesterArchiveModule({ model }: PortalModuleProps) {
  const { archivedSemesters, grades, classSchedules, roster, users } = model
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const semestersWithData = useMemo(() => {
    return archivedSemesters.map((sem) => {
      const semSchedules = getSemesterSchedules(sem, classSchedules)
      const semGrades = getSemesterGrades(sem, grades, classSchedules)
      const instructors = [...new Set(semSchedules.map((s) => s.instructor).filter(Boolean))]
      const sections = [...new Set(semSchedules.map((s) => s.section).filter(Boolean))]
      const passed = semGrades.filter((g) => g.remarks === "Passed").length
      return {
        semester: sem,
        schedules: semSchedules,
        grades: semGrades,
        instructors,
        sections,
        passed,
      }
    })
  }, [archivedSemesters, grades, classSchedules])

  function downloadCsv(
    sem: SemesterRecord,
    semSchedules: ScheduleItem[],
    semGrades: GradeRecord[]
  ) {
    const instructorMap = new Map<string, string>()
    for (const s of semSchedules) {
      const key = `${s.section}|${s.subject}`
      if (!instructorMap.has(key)) instructorMap.set(key, s.instructor)
    }

    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const rows: string[] = []

    rows.push(esc(`Semester Archive Report - ${sem.semester} A.Y. ${sem.schoolYearStart}-${sem.schoolYearEnd}`))
    rows.push("")

    rows.push("SCHEDULES")
    rows.push(["Day", "Time", "Subject", "Section", "Room", "Instructor"].map(esc).join(","))
    for (const s of semSchedules) {
      rows.push([s.day, s.time, s.subject, s.section, s.room, s.instructor].map(esc).join(","))
    }
    rows.push("")

    const seen = new Set<string>()
    const rosterEntries: { section: string; student: string }[] = []
    for (const g of semGrades) {
      const key = `${g.section}|${g.student}`
      if (!seen.has(key)) {
        seen.add(key)
        rosterEntries.push({ section: g.section, student: g.student })
      }
    }
    rows.push("STUDENT ROSTER")
    rows.push(["Section", "Student Name"].map(esc).join(","))
    for (const r of rosterEntries.sort((a, b) => a.section.localeCompare(b.section) || a.student.localeCompare(b.student))) {
      rows.push([r.section, r.student].map(esc).join(","))
    }
    rows.push("")

    rows.push("GRADE RECORDS")
    rows.push(["Student", "Subject Code", "Subject", "Section", "Instructor", "Final Grade", "Transmuted", "Remarks"].map(esc).join(","))
    for (const g of [...semGrades].sort((a, b) => a.student.localeCompare(b.student))) {
      const instructor = instructorMap.get(`${g.section}|${g.subject}`) ?? ""
      rows.push([
        g.student, g.code, g.subject, g.section, instructor,
        String(g.finalGrade ?? g.tentativeFinalGrade ?? ""),
        String(g.transmutedGrade ?? ""),
        g.remarks ?? "",
      ].map(esc).join(","))
    }

    const csv = rows.join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `archive-${sem.id}-report.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (archivedSemesters.length === 0) {
    return (
      <div className="space-y-5">
        <div className="pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Semester Archive</h1>
          <p className="mt-2 text-sm text-slate-600">Review archived semesters, schedules, and grade records.</p>
        </div>
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Archive className="size-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-950">No Archived Semesters</h3>
            <p className="mt-1 text-sm text-slate-500">
              Archived semesters will appear here once semesters are archived.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Semester Archive</h1>
        <p className="mt-2 text-sm text-slate-600">Review archived semesters, schedules, and grade records.</p>
      </div>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
        <div className="space-y-3">
          {semestersWithData.map(({ semester: sem, schedules: semSchedules, grades: semGrades, instructors, sections, passed }) => {
            const isOpen = expandedId === sem.id
            return (
              <div
                key={sem.id}
                className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="flex w-full items-center justify-between gap-2 p-4">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : sem.id)}
                    className="flex items-center gap-3 min-w-0 text-left hover:bg-muted/30 transition-colors flex-1"
                  >
                    <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {sem.semester}, A.Y. {sem.schoolYearStart}-{sem.schoolYearEnd}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {semSchedules.length} schedule{semSchedules.length !== 1 ? "s" : ""}
                        {" · "}{semGrades.length} grade record{semGrades.length !== 1 ? "s" : ""}
                        {" · "}{passed} passed
                        {" · "}{instructors.length} instructor{instructors.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadCsv(sem, semSchedules, semGrades)
                      }}
                    >
                      <Download className="size-3.5" />
                      CSV Report
                    </Button>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : sem.id)}
                      className="p-1 hover:bg-muted/30 rounded-md transition-colors"
                    >
                      {isOpen ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
                    </button>
                  </div>
                </div>

                  {isOpen && (
                  <div className="border-t border-slate-200 px-4 pb-4 pt-3 space-y-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                        <p className="text-xs text-muted-foreground">Schedules</p>
                        <p className="text-lg font-bold text-foreground">{semSchedules.length}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                        <p className="text-xs text-muted-foreground">Grade Records</p>
                        <p className="text-lg font-bold text-foreground">{semGrades.length}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                        <p className="text-xs text-muted-foreground">Instructors</p>
                        <p className="text-lg font-bold text-foreground">{instructors.length}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                        <p className="text-xs text-muted-foreground">Sections</p>
                        <p className="text-lg font-bold text-foreground">{sections.length}</p>
                      </div>
                    </div>

                    {/* Schedules table */}
                    {semSchedules.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Schedules & Faculty Assignments</h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500">
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Day</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Time</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Subject</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Section</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Room</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Instructor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {semSchedules.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 text-slate-700">{s.day}</td>
                                  <td className="px-3 py-2 text-slate-700">{s.time}</td>
                                  <td className="px-3 py-2 font-medium text-slate-900">{s.subject}</td>
                                  <td className="px-3 py-2 text-slate-700">{s.section}</td>
                                  <td className="px-3 py-2 text-slate-700">{s.room}</td>
                                  <td className="px-3 py-2 text-slate-700">{s.instructor}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Grade Records table */}
                    {semGrades.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Grade Records</h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500">
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Student</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Code</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">Subject</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-right">Final Grade</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-right">Transmuted</th>
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-center">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {semGrades
                                .sort((a, b) => a.student.localeCompare(b.student))
                                .map((g) => (
                                  <tr key={g.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 text-slate-700">{g.student}</td>
                                    <td className="px-3 py-2 font-mono text-slate-700">{g.code}</td>
                                    <td className="px-3 py-2 text-slate-700">{g.subject}</td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">
                                      {g.finalGrade ?? g.tentativeFinalGrade ?? "---"}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">
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

                    {/* Download Report */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => downloadCsv(sem, semSchedules, semGrades)}
                    >
                      <Download className="size-4" />
                      Download Full Report (CSV)
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
