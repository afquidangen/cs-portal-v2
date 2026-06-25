"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BookMarked, ClipboardList, FileSpreadsheet, GraduationCap,
  UsersRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { CurriculumRecord, GradeRecord } from "../../data/portal-data"
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
  }, [visibleSchedules, selectedSubject, selectedSemesterId])

  useEffect(() => {
    if (selectedSubject && subjectSections.length > 0) {
      const schedule = visibleSchedules.find(
        (s) => s.subject === selectedSubject && s.section === (selectedSection || subjectSections[0])
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

  const subjectRoster = useMemo(() => {
    if (subjectSections.length === 0) return []
    const sectionSet = new Set(selectedSection ? [selectedSection] : subjectSections)
    const deletedUsers = new Set(
      users
        .filter((u) => u.deletedAt)
        .map((u) => u.id)
    )
    return roster.filter((s) => {
      if (deletedUsers.has(s.id)) return false
      if (!s.enrolled) return false
      return sectionSet.has(s.section)
    })
  }, [roster, subjectSections, selectedSection, users])

  const filterSchedules = useMemo(() => {
    const semesterIds = new Set(visibleSchedules.map((s) => s.semesterId))
    return semesters.filter((sem) => semesterIds.has(sem.id))
  }, [visibleSchedules, semesters])

  const gradeMap = useMemo(() => {
    const map = new Map<string, GradeRecord>()
    if (!selectedSubject) return map
    for (const g of grades) {
      if (g.subject === selectedSubject) map.set(g.studentId, g)
    }
    return map
  }, [grades, selectedSubject])

  const gridData = useMemo(() => {
    const q = studentQuery.toLowerCase().trim()
    const sorted = [...subjectRoster]
      .sort((a, b) => {
        const aLast = a.lastName ?? a.name.split(" ").pop() ?? ""
        const bLast = b.lastName ?? b.name.split(" ").pop() ?? ""
        return aLast.localeCompare(bLast)
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
      <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <ClipboardList className="size-8" />
        </div>
        <div>
          <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="size-4" />
            Spreadsheet Grade Entry
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            E-Grades
          </h3>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { label: "Assigned Subjects", value: String(semesterSubjects.length), icon: BookMarked },
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

      {filterSchedules.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookMarked className="size-4" /> Semester
          </p>
          <div className="flex flex-wrap gap-2">
            {filterSchedules.map((sem) => (
              <Button key={sem.id} type="button"
                variant={selectedSemesterId === sem.id ? "default" : "outline"}
                onClick={() => { setSelectedSemesterId(sem.id); setSelectedSubject(""); setSelectedSection(null) }}
                className="rounded-xl">
                S.Y. {sem.schoolYearStart}-{sem.schoolYearEnd} &middot; {sem.semester}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedSemesterId && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookMarked className="size-4" /> Subject
          </p>
          <Select
            value={selectedSubject}
            onValueChange={(v) => { setSelectedSubject(v); setSelectedSection(null) }}
          >
            <SelectTrigger className="w-full rounded-xl">
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
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <UsersRound className="size-4" /> Section
          </p>
          <Select
            value={selectedSection ?? "all"}
            onValueChange={(v) => setSelectedSection(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Select section..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {subjectSections.map((s) => (
                <SelectItem key={s} value={s}>Section {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedSubject && subjectRoster.length === 0 ? (
        <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] px-4 py-8 text-center text-sm text-muted-foreground">
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
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
            <button type="button"
              onClick={() => setEgradesTab("gradesheet")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                egradesTab === "gradesheet"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-primary/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gradesheet
            </button>
            <button type="button"
              onClick={() => setEgradesTab("workbook")}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                egradesTab === "workbook"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-primary/50"
                  : "text-muted-foreground hover:text-foreground"
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
