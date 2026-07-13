"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookMarked, FileSpreadsheet, GraduationCap,
  UsersRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeRecord, ClassStudent } from "../../data/portal-data"
import { getSubjectRoster } from "../../lib/subject-roster"
import type { GradeColumn, Assessment } from "@/lib/types"
import { SpreadsheetGrid } from "../grades/spreadsheet-grid"
import { GradingWorkbookTab } from "../grades/grading-workbook-tab"

export function ManageGradesModule({ model, darkMode }: PortalModuleProps & { darkMode: boolean }) {
  const { grades, setGrades, roster, users, visibleSchedules, semesters, curricula } = model

  const [selectedSemesterId, setSelectedSemesterId] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [studentQuery, setStudentQuery] = useState("")
  const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [gradingScheme, setGradingScheme] = useState<{
    name: string
    components: Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number }> }>
    labComponents?: Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number }> }>
    lectureWeight?: number
    laboratoryWeight?: number
    subjectType: "Lecture" | "Lecture with Lab"
  } | null>(null)
  const [classId, setClassId] = useState("")
  const [computedOnce, setComputedOnce] = useState(false)
  const [activeTab, setActiveTab] = useState<"midterm" | "final" | "summary">("midterm")
  const [egradesTab, setEgradesTab] = useState<"gradesheet" | "workbook">("gradesheet")
  const prevSchemeIdRef = useRef<string | null>(null)

  const semesterSubjects = useMemo(() => {
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
      .filter((s): s is string => !!s)
  }, [visibleSchedules, selectedSubject, selectedSemesterId])

  const scheduleBySection = useMemo(() => {
    const map = new Map<string, string>()
    if (!selectedSubject) return map
    for (const s of visibleSchedules) {
      if (s.subject !== selectedSubject) continue
      if (selectedSemesterId && s.semesterId !== selectedSemesterId) continue
      if (!map.has(s.section)) map.set(s.section, s.id)
    }
    return map
  }, [visibleSchedules, selectedSubject, selectedSemesterId])

  useEffect(() => {
    if (selectedSubject && subjectSections.length > 0) {
      const schedule = visibleSchedules.find(
        (s) => s.subject === selectedSubject &&         s.section === selectedSection
      )
      if (schedule) setClassId(schedule.id)
    }
  }, [selectedSubject, selectedSection, subjectSections, visibleSchedules])

  useEffect(() => {
    if (!classId) return
    Promise.all([
      fetch(`/api/portal/grades/class/${classId}`).then((r) => r.json()),
      fetch("/api/portal/grading-schemes").then((r) => r.json()),
    ])
      .then(([gradesJson, schemesJson]) => {
        if (gradesJson.data?.columns) setGradeColumns(gradesJson.data.columns)
        if (gradesJson.data?.assessments) setAssessments(gradesJson.data.assessments)
        if (gradesJson.data?.grades) {
          setGrades((prev) => {
            const filtered = prev.filter((g) => g.classId !== classId)
            return [...filtered, ...gradesJson.data.grades]
          })
        }
        const code = selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject
        const gradeTypes = new Set(gradesJson.data?.grades?.map((g: { subjectType: string }) => g.subjectType) ?? [])
        let st: string
        if (curricula && curricula.length > 0) {
          const foundLab = curricula.some((c) =>
            c.terms.some((t) =>
              t.subjects.some((s) =>
                s.lab > 0 && ((s.code && code.includes(s.code)) || (s.name && code.includes(s.name)))
              )
            )
          )
          st = foundLab ? "Lecture with Lab" : "Lecture"
        } else {
          st = gradeTypes.size === 1 ? (gradeTypes.values().next().value as string) : "Lecture"
        }
        const schemes: Array<Record<string, unknown>> = schemesJson.data ?? []
        const activeScheme = schemes.find((s) => s.isActive && (s as { subjectType: string }).subjectType === st)
          ?? schemes.find((s) => s.isActive)
        if (activeScheme) {
          prevSchemeIdRef.current = (activeScheme as { id: string }).id ?? null
          setGradingScheme(activeScheme as typeof gradingScheme)
        }
      })
      .catch(() => {})
  }, [classId, selectedSubject, curricula, setGrades])

  const prevActiveModuleRef = useRef(model.activeModule)

  const refreshOnSchemeChange = useCallback(async () => {
    if (!classId) return
    try {
      const res = await fetch("/api/portal/grading-schemes")
      const json = await res.json()
      const schemes: Array<Record<string, unknown>> = json.data ?? []
      const code = selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject
      let st: string
      if (curricula && curricula.length > 0) {
        const foundLab = curricula.some((c) =>
          c.terms.some((t) =>
            t.subjects.some((s) =>
              s.lab > 0 && ((s.code && code.includes(s.code)) || (s.name && code.includes(s.name)))
            )
          )
        )
        st = foundLab ? "Lecture with Lab" : "Lecture"
      } else {
        st = "Lecture"
      }
      const active = schemes.find((s) => s.isActive && (s as Record<string, string>).subjectType === st)
        ?? schemes.find((s) => s.isActive)
      if (!active) return
      const newId = (active as Record<string, string>).id
      if (prevSchemeIdRef.current && prevSchemeIdRef.current !== newId) {
        setGradingScheme(active as typeof gradingScheme)
        await fetch("/api/portal/grades/compute", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, gradingPeriod: "midterm" }),
        })
        await fetch("/api/portal/grades/compute", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, gradingPeriod: "final" }),
        })
        const gRes = await fetch(`/api/portal/grades/class/${classId}`)
        const gJson = await gRes.json()
        if (gJson.data?.columns) setGradeColumns(gJson.data.columns)
        if (gJson.data?.grades) {
          setGrades((prev) => {
            const filtered = prev.filter((g) => g.classId !== classId)
            return [...filtered, ...gJson.data.grades]
          })
        }
      }
      prevSchemeIdRef.current = newId
    } catch { /* poll silently */ }
  }, [classId, selectedSubject, curricula, setGradeColumns, setGrades, setGradingScheme])

  useEffect(() => {
    if (!classId) return
    const onFocus = () => refreshOnSchemeChange()
    const onVisibility = () => { if (document.visibilityState === "visible") refreshOnSchemeChange() }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onFocus)
    const interval = setInterval(refreshOnSchemeChange, 60000)
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("focus", onFocus); clearInterval(interval) }
  }, [classId, refreshOnSchemeChange])

  useEffect(() => {
    if (prevActiveModuleRef.current !== "manage-grades" && model.activeModule === "manage-grades") {
      refreshOnSchemeChange()
    }
    prevActiveModuleRef.current = model.activeModule
  }, [model.activeModule, refreshOnSchemeChange])

  const gradeMap = useMemo(() => {
    const map = new Map<string, GradeRecord>()
    if (!selectedSubject) return map
    const sectionSet = new Set(subjectSections)
    for (const g of grades) {
      if (g.subject !== selectedSubject) continue
      if (!sectionSet.has(g.section ?? "")) continue
      map.set(g.studentId, g)
    }
    return map
  }, [grades, selectedSubject, subjectSections])

  const filterSchedules = useMemo(() => {
    const semesterIds = new Set(visibleSchedules.map((s) => s.semesterId))
    return semesters.filter((sem) => semesterIds.has(sem.id))
  }, [visibleSchedules, semesters])

  const subjectRoster = useMemo(() => {
    if (subjectSections.length === 0) return []
    const code = selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject
    return getSubjectRoster({
      roster,
      grades,
      users,
      subject: selectedSubject,
      subjectCode: code,
      section: selectedSection,
      sections: subjectSections,
    })
  }, [roster, grades, users, selectedSubject, selectedSection, subjectSections])

  const gridData = useMemo(() => {
    const q = studentQuery.toLowerCase().trim()
    const sorted = [...subjectRoster]
      .sort((a, b) => {
        const aLast = a.lastName ?? a.name.split(" ").pop() ?? ""
        const bLast = b.lastName ?? b.name.split(" ").pop() ?? ""
        const lastCmp = aLast.localeCompare(bLast)
        if (lastCmp !== 0) return lastCmp
        const aFirst = a.firstName ?? a.name.split(" ")[0] ?? ""
        const bFirst = b.firstName ?? b.name.split(" ")[0] ?? ""
        const firstCmp = aFirst.localeCompare(bFirst)
        if (firstCmp !== 0) return firstCmp
        return a.id.localeCompare(b.id)
      })
      .filter((student) => {
        if (!q) return true
        const displayName = student.lastName
          ? `${student.lastName}, ${student.firstName ?? ""}${student.middleName ? ` ${student.middleName}` : ""}`
          : student.name
        return displayName.toLowerCase().includes(q)
      })

    return sorted.map((student, index) => {
      const grade = gradeMap.get(student.id)
      const scores = (grade?.scores as Record<string, number>) || {}
      return {
        no: index + 1,
        studentId: student.id,
        studentName: student.lastName
          ? `${student.lastName}, ${student.firstName ?? ""}${student.middleName ? ` ${student.middleName}` : ""}`
          : student.name,
        section: student.section,
        gradeId: grade?.id,
        scores,
        midtermGrade: grade?.midtermGrade,
        midtermTransmuted: grade?.midtermTransmuted,
        finalGrade: grade?.finalGrade,
        finalTransmuted: grade?.finalTransmuted,
        transmutedGrade: grade?.transmutedGrade,
        remarks: grade?.remarks,
        midtermRemarks: grade?.midtermRemarks,
        finalRemarks: grade?.finalRemarks,
        midtermReleased: grade?.midtermReleased,
        finalReleased: grade?.finalReleased,
        midtermReleaseHistory: grade?.midtermReleaseHistory,
        finalReleaseHistory: grade?.finalReleaseHistory,
        workflowStatus: grade?.workflowStatus || "Draft",
      }
    })
  }, [subjectRoster, gradeMap, studentQuery])

  if (model.role !== "faculty") {
    return (
      <Panel title="Manage Grades">
        <p className="text-sm text-muted-foreground">Only faculty members can manage grades.</p>
      </Panel>
    )
  }

  return (
    <Panel title="Manage Grades" className="[&>div:first-child]:hidden">
      <div className="mb-5 flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">E-Grades</h1>
          <p className="mt-2 text-sm text-slate-600">Select a term, subject, and section to manage grades in the spreadsheet.</p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Assigned Subjects", value: String(semesterSubjects.length), icon: BookMarked },
          { label: "Active Sections", value: String(subjectSections.length), icon: UsersRound },
          { label: "Students Listed", value: String(subjectRoster.length), icon: FileSpreadsheet },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filterSchedules.length > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <BookMarked className="size-4" /> Semester
          </p>
          <div className="flex flex-wrap gap-2">
            {filterSchedules.map((sem) => (
              <Button key={sem.id} type="button"
                variant={selectedSemesterId === sem.id ? "default" : "outline"}
                onClick={() => { setSelectedSemesterId(sem.id); setSelectedSubject(""); setSelectedSection(null) }}
                className="h-9 rounded-md border-slate-200 text-xs">
                S.Y. {sem.schoolYearStart}-{sem.schoolYearEnd} &middot; {sem.semester}
              </Button>
            ))}
          </div>
        </div>
      )}

      {(selectedSemesterId || selectedSubject) && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {selectedSemesterId && (
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <BookMarked className="size-4" /> Subject
                </p>
                <Select
                  value={selectedSubject}
                  onValueChange={(v) => {
                  setSelectedSubject(v)
                  const firstSection = visibleSchedules
                    .filter((s) => s.subject === v && (!selectedSemesterId || s.semesterId === selectedSemesterId))
                    .map((s) => s.section)
                    .find(Boolean)
                  setSelectedSection(firstSection ?? null)
                }}
                >
                  <SelectTrigger className="h-10 w-full rounded-md border-slate-200 bg-white">
                    <SelectValue placeholder={semesterSubjects.length === 0 ? "No subjects assigned" : "Select a subject..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterSubjects.map((s) => (
                      <SelectItem key={s.subject} value={s.subject}>{s.subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedSubject && (
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <UsersRound className="size-4" /> Section
                </p>
                <Select
                  value={selectedSection ?? ""}
                  onValueChange={(v) => setSelectedSection(v)}
                >
                  <SelectTrigger className="h-10 w-full rounded-md border-slate-200 bg-white">
                    <SelectValue placeholder="Select section..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectSections.map((s) => (
                      <SelectItem key={s} value={s}>Section {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSubject && subjectRoster.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
          <GraduationCap className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          <p className="font-medium">No students found</p>
          <p className="mt-1">
            {subjectSections.length === 0
              ? `No sections found for "${selectedSubject}". Check if schedules exist.`
              : `Roster has ${roster.length} student(s), subject sections: [${subjectSections.join(", ")}]${selectedSection ? `, selected: "${selectedSection}"` : ""}. No roster entries match these sections.`}
          </p>
        </div>
      ) : selectedSubject && classId ? (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button type="button"
              onClick={() => setEgradesTab("gradesheet")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                egradesTab === "gradesheet"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-blue-400 dark:ring-slate-600"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
              }`}
            >
              Gradesheet
            </button>
            <button type="button"
              onClick={() => setEgradesTab("workbook")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                egradesTab === "workbook"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-blue-400 dark:ring-slate-600"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-700/70 dark:hover:text-slate-100"
              }`}
            >
              Grading Workbook
            </button>
          </div>
          {egradesTab === "gradesheet" ? (
            <SpreadsheetGrid
              model={model}
              selectedSubject={selectedSubject}
              classId={classId}
              gradeColumns={gradeColumns}
              setGradeColumns={setGradeColumns}
              gridData={gridData}
              gradeMap={gradeMap}
              setGrades={setGrades}
              roster={roster}
              subjectRoster={subjectRoster}
              studentQuery={studentQuery}
              setStudentQuery={setStudentQuery}
              computedOnce={computedOnce}
              setComputedOnce={setComputedOnce}
              darkMode={darkMode}
              assessments={assessments}
              gradingScheme={gradingScheme}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              section={selectedSection}
            />
          ) : (
            <GradingWorkbookTab
              classId={classId}
              gradingScheme={gradingScheme}
            />
          )}
        </div>
      ) : selectedSubject ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Loading class data...
        </div>
      ) : null}
    </Panel>
  )
}
