"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Award, BookMarked, ClipboardList, Download, FileSpreadsheet, GraduationCap, ListChecks, Search, Send, Upload, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  gradeRemarkOptions,
  computeDeansList,
} from "../../lib/grades"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { DeansListEntry } from "@/lib/types"
import type { GradeRecord } from "@/lib/types/grade"
import type { GradingScheme, SchemeComponent, TransmutationEntry, TransmutationTable } from "@/lib/types"
import type { ScheduleItem, ClassStudent, CurriculumRecord, UserRecord } from "../../data/portal-data"

type GradingPeriod = "midterm" | "final"
type GradeColumnSet = {
  key: string
  period: GradingPeriod
  category: string
  component: string
  componentWeight: number
  categoryWeight: number
  area: "lecture" | "laboratory"
}

const DEFAULT_LECTURE_SCHEME: GradingScheme = {
  id: "GS-DEFAULT-LECTURE",
  name: "ISPSC Default Lecture",
  subjectType: "Lecture",
  isDefault: true,
  isActive: true,
  components: [
    {
      name: "Class Standing",
      weight: 60,
      categories: [
        { name: "Quizzes", weight: 10 },
        { name: "Performance", weight: 30 },
        { name: "Assignments", weight: 30 },
        { name: "Attendance", weight: 30 },
      ],
    },
    { name: "Exam", weight: 40, categories: [{ name: "Exam", weight: 100 }] },
  ],
  createdAt: "",
  updatedAt: "",
}

const DEFAULT_LAB_SCHEME: GradingScheme = {
  id: "GS-DEFAULT-LAB",
  name: "ISPSC Default Lecture with Lab",
  subjectType: "Lecture with Lab",
  isDefault: true,
  isActive: true,
  lectureWeight: 40,
  laboratoryWeight: 60,
  components: [
    {
      name: "Lecture Class Standing",
      weight: 60,
      categories: [
        { name: "Quizzes", weight: 10 },
        { name: "Performance", weight: 30 },
        { name: "Assignments", weight: 30 },
        { name: "Attendance", weight: 30 },
      ],
    },
    { name: "Lecture Exam", weight: 40, categories: [{ name: "Exam", weight: 100 }] },
  ],
  labComponents: [
    {
      name: "Laboratory",
      weight: 100,
      categories: [
        { name: "Exercises", weight: 35 },
        { name: "Work Attitude", weight: 35 },
        { name: "Project", weight: 15 },
        { name: "Attendance", weight: 15 },
      ],
    },
  ],
  createdAt: "",
  updatedAt: "",
}

const DEFAULT_TRANSMUTATION_ENTRIES: TransmutationEntry[] = [
  { min: 97, max: 100, equivalent: 1.0 },
  { min: 94, max: 96, equivalent: 1.25 },
  { min: 91, max: 93, equivalent: 1.5 },
  { min: 88, max: 90, equivalent: 1.75 },
  { min: 85, max: 87, equivalent: 2.0 },
  { min: 82, max: 84, equivalent: 2.25 },
  { min: 79, max: 81, equivalent: 2.5 },
  { min: 76, max: 78, equivalent: 2.75 },
  { min: 75, max: 75, equivalent: 3.0 },
  { min: 72, max: 74, equivalent: 4.0 },
  { min: 0, max: 71, equivalent: 5.0 },
]

function normalizeGradeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function makeScoreKey(period: GradingPeriod, component: string, category: string) {
  return `${period}:${normalizeGradeKey(component)}:${normalizeGradeKey(category)}`
}

function toDisplayNumber(value: number | undefined) {
  return value === undefined || Number.isNaN(value) ? "N/A" : value.toFixed(2)
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function clampScore(value: number, max: number) {
  return Math.max(0, Math.min(value, Math.max(0, max)))
}

function scorePercent(score: number | undefined, maxScore: number | undefined) {
  const max = maxScore && maxScore > 0 ? maxScore : 100
  return Number((((score ?? 0) / max) * 100).toFixed(2))
}

function transmuteFromEntries(percentile: number | undefined, entries: TransmutationEntry[]) {
  if (percentile === undefined) return undefined
  const sorted = [...entries].sort((a, b) => b.max - a.max)
  return sorted.find((entry) => percentile >= entry.min && percentile <= entry.max)?.equivalent ?? 5.0
}

function periodLabel(period: GradingPeriod) {
  return period === "midterm" ? "Midterm" : "Final"
}

function buildColumnSets(scheme: GradingScheme) {
  const periods: GradingPeriod[] = ["midterm", "final"]
  const sets: GradeColumnSet[] = []

  for (const period of periods) {
    for (const component of scheme.components) {
      for (const category of component.categories.length > 0 ? component.categories : [{ name: component.name, weight: 100 }]) {
        sets.push({
          key: makeScoreKey(period, component.name, category.name),
          period,
          category: category.name,
          component: component.name,
          componentWeight: component.weight,
          categoryWeight: category.weight,
          area: "lecture",
        })
      }
    }

    if (scheme.subjectType === "Lecture with Lab") {
      for (const component of scheme.labComponents ?? []) {
        for (const category of component.categories.length > 0 ? component.categories : [{ name: component.name, weight: 100 }]) {
          sets.push({
            key: makeScoreKey(period, component.name, category.name),
            period,
            category: category.name,
            component: component.name,
            componentWeight: component.weight,
            categoryWeight: category.weight,
            area: "laboratory",
          })
        }
      }
    }
  }

  return sets
}

function scoreMap(record?: GradeRecord) {
  return record?.scores ?? {}
}

function maxScoreMap(record?: GradeRecord) {
  return record?.maxScores ?? {}
}

function computePeriodGrade(
  record: GradeRecord,
  period: GradingPeriod,
  scheme: GradingScheme,
  sets: GradeColumnSet[]
) {
  const scores = scoreMap(record)
  const maxScores = maxScoreMap(record)
  const periodSets = sets.filter((set) => set.period === period)
  const hasScores = periodSets.some((set) => Object.prototype.hasOwnProperty.call(scores, set.key))

  function computeWS(percentageScore: number, categoryWeight: number): number {
    return (percentageScore * 50 + 50) * categoryWeight
  }

  function wsComponentGrade(component: SchemeComponent) {
    const categories = component.categories.length > 0 ? component.categories : [{ name: component.name, weight: 100 }]
    const wsValues: number[] = []
    for (const category of categories) {
      const key = makeScoreKey(period, component.name, category.name)
      const maxVal = maxScores[key] && maxScores[key] > 0 ? maxScores[key] : 100
      const score = scores[key] ?? 0
      const percentage = maxVal > 0 ? score / maxVal : 0
      const catWeight = category.weight / 100
      wsValues.push(computeWS(percentage, catWeight))
    }
    return wsValues.reduce((s, v) => s + v, 0)
  }

  const examComponent = scheme.components.find(
    (c) => c.isExam === true
  ) || scheme.components.find(
    (c) => c.name.toLowerCase().includes("exam")
  )
  const standingComponents = scheme.components.filter(
    (c) => c !== examComponent
  )

  const standingGrades = standingComponents.map((component) => ({
    component,
    grade: wsComponentGrade(component),
  }))

  let examGrade = 50
  if (examComponent) {
    const categories = examComponent.categories.length > 0
      ? examComponent.categories
      : [{ name: examComponent.name, weight: 100 }]
    const wsValues = categories.map((cat) => {
      const key = makeScoreKey(period, examComponent.name, cat.name)
      const maxVal = maxScores[key] && maxScores[key] > 0 ? maxScores[key] : 100
      const pct = (scores[key] ?? 0) / maxVal
      return (pct * 50) + 50
    })
    examGrade = wsValues.reduce((s, v) => s + v, 0) / wsValues.length
  }

  const standingGrade = standingGrades.reduce(
    (sum, item) => sum + item.grade * (item.component.weight / 100), 0
  )
  const examWeight = (examComponent?.weight ?? 40) / 100

  const lectureGrade = standingGrade + examGrade * examWeight

  let laboratoryGrade: number | undefined
  if (scheme.subjectType === "Lecture with Lab") {
    const labComponents = (scheme.labComponents ?? []).map((component) => ({
      component,
      grade: wsComponentGrade(component),
    }))
    laboratoryGrade = labComponents.reduce((sum, item) => sum + item.grade * (item.component.weight / 100), 0)
  }

  const periodGrade = scheme.subjectType === "Lecture with Lab"
    ? lectureGrade * ((scheme.lectureWeight ?? 40) / 100) + (laboratoryGrade ?? 0) * ((scheme.laboratoryWeight ?? 60) / 100)
    : lectureGrade

  const categoryGrades = periodSets.map((set) => {
    const maxVal = maxScores[set.key] && maxScores[set.key] > 0 ? maxScores[set.key] : 100
    const rawScore = scores[set.key] ?? 0
    const percentage = rawScore / maxVal
    const catWeight = set.categoryWeight / 100
    const ws = computeWS(percentage, catWeight)
    return {
      category: `${periodLabel(period)} ${set.component} - ${set.category}`,
      totalStudentScore: rawScore,
      totalPossibleScore: maxVal,
      percentageScore: percentage,
      weightedScore: ws,
      grade: scorePercent(scores[set.key], maxScores[set.key]),
    }
  })

  return { hasScores, periodGrade, lectureGrade, laboratoryGrade, standing: standingGrade, exam: examGrade, categoryGrades }
}

function computeGradeRecord(record: GradeRecord, scheme: GradingScheme, entries: TransmutationEntry[], sets: GradeColumnSet[]) {
  const midterm = computePeriodGrade(record, "midterm", scheme, sets)
  const finalTerm = computePeriodGrade(record, "final", scheme, sets)
  const midtermGrade = midterm.hasScores ? midterm.periodGrade : undefined
  const tentativeFinalGrade = finalTerm.hasScores ? finalTerm.periodGrade : undefined
  const finalGrade = midtermGrade !== undefined && tentativeFinalGrade !== undefined
    ? (midtermGrade + tentativeFinalGrade) / 2
    : undefined
  const transmutedGrade = transmuteFromEntries(finalGrade, entries)

  return {
    ...record,
    categoryGrades: [...midterm.categoryGrades, ...finalTerm.categoryGrades],
    lectureClassStanding: finalTerm.standing ?? midterm.standing,
    lectureExam: finalTerm.exam ?? midterm.exam,
    lectureGrade: finalTerm.lectureGrade,
    laboratoryGrade: finalTerm.laboratoryGrade,
    midtermClassStanding: midterm.standing,
    midtermExam: midterm.exam,
    midtermLaboratoryGrade: midterm.laboratoryGrade,
    midtermGrade,
    tentativeFinalGrade,
    finalClassStanding: finalTerm.standing,
    finalExam: finalTerm.exam,
    finalLaboratoryGrade: finalTerm.laboratoryGrade,
    finalGrade,
    transmutedGrade,
    gradePercentage: finalGrade,
    midtermTransmuted: midtermGrade,
    finalTransmuted: tentativeFinalGrade,
    midterm: transmuteFromEntries(midtermGrade, entries),
    finalTerm: transmuteFromEntries(tentativeFinalGrade, entries),
    remarks: record.remarks,
    gradingSchemeId: scheme.id,
    subjectType: scheme.subjectType,
  }
}

export function GradesModule({ model }: PortalModuleProps) {
  const { downloadGradeReport, downloadGradeReportDocument } = model

  const profileUser = (model.users as UserRecord[] | undefined)?.find(
    (u) => u.id === model.profile.id
  )

  const visibleGrades = useMemo(() => {
    const active = model.activeSemester
    if (!active) return []

    const activeSchedules = (model.classSchedules as ScheduleItem[])
      .filter((s) => s.semesterId === active.id)
    const activeScheduleIds = new Set(activeSchedules.map((s) => s.id))
    const activePairs = new Set(
      activeSchedules.map((s) => `${s.section}|${s.subject}`)
    )

    const allActive = (model.grades as GradeRecord[]).filter((g) => {
      if (g.studentId !== model.profile.id) return false
      if (g.deletedAt) return false
      return (
        g.semesterId === active.id ||
        (g.classId && activeScheduleIds.has(g.classId)) ||
        activePairs.has(`${g.section}|${g.subject}`)
      )
    })

    const gradeMap = new Map<string, GradeRecord>()
    for (const g of allActive) {
      const existing = gradeMap.get(g.code)
      if (!existing) {
        gradeMap.set(g.code, g)
      } else if (g.semesterId === active.id && existing.semesterId !== active.id) {
        gradeMap.set(g.code, g)
      } else if (g.semesterId !== active.id && existing.semesterId === active.id) {
        continue
      } else if (g.released && !existing.released) {
        gradeMap.set(g.code, g)
      }
    }

    const studentSections = [
      model.profileSection,
      ...(model.roster as ClassStudent[])
        .filter((r) => r.id === model.profile.id && r.enrolled)
        .map((r) => r.section),
    ].filter(Boolean)

    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase()
    const finalizedStatuses = new Set(["passed", "failed", "inc", "dropped", "unofficial drop", "unofficial dropped"])
    const gradeHistory = profileUser?.gradeHistory ?? []

    // Source 1: Grade History (primary)
    const historyFinalizedCodes = new Set(
      gradeHistory
        .filter((h) => finalizedStatuses.has(h.remarks?.toLowerCase()))
        .map((h) => normalize(h.subjectCode))
    )

    // Source 2: All released grades across semesters (backup for when gradeHistory isn't populated)
    const allGrades = (model.allStudentGrades as GradeRecord[] ?? [])
    const gradesFinalizedCodes = new Set(
      allGrades
        .filter((g) => {
          if (g.semesterId === active.id) return false
          const r = (g.remarks || g.finalRemarks || "").toLowerCase()
          return finalizedStatuses.has(r)
        })
        .map((g) => normalize(g.code))
    )

    // Union: history takes precedence, grades fill gaps
    const finalizedCodes = new Set([...historyFinalizedCodes, ...gradesFinalizedCodes])

    // Retake detection: non-passing finalizations that have active schedules
    const historyRetakeCodes = new Set(
      gradeHistory
        .filter((h) => {
          const r = h.remarks?.toLowerCase()
          return r !== "passed" && r !== undefined && finalizedStatuses.has(r)
        })
        .map((h) => normalize(h.subjectCode))
    )
    const gradesRetakeCodes = new Set(
      allGrades
        .filter((g) => {
          if (g.semesterId === active.id) return false
          const r = (g.remarks || g.finalRemarks || "").toLowerCase()
          return r !== "passed" && finalizedStatuses.has(r)
        })
        .map((g) => normalize(g.code))
    )
    const retakeCodes = new Set(
      [...historyRetakeCodes, ...gradesRetakeCodes].filter((code) =>
        activeSchedules.some((s) => {
          const sCode = normalize(s.subject.split(" - ")[0]?.trim() ?? "")
          return sCode === code
        })
      )
    )

    const yearLevel = profileUser?.currentYearLevel ?? ""
    const curriculum =
      (model.curricula as CurriculumRecord[])
        .find((c) => c.id === profileUser?.curriculumId)
    const curriculumTerms = curriculum?.terms ?? []
    const curriculumTerm = curriculumTerms.find(
      (t) => t.year === yearLevel && t.semester === active.semester
    )

    for (const schedule of activeSchedules) {
      const code = schedule.subject.split(" - ")[0]?.trim() ?? schedule.subject
      const matchesSection = studentSections.some((sec) =>
        schedule.section.includes(sec)
      )
      if (!matchesSection) continue
      if (finalizedCodes.has(normalize(code)) && !retakeCodes.has(normalize(code))) continue
      if (gradeMap.has(code)) continue

      let units = 0
      if (curriculumTerm) {
        const sub = curriculumTerm.subjects.find((s) => s.code === code)
        if (sub) units = sub.total
      }

      gradeMap.set(code, {
        id: `pending-${schedule.id}`,
        studentId: model.profile.id,
        student: model.profile.name,
        section: schedule.section,
        subject: schedule.subject,
        code,
        units,
        classId: schedule.id,
        semesterId: active.id,
        released: false,
        updatedAt: "",
      } as GradeRecord)
    }

    // Curriculum-based subject initialization (for subjects without schedules)
    if (profileUser?.curriculumId && curriculumTerm) {
      for (const sub of curriculumTerm.subjects) {
        const code = sub.code
        const normCode = normalize(code)
        if (gradeMap.has(code)) continue
        if (finalizedCodes.has(normCode) && !retakeCodes.has(normCode)) continue

        gradeMap.set(code, {
          id: `pending-curriculum-${code}`,
          studentId: model.profile.id,
          student: model.profile.name,
          section: studentSections[0] ?? "TBD",
          subject: `${code} - ${sub.name}`,
          code,
          units: sub.total,
          classId: "",
          semesterId: active.id,
          released: false,
          updatedAt: "",
        } as GradeRecord)
      }
    }

    return [...gradeMap.values()]
  }, [
    model.activeSemester, model.classSchedules, model.grades,
    model.allStudentGrades,
    model.profile, model.profileSection, model.roster,
    profileUser, model.curricula,
  ])

  const [publishedDl, setPublishedDl] = useState<DeansListEntry | null>(null)

  useEffect(() => {
    const semId = model.activeSemester?.id
    if (!semId) return
    fetch(`/api/portal/deans-list/student?semesterId=${semId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setPublishedDl(json?.data ?? null))
      .catch(() => {})
  }, [model.activeSemester?.id])

  const deansListData = useMemo(
    () => computeDeansList(visibleGrades),
    [visibleGrades]
  )

  const displayDl = useMemo(() => {
    if (publishedDl) {
      return {
        gwa: publishedDl.gwa,
        eligible:
          publishedDl.manualOverride === "include"
            ? true
            : publishedDl.manualOverride === "exclude"
            ? false
            : publishedDl.isQualified,
        reasons: publishedDl.disqualificationReasons,
        rank: publishedDl.rank,
      }
    }
    if (!deansListData.eligible) return null
    return {
      gwa: deansListData.gwa,
      eligible: deansListData.eligible,
      reasons: deansListData.reasons,
      rank: null,
    }
  }, [publishedDl, deansListData])

  const allGradesReleased = visibleGrades.length > 0 && visibleGrades.every((g) => g.finalReleased)

  if (model.role === "faculty") {
    return <FacultyGradesPanel model={model} />
  }

  return (
    <Panel
      title="Grades & Report"
      className="[&>div:first-child]:hidden"
    >
      <div className="mb-5 flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Grades & Report</h1>
          <p className="mt-2 text-sm text-slate-600">Track released grades, GWA, and downloadable grade reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={downloadGradeReport} className="h-10 rounded-md bg-blue-600 px-4 text-white hover:bg-blue-700">
              <Download className="size-4" />
              Download CSV
            </Button>
            <Button size="sm" onClick={downloadGradeReportDocument} variant="outline" className="h-10 rounded-md border-slate-200 px-4">
              <FileSpreadsheet className="size-4" />
              Download Document
            </Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Visible Records",
            value: String(visibleGrades.length),
            note: "Current grade rows",
            icon: ListChecks,
          },
          {
            label: "Total Units",
            value: String(visibleGrades.reduce((s, g) => s + (g.units || 0), 0)),
            note: "Released graded units",
            icon: BookMarked,
          },
          {
            label: "GWA Equivalent",
            value: displayDl && displayDl.gwa !== null && allGradesReleased ? displayDl.gwa.toFixed(2) : "N/A",
            note: displayDl?.eligible ? "Dean's List" : (displayDl?.reasons?.length ? displayDl.reasons[0] : "Awaiting complete grades"),
            icon: Award,
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {displayDl && displayDl.gwa !== null && allGradesReleased && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              GWA
            </p>
            <p className="text-4xl font-semibold tracking-tight text-slate-950">
              {displayDl.gwa.toFixed(2)}
            </p>
            {displayDl.eligible ? (
              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-5 py-2 shadow-sm">
                  <Award className="size-6 text-green-600 dark:text-green-400" />
                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                    Dean&apos;s Lister
                  </span>
                </div>
                {displayDl.rank && (
                  <p className="text-sm font-semibold text-amber-600">
                    Rank #{displayDl.rank}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Congratulations, CStizen! You&apos;re qualified for the Dean&apos;s List for the semester.
                </p>
              </div>
            ) : displayDl.reasons.length > 0 ? (
              <p className="mt-3 text-sm text-muted-foreground/60 italic">
                {displayDl.reasons[0]}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-foreground">Grade Records</h4>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full min-w-[740px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Units
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Midterm
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Mid. Remarks
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Final Term
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Fin. Remarks
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Grade %
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Final Rating
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                Equivalent
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {visibleGrades.length === 0 && (
              <tr key="empty">
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No grade records yet.
                </td>
              </tr>
            )}
            {visibleGrades.length > 0 && visibleGrades.map((grade) => {
                return (
                  <tr key={grade.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {grade.subject}
                      </p>
                      <p className="text-xs text-foreground/70">{grade.code}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{grade.units}</td>

                    {/* Midterm Grade */}
                    <td className="px-4 py-3 text-foreground/80">
                      {grade.midtermReleased && grade.midtermGrade !== undefined
                        ? grade.midtermGrade.toFixed(2)
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                    {/* Mid. Remarks */}
                    <td className="px-4 py-3">
                      {grade.midtermReleased && grade.midtermRemarks
                        ? <StatusBadge value={grade.midtermRemarks} />
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                    {/* Tentative Final */}
                    <td className="px-4 py-3 text-foreground/80">
                      {grade.finalReleased && grade.tentativeFinalGrade !== undefined
                        ? grade.tentativeFinalGrade.toFixed(2)
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                    {/* Fin. Remarks */}
                    <td className="px-4 py-3">
                      {grade.finalReleased && grade.finalRemarks
                        ? <StatusBadge value={grade.finalRemarks} />
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                    {/* Percentile */}
                    <td className="px-4 py-3 text-foreground/80">
                      {grade.finalReleased && grade.finalGrade !== undefined
                        ? grade.finalGrade.toFixed(2)
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                    {/* Final Rating */}
                    <td className="px-4 py-3 text-foreground/80">
                      {grade.finalReleased && grade.finalGrade !== undefined
                        ? grade.finalGrade.toFixed(0)
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                    {/* Transmuted */}
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {grade.finalReleased && grade.transmutedGrade !== undefined
                        ? grade.transmutedGrade.toFixed(2)
                        : <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>}
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground/80">Important Disclaimer:</strong> The grades displayed on this portal are for informational purposes only and do not constitute an official academic record. The Final Report issued and signed by the College Registrar remains the sole official documentation of your grades. In the event of any discrepancy between this digital preview and the official report, the Registrar&apos;s record shall prevail.
      </div>
    </Panel>
  )
}

function FacultyGradesPanel({ model }: PortalModuleProps) {
  const {
    downloadGradeTemplate,
    grades,
    setGrades,
    roster,
    users,
    handleGradeWorkbookUpload,
    releaseGradesForSection,
    updateGrade,
    updateGradeRemarks,
    uploadName,
    visibleSchedules,
    semesters,
    subjects,
  } = model

  const [selectedSemesterId, setSelectedSemesterId] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [studentQuery, setStudentQuery] = useState("")
  const [gradingSchemes, setGradingSchemes] = useState<GradingScheme[]>([])
  const [transmutationTables, setTransmutationTables] = useState<TransmutationTable[]>([])


  useEffect(() => {
    let cancelled = false

    async function loadGradingConfig() {
      try {
        const [schemeRes, tableRes] = await Promise.all([
          fetch("/api/portal/grading-schemes"),
          fetch("/api/portal/transmutation-tables"),
        ])
        const [schemeData, tableData] = await Promise.all([
          schemeRes.json(),
          tableRes.json(),
        ])
        if (!cancelled && schemeRes.ok) {
          setGradingSchemes(schemeData.data ?? [])
        }
        if (!cancelled && tableRes.ok) {
          setTransmutationTables(tableData.data ?? [])
        }
      } catch {
        if (!cancelled) {
          setGradingSchemes([])
          setTransmutationTables([])
        }
      }
    }

    loadGradingConfig()
    return () => {
      cancelled = true
    }
  }, [])

  const prevActiveSchemeIdRef = useRef<string | null>(null)

  useEffect(() => {
    prevActiveSchemeIdRef.current = gradingSchemes.find(
      (s) => s.isActive && s.subjectType === selectedSubjectType
    )?.id ?? gradingSchemes.find((s) => s.isActive)?.id ?? null
  }, [gradingSchemes, selectedSubjectType])

  const refetchAndDetect = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/grading-schemes")
      const json = await res.json()
      if (!json.data) return
      const newSchemes = json.data as GradingScheme[]
      const active = newSchemes.find(
        (s) => s.isActive && s.subjectType === selectedSubjectType
      ) ?? newSchemes.find((s) => s.isActive)
      if (!active) return
      const newId = active.id
      if (prevActiveSchemeIdRef.current && prevActiveSchemeIdRef.current !== newId) {
        setGradingSchemes(newSchemes)
      }
      prevActiveSchemeIdRef.current = newId
    } catch { /* poll silently */ }
  }, [selectedSubjectType, setGradingSchemes])

  useEffect(() => {
    const onFocus = () => refetchAndDetect()
    const onVisibility = () => { if (document.visibilityState === "visible") refetchAndDetect() }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onFocus)
    const interval = setInterval(refetchAndDetect, 60000)
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("focus", onFocus); clearInterval(interval) }
  }, [refetchAndDetect])

  const prevFacultyModuleRef = useRef(model.activeModule)
  useEffect(() => {
    if (prevFacultyModuleRef.current !== "grades" && model.activeModule === "grades") {
      refetchAndDetect()
    }
    prevFacultyModuleRef.current = model.activeModule
  }, [model.activeModule, refetchAndDetect])

  const scheduleSemesters = useMemo(() => {
    const semesterIds = new Set(visibleSchedules.map((s) => s.semesterId))
    return semesters.filter((sem) => semesterIds.has(sem.id))
  }, [visibleSchedules, semesters])

  const facultySubjects = useMemo(() => {
    const seen = new Set<string>()
    return visibleSchedules.filter((s) => {
      if (selectedSemesterId && s.semesterId !== selectedSemesterId) return false
      if (seen.has(s.subject)) return false
      seen.add(s.subject)
      return true
    })
  }, [visibleSchedules, selectedSemesterId])

  const subjectSections = useMemo(() => {
    if (!selectedSubject) return []
    const seen = new Set<string>()
    return visibleSchedules
      .filter((s) => s.subject === selectedSubject)
      .filter((s) => {
        if (selectedSemesterId && s.semesterId !== selectedSemesterId) return false
        if (seen.has(s.section)) return false
        seen.add(s.section)
        return true
      })
      .map((s) => s.section)
  }, [visibleSchedules, selectedSubject, selectedSemesterId])

  const subjectRoster = useMemo(() => {
    if (subjectSections.length === 0) return []
    const sectionSet = new Set(subjectSections)
    const passedIds = new Set(
      grades
        .filter((g) => g.subject === selectedSubject && g.remarks === "Passed" && g.released)
        .map((g) => g.studentId)
    )
    return roster.filter((s) => {
      const userExists = users.some((u) => u.id === s.id && u.role === "student" && !u.deletedAt)
      return sectionSet.has(s.section) && s.enrolled && userExists && !passedIds.has(s.id)
    })
  }, [roster, subjectSections, grades, selectedSubject, users])

  const rosterBySection = useMemo(() => {
    const groups = new Map<string, typeof subjectRoster>()
    for (const student of subjectRoster) {
      const section = student.section || "Unassigned"
      if (!groups.has(section)) groups.set(section, [])
      groups.get(section)!.push(student)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [subjectRoster])

  const filteredRosterBySection = useMemo(() => {
    const q = studentQuery.toLowerCase().trim()
    return rosterBySection
      .map(([section, students]) => {
        let filtered = students
        if (q) {
          filtered = students.filter((s) => {
            const displayName = s.lastName
              ? `${s.lastName}, ${s.firstName ?? ""}${s.middleName ? ` ${s.middleName}` : ""}`
              : s.name
            return displayName.toLowerCase().includes(q)
          })
        }
        const sorted = [...filtered].sort((a, b) => {
          const aLast = a.lastName ?? a.name.split(" ").pop() ?? ""
          const bLast = b.lastName ?? b.name.split(" ").pop() ?? ""
          const cmp = aLast.localeCompare(bLast)
          if (cmp !== 0) return cmp
          const aFirst = a.firstName ?? a.name
          const bFirst = b.firstName ?? b.name
          return aFirst.localeCompare(bFirst)
        })
        return [section, sorted] as [string, typeof subjectRoster]
      })
      .filter(([, students]) => students.length > 0)
  }, [rosterBySection, studentQuery])

  const gradeMap = useMemo(() => {
    const map = new Map()
    if (!selectedSubject) return map
    for (const g of grades) {
      if (g.subject === selectedSubject) {
        map.set(g.studentId, g)
      }
    }
    return map
  }, [grades, selectedSubject])

  const selectedSubjectCode = selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject
  const selectedSubjectRecord = subjects.find(
    (subject) => subject.code === selectedSubjectCode || `${subject.code} - ${subject.name}` === selectedSubject
  )
  const selectedSubjectType: "Lecture" | "Lecture with Lab" =
    selectedSubjectRecord?.type === "Lecture with Lab" ? "Lecture with Lab" : "Lecture"
  const activeScheme = useMemo(() => {
    const configured = gradingSchemes.find((scheme) => scheme.isActive && scheme.subjectType === selectedSubjectType)
    if (configured) return configured
    return selectedSubjectType === "Lecture with Lab" ? DEFAULT_LAB_SCHEME : DEFAULT_LECTURE_SCHEME
  }, [gradingSchemes, selectedSubjectType])
  const activeTransmutationEntries = useMemo(() => {
    const exact = transmutationTables.find(
      (table) => table.isActive && table.subjectType === selectedSubjectType && table.entries.length > 0
    )
    const fallback = transmutationTables.find(
      (table) => table.isActive && table.subjectType === "All" && table.entries.length > 0
    )
    return exact?.entries ?? fallback?.entries ?? DEFAULT_TRANSMUTATION_ENTRIES
  }, [selectedSubjectType, transmutationTables])
  const columnSets = useMemo(() => buildColumnSets(activeScheme), [activeScheme])

  function handleReleaseAll() {
    if (subjectSections.length === 0 || !selectedSubject) return
    const label = `${selectedSubject} (${subjectSections.join(", ")})`
    model.setPendingConfirm({
      title: "Release All Grades",
      description: `Release all grades for ${label} to students? This will make them visible to students.`,
      variant: "default",
      confirmLabel: "Release",
      onConfirm: () => {
        for (const section of subjectSections) {
          releaseGradesForSection(section, selectedSubject)
        }
      },
    })
  }

  return (
    <Panel
      title="Manage Grades"
      className="[&>div:first-child]:hidden"
    >
      <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <ClipboardList className="size-8" />
        </div>
        <div>
          <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="size-4" />
            Subject Grade Encoding
          </p>
          <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            Manage Grades
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={downloadGradeTemplate} className="rounded-lg">
              <Download className="size-4" />
              Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReleaseAll}
              className="rounded-lg bg-card/80"
            >
              <Send className="size-4" />
              Release
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { label: "Assigned Subjects", value: String(facultySubjects.length), icon: BookMarked },
          { label: "Active Sections", value: String(subjectSections.length), icon: UsersRound },
          { label: "Students Listed", value: String(subjectRoster.length), icon: FileSpreadsheet },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Semester selector */}
      {scheduleSemesters.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookMarked className="size-4" />
            Semester
          </p>
          <div className="flex flex-wrap gap-2">
            {scheduleSemesters.map((sem) => {
              return (
                <Button
                  key={sem.id}
                  type="button"
                  variant={selectedSemesterId === sem.id ? "default" : "outline"}
                  onClick={() => {
                    setSelectedSemesterId(sem.id)
                    setSelectedSubject("")
                    setSelectedSection(null)
                  }}
                  className="rounded-xl"
                >
                  S.Y. {sem.schoolYearStart}-{sem.schoolYearEnd} &middot; {sem.semester}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Subject selector */}
      {selectedSemesterId && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookMarked className="size-4" />
            Subject
          </p>
          <div className="flex flex-wrap gap-2">
            {facultySubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects assigned for this semester.</p>
            ) : (
              facultySubjects.map((s) => (
                <Button
                  key={s.subject}
                  type="button"
                  variant={selectedSubject === s.subject ? "default" : "outline"}
                  onClick={() => {
                    setSelectedSubject(s.subject)
                    setSelectedSection(null)
                  }}
                  className="rounded-xl"
                >
                  {s.subject}
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Upload className="size-4" />
          Workbook Upload
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleGradeWorkbookUpload}
            className="h-10 rounded-lg"
          />
          <Button type="button" variant="outline" className="rounded-lg">
            <Upload className="size-4" />
            Upload Excel
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{uploadName}</p>
      </div>

      {/* Section selector */}
      {selectedSubject && subjectSections.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <UsersRound className="size-4" />
            Section
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedSection === null ? "default" : "outline"}
              onClick={() => setSelectedSection(null)}
              className="rounded-xl"
            >
              All Sections
            </Button>
            {subjectSections.map((s) => (
              <Button
                key={s}
                type="button"
                variant={selectedSection === s ? "default" : "outline"}
                onClick={() => setSelectedSection(s)}
                className="rounded-xl"
              >
                Section {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Student search */}
      {selectedSubject && subjectSections.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Search students by name..."
              className="h-9 rounded-xl pl-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Grade tables */}
      {selectedSubject && subjectSections.length > 0 ? (
        selectedSection === null ? (() => {
          const q = studentQuery.toLowerCase().trim()
          const visibleSections = subjectSections
            .map((section) => {
              let students = subjectRoster.filter((s) => s.section === section)
              if (q) {
                students = students.filter((s) => {
                  const displayName = s.lastName
                    ? `${s.lastName}, ${s.firstName ?? ""}${s.middleName ? ` ${s.middleName}` : ""}`
                    : s.name
                  return displayName.toLowerCase().includes(q)
                })
              }
              const sorted = [...students].sort((a, b) => {
                const aLast = a.lastName ?? a.name.split(" ").pop() ?? ""
                const bLast = b.lastName ?? b.name.split(" ").pop() ?? ""
                const cmp = aLast.localeCompare(bLast)
                if (cmp !== 0) return cmp
                const aFirst = a.firstName ?? a.name
                const bFirst = b.firstName ?? b.name
                return aFirst.localeCompare(bFirst)
              })
              return [section, sorted] as [string, typeof subjectRoster]
            })
            .filter(([, students]) => students.length > 0)
          if (visibleSections.length === 0) {
            return (
              <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] px-4 py-12 text-center text-sm text-muted-foreground">
                <GraduationCap className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                No students enrolled for this subject.
              </div>
            )
          }
          return (
            <div className="space-y-6">
              {visibleSections.map(([section, students]) => (
                <SectionTable
                  key={section}
                  section={section}
                  students={students}
                  gradeMap={gradeMap}
                  selectedSubject={selectedSubject}
                  updateGrade={updateGrade}
                  updateGradeRemarks={updateGradeRemarks}
                  setGrades={setGrades}
                  scheme={activeScheme}
                  columnSets={columnSets}
                  transmutationEntries={activeTransmutationEntries}
                />
              ))}
            </div>
          )
        })() : (() => {
          const students = filteredRosterBySection.find(([sec]) => sec === selectedSection)?.[1] ?? []
          return (
            <SectionTable
              section={selectedSection}
              students={students}
              gradeMap={gradeMap}
              selectedSubject={selectedSubject}
              updateGrade={updateGrade}
              updateGradeRemarks={updateGradeRemarks}
              setGrades={setGrades}
              scheme={activeScheme}
              columnSets={columnSets}
              transmutationEntries={activeTransmutationEntries}
            />
          )
        })()
      ) : (
        selectedSubject && (
          <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] px-4 py-12 text-center text-sm text-muted-foreground">
            <GraduationCap className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            No students enrolled for this subject.
          </div>
        )
      )}

    </Panel>
  )
}

function SectionTable({
  section,
  students,
  gradeMap,
  selectedSubject,
  updateGradeRemarks,
  setGrades,
  scheme,
  columnSets,
  transmutationEntries,
}: {
  section: string
  students: Array<{ id: string; name: string; section: string; enrolled?: boolean; firstName?: string; middleName?: string; lastName?: string }>
  gradeMap: Map<string, GradeRecord>
  selectedSubject: string
  updateGrade: (id: string, field: string, value: string) => void
  updateGradeRemarks: (id: string, value: string) => void
  setGrades: (updater: (prev: GradeRecord[]) => GradeRecord[]) => void
  scheme: GradingScheme
  columnSets: GradeColumnSet[]
  transmutationEntries: TransmutationEntry[]
}) {
  const storageKey = `faculty-grade-widths:${selectedSubject}:${section}:${scheme.id}`
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  useEffect(() => {
    let nextWidths: Record<string, number> = {}
    try {
      const raw = window.localStorage.getItem(storageKey)
      nextWidths = raw ? JSON.parse(raw) : {}
    } catch {
      nextWidths = {}
    }
    queueMicrotask(() => setColumnWidths(nextWidths))
  }, [storageKey])

  if (students.length === 0) {
    return (
      <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] px-4 py-12 text-center text-sm text-muted-foreground">
        <GraduationCap className="mx-auto mb-2 size-8 text-muted-foreground/50" />
        No students enrolled for this section.
      </div>
    )
  }

  const midtermColumns = columnSets.filter((set) => set.period === "midterm")
  const finalColumns = columnSets.filter((set) => set.period === "final")
  const resultColumns = ["midterm-result", "final-result", "final-grade", "transmuted", "remarks", "status"]

  function persistWidths(next: Record<string, number>) {
    setColumnWidths(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Ignore local storage failures.
    }
  }

  function widthFor(key: string, fallback: number) {
    return columnWidths[key] ?? fallback
  }

  function startResize(key: string, fallback: number, event: React.MouseEvent<HTMLSpanElement>) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = widthFor(key, fallback)

    function handleMove(moveEvent: MouseEvent) {
      const nextWidth = Math.max(76, startWidth + moveEvent.clientX - startX)
      persistWidths({ ...columnWidths, [key]: nextWidth })
    }

    function handleUp() {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
    }

    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)
  }

  function baseGradeFor(student: (typeof students)[number]): GradeRecord {
    const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    return {
      id: `GRD-${normalizeGradeKey(selectedSubject)}-${normalizeGradeKey(section)}-${normalizeGradeKey(student.id)}`,
      studentId: student.id,
      student: student.name,
      section: student.section,
      subject: selectedSubject,
      code: selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject,
      units: 3,
      scores: {},
      maxScores: {},
      released: false,
      workflowStatus: "Draft",
      gradingSchemeId: scheme.id,
      subjectType: scheme.subjectType,
      updatedAt: now,
    }
  }

  function syncGrade(record: GradeRecord, isNew: boolean) {
    fetch(isNew ? "/api/portal/grades" : `/api/portal/grades/${record.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch((error) => console.error(`Failed to sync grade ${record.id}:`, error))
  }

  function commitGrade(record: GradeRecord, isNew: boolean) {
    setGrades((current) => {
      const exists = current.some((grade) => grade.id === record.id)
      if (exists) {
        return current.map((grade) => (grade.id === record.id ? record : grade))
      }
      return [record, ...current]
    })
    syncGrade(record, isNew)
  }

  const prevSchemeIdRef = useRef(scheme.id)

  useEffect(() => {
    if (prevSchemeIdRef.current !== scheme.id && prevSchemeIdRef.current !== "") {
      for (const student of students) {
        const existing = gradeMap.get(student.id)
        if (existing) {
          const next = computeGradeRecord(existing, scheme, transmutationEntries, columnSets)
          commitGrade(next, false)
        }
      }
    }
    prevSchemeIdRef.current = scheme.id
  }, [scheme.id])

  function updateStudentScore(student: (typeof students)[number], column: GradeColumnSet, value: string) {
    const existing = gradeMap.get(student.id)
    const base = existing ?? baseGradeFor(student)
    const scores = { ...scoreMap(base) }
    const maxScores = { ...maxScoreMap(base) }
    const maxScore = maxScores[column.key] ?? 100
    const parsed = parseOptionalNumber(value)

    if (parsed === undefined) {
      delete scores[column.key]
    } else {
      scores[column.key] = clampScore(parsed, maxScore)
    }

    const next = computeGradeRecord(
      { ...base, scores, maxScores, updatedAt: new Date().toISOString() },
      scheme,
      transmutationEntries,
      columnSets
    )
    commitGrade(next, !existing)
  }

  function updateOverall(column: GradeColumnSet, value: string) {
    const parsed = parseOptionalNumber(value)
    for (const student of students) {
      const existing = gradeMap.get(student.id)
      const base = existing ?? baseGradeFor(student)
      const scores = { ...scoreMap(base) }
      const maxScores = { ...maxScoreMap(base) }

      if (parsed === undefined) {
        delete maxScores[column.key]
      } else {
        maxScores[column.key] = Math.max(1, parsed)
        if (scores[column.key] !== undefined) {
          scores[column.key] = clampScore(scores[column.key], maxScores[column.key])
        }
      }

      const next = computeGradeRecord(
        { ...base, scores, maxScores, updatedAt: new Date().toISOString() },
        scheme,
        transmutationEntries,
        columnSets
      )
      commitGrade(next, !existing)
    }
  }

  function overallValue(column: GradeColumnSet) {
    for (const student of students) {
      const value = gradeMap.get(student.id)?.maxScores?.[column.key]
      if (value !== undefined) return String(value)
    }
    return "100"
  }

  function renderResizableHeader(key: string, label: string, fallback: number, className = "", stickyLeft?: number) {
    return (
      <th
        className={`relative border-r border-border px-3 py-3 align-top text-xs font-semibold uppercase tracking-wide text-foreground/80 ${className}`}
        style={{ width: widthFor(key, fallback), minWidth: widthFor(key, fallback), ...(stickyLeft !== undefined ? { left: stickyLeft } : {}) }}
      >
        {label}
        <span
          aria-hidden="true"
          onMouseDown={(event) => startResize(key, fallback, event)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none"
        />
      </th>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Section {section}</p>
          <p className="mt-1 text-sm text-foreground">
            {scheme.name} - {scheme.subjectType}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1">{students.length} students</span>
          <span className="rounded-md bg-muted px-2 py-1">{columnSets.length} score columns</span>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-max table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: widthFor("no", 56) }} />
            <col style={{ width: widthFor("name", 240) }} />
            {columnSets.map((column) => (
              <col key={column.key} style={{ width: widthFor(column.key, 132) }} />
            ))}
            {resultColumns.map((key) => (
              <col key={key} style={{ width: widthFor(key, key === "remarks" ? 170 : 118) }} />
            ))}
          </colgroup>
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              {renderResizableHeader("no", "No.", 56, "sticky z-30 bg-muted", 0)}
              {renderResizableHeader("name", "Name", 240, "sticky z-30 bg-muted", widthFor("no", 56))}
              <th colSpan={midtermColumns.length} className="border-r border-border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-primary">
                Midterm Scores
              </th>
              <th colSpan={finalColumns.length} className="border-r border-border px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-primary">
                Final Scores
              </th>
              {renderResizableHeader("midterm-result", "Midterm %", 118)}
              {renderResizableHeader("final-result", "Tentative Final %", 118)}
              {renderResizableHeader("final-grade", "Final %", 118)}
              {renderResizableHeader("transmuted", "Transmuted", 118)}
              {renderResizableHeader("remarks", "Remarks", 170)}
              {renderResizableHeader("status", "Status", 118)}
            </tr>
            <tr className="border-b border-border">
              <th className="sticky z-30 border-r border-border bg-muted px-3 py-2" style={{ left: 0 }} />
              <th className="sticky z-30 border-r border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground" style={{ left: widthFor("no", 56) }}>
                Overall
              </th>
              {columnSets.map((column) => (
                <th
                  key={column.key}
                  className="border-r border-border bg-muted/80 px-2 py-2 align-top"
                  style={{ width: widthFor(column.key, 132), minWidth: widthFor(column.key, 132) }}
                >
                  <div className="space-y-1">
                    <p className="truncate text-xs font-semibold text-foreground" title={`${column.component} - ${column.category}`}>
                      {column.category}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {column.componentWeight}% / {column.categoryWeight}%
                    </p>
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      value={overallValue(column)}
                      onChange={(event) => updateOverall(column, event.target.value)}
                      className="h-8 rounded-md px-2 text-xs"
                    />
                  </div>
                </th>
              ))}
              {resultColumns.map((key) => (
                <th key={key} className="border-r border-border bg-muted/80 px-3 py-2" />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {students.map((student, index) => {
              const grade = gradeMap.get(student.id)

              function handleRemarks(value: string) {
                const g = gradeMap.get(student.id)
                if (g) {
                  updateGradeRemarks(g.id, value)
                  return
                }
                const next = { ...baseGradeFor(student), remarks: value }
                commitGrade(next, true)
              }

              return (
                <tr key={student.id} className="transition-colors hover:bg-muted/50">
                  <td className="sticky z-20 border-r border-border bg-card px-3 py-3 text-center text-sm text-muted-foreground" style={{ left: 0 }}>{index + 1}</td>
                  <td className="sticky z-20 border-r border-border bg-card px-3 py-3" style={{ left: widthFor("no", 56) }}>
                    <p className="font-medium text-foreground">
                      {student.lastName
                        ? `${student.lastName}, ${student.firstName ?? ""}${student.middleName ? ` ${student.middleName}` : ""}`
                        : student.name}
                    </p>
                  </td>

                  {columnSets.map((column) => {
                    const maxScore = grade?.maxScores?.[column.key] ?? 100
                    const value = grade?.scores?.[column.key]
                    return (
                      <td
                        key={column.key}
                        className="border-r border-border px-2 py-2"
                        style={{ width: widthFor(column.key, 132), minWidth: widthFor(column.key, 132) }}
                      >
                        <Input
                          type="number"
                          min="0"
                          max={maxScore}
                          step="any"
                          value={value !== undefined ? String(value) : ""}
                          onChange={(event) => updateStudentScore(student, column, event.target.value)}
                          className="h-9 rounded-md px-2"
                        />
                      </td>
                    )
                  })}

                  <td className="border-r border-border px-3 py-3 font-semibold text-foreground">
                    {toDisplayNumber(grade?.midtermGrade)}
                  </td>

                  <td className="border-r border-border px-3 py-3 font-semibold text-foreground">
                    {toDisplayNumber(grade?.tentativeFinalGrade)}
                  </td>

                  <td className="border-r border-border px-3 py-3 font-semibold text-foreground">
                    {toDisplayNumber(grade?.finalGrade)}
                  </td>

                  <td className="border-r border-border px-3 py-3 font-semibold text-foreground">
                    {toDisplayNumber(grade?.transmutedGrade)}
                  </td>

                  <td className="border-r border-border px-3 py-3">
                    <Select
                      value={grade?.remarks || "Passed"}
                      onChange={handleRemarks}
                      options={gradeRemarkOptions}
                    />
                  </td>

                  <td className="px-3 py-3">
                    <StatusBadge value={grade?.released ? "Released" : "Draft"} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
