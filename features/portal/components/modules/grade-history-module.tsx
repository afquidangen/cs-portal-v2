"use client"

import { useMemo } from "react"
import { BookOpen } from "lucide-react"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { CurriculumRecord, GradeHistoryEntry, GradeRecord } from "../../data/portal-data"

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
    const curriculumId = studentUser?.curriculumId ?? ""
    const curriculum = (model.curricula as CurriculumRecord[] | undefined)?.find((c) => c.id === curriculumId)

    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase()
    const findTermForSubject = (code: string) => {
      if (!curriculum) return null
      const normCode = normalize(code)
      let midyearFallback: (typeof curriculum.terms)[0] | null = null
      for (const term of curriculum.terms) {
        if (term.subjects.some((s: { code: string }) => normalize(s.code) === normCode)) {
          if (term.semester !== "Midyear") return term
          midyearFallback = term
        }
      }
      return midyearFallback
    }

    for (const grade of releasedGrades) {
      const term = findTermForSubject(grade.code)
      const yearLevel = term?.year ?? ""
      const semester = term?.semester ?? ""
      const existingIdx = base.findIndex((h) => h.subjectCode === grade.code)
      const entry: GradeHistoryEntry = {
        subjectCode: grade.code,
        subjectName: grade.subject,
        finalPercentile: grade.finalGrade!,
        transmutedGrade: grade.transmutedGrade!,
        units: grade.units,
        remarks: grade.midtermRemarks && grade.finalRemarks
          ? (grade.finalRemarks.toLowerCase() === "passed" && grade.midtermRemarks.toLowerCase() === "passed"
            ? "Passed"
            : grade.midtermRemarks.toLowerCase() !== "passed"
              ? grade.midtermRemarks
              : grade.finalRemarks)
          : grade.finalRemarks || grade.midtermRemarks || grade.remarks || "Passed",
        curriculumId,
        yearLevel,
        semester,
        section: grade.section,
      }
      if (existingIdx >= 0) {
        base[existingIdx] = {
          ...base[existingIdx],
          ...entry,
        }
      } else {
        base.push(entry)
      }
    }

    // Override yearLevel/semester from curriculum (source of truth) for all entries
    for (const entry of base) {
      const term = findTermForSubject(entry.subjectCode)
      if (term) {
        entry.yearLevel = term.year
        entry.semester = term.semester
      }
    }

    return base
  }, [studentUser?.gradeHistory, model.allStudentGrades, activeSemester, model.curricula])

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
        const y = sortYearLevel(a.yearLevel, b.yearLevel)
        if (y !== 0) return y
        return sortSemester(a.semester, b.semester)
      })
  }, [history])

  return (
    <Panel title="Grades Registry" className="[&>div:first-child]:hidden">
      <div className="mb-5 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Grades Registry</h1>
        <p className="mt-2 text-sm text-slate-600">Review your historical grades by year level and semester.</p>
      </div>
      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-400 bg-white px-6 py-14 text-center shadow-sm">
          <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm leading-7 text-muted-foreground">
            No grade history records yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={`${group.yearLevel}-${group.semester}`}>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-blue-600" />
                <p className="text-sm font-semibold text-slate-950">
                  {YEAR_MAP[group.yearLevel] ?? group.yearLevel} - {group.semester}
                </p>
                <span className="text-xs text-slate-500">
                  {group.entries.length} {group.entries.length === 1 ? "subject" : "subjects"}
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-400 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr className="border-b border-slate-400">
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Subject Code
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Subject Title
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                        Units
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                        Final Grade
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400 bg-white">
                    {group.entries.map((entry, idx) => (
                      <tr key={idx} className="transition-colors hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">
                          {entry.subjectCode}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {entry.subjectName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center font-mono tabular-nums text-slate-700">
                          {entry.units ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center font-mono tabular-nums text-slate-700">
                          {entry.transmutedGrade.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge value={entry.remarks} />
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
