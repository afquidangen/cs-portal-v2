"use client"

import { useMemo, useState } from "react"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit,
  GraduationCap,
  Layers3,
  ListChecks,
  Plus,
  RefreshCw,
  School,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { EmptyState, Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { CurriculumRecord, GradeRecord } from "../../data/portal-data"
import type { PortalModuleProps } from "./types"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────
   Student mode
   ────────────────────────────────────────────── */
function StudentCurriculumView({ model }: { model: NonNullable<PortalModuleProps["model"]> }) {
  const { curricula, grades, profile, users } = model
  const [activeTermIdx, setActiveTermIdx] = useState(0)

  const studentUser = users.find((u) => u.id === profile.id)
  const studentCurriculumName = studentUser?.curriculum

  const enrolledCurriculum = studentCurriculumName
    ? curricula.find(
        (c) =>
          c.id === studentUser?.curriculumId || c.name === studentCurriculumName
      )
    : curricula[0]

  const allTerms = enrolledCurriculum?.terms ?? []
  const studentGradeHistory = studentUser?.gradeHistory ?? []

  function getSubjectStatus(
    code: string,
    subjectName: string,
    year: string,
    semester: string
  ): { label: string; className: string } | null {
    const gradeRecord = grades.find(
      (g: GradeRecord) => g.studentId === profile.id && (g.code === code || g.subject === subjectName)
    )
    if (gradeRecord && gradeRecord.released) {
      const r = (gradeRecord.remarks ?? "").toLowerCase()
      if (r === "passed") return { label: "Passed", className: "text-green-600 dark:text-green-400" }
      if (r === "inc") return { label: "INC", className: "text-red-600 dark:text-red-400" }
      if (r === "dropped") return { label: "DRP", className: "text-amber-600 dark:text-amber-400" }
      if (r === "unofficial drop") return { label: "UDRP", className: "text-orange-600 dark:text-orange-400" }
      if (r === "failed") return { label: "Failed", className: "text-red-600 dark:text-red-400" }
      if ((gradeRecord.gradePercentage ?? 0) >= 75) return { label: "Passed", className: "text-green-600 dark:text-green-400" }
      return { label: "Failed", className: "text-red-600 dark:text-red-400" }
    }

    const historyEntry = studentGradeHistory.find(
      (h) => (h.subjectCode === code || h.subjectName === subjectName) && h.yearLevel === year && h.semester === semester
    )
    if (historyEntry) {
      const r = historyEntry.remarks.toUpperCase()
      if (r === "FAILED") {
        return { label: "FAILED", className: "text-red-600 dark:text-red-400" }
      }
      if (r === "INC") {
        return { label: "INC", className: "text-red-600 dark:text-red-400" }
      }
      if (r === "DROP") {
        return { label: "DRP", className: "text-amber-600 dark:text-amber-400" }
      }
      if (r === "UNOFFICIAL DROP") {
        return { label: "UDRP", className: "text-orange-600 dark:text-orange-400" }
      }
      return { label: "Passed", className: "text-green-600 dark:text-green-400" }
    }

    if (
      studentUser?.currentYearLevel === year &&
      studentUser?.currentSemester === semester
    ) {
      return { label: "Current", className: "text-blue-600 dark:text-blue-400" }
    }

    return null
  }

  function isRetake(code: string, subjectName: string): boolean {
    const matches = studentGradeHistory.filter(
      (h) => h.subjectCode === code || h.subjectName === subjectName
    )
    if (matches.length > 1) return true
    if (matches.length === 1) {
      const r = matches[0].remarks.toUpperCase()
      return ["FAILED", "INC", "DROP", "UNOFFICIAL DROP"].includes(r)
    }
    return false
  }

  const totalUnits = allTerms.reduce(
    (sum, t) => sum + t.subjects.reduce((s, sub) => s + sub.total, 0),
    0
  )
  const totalSubjects = allTerms.reduce((sum, t) => sum + t.subjects.length, 0)
  const activeTerm = allTerms[activeTermIdx]
  const curriculumYears = Array.from(new Set(allTerms.map((term) => term.year)))
  const selectedYear = activeTerm?.year ?? curriculumYears[0] ?? ""
  const semesterOptions = allTerms
    .filter((term) => term.year === selectedYear)
    .map((term) => term.semester)

  if (!enrolledCurriculum) {
    return (
      <Panel title="My Curriculum" eyebrow="Plan and guide">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GraduationCap className="mb-3 size-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No curriculum assigned yet. Contact your instructor.
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <GraduationCap className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <BookOpen className="size-4" />
              Academic Roadmap
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              My Curriculum
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Follow your program structure by year level and semester, with subject units and progress status.
            </p>
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Curriculum", value: enrolledCurriculum.name, icon: ClipboardList },
          { label: "Major", value: enrolledCurriculum.major, icon: School },
          { label: "Total Subjects", value: String(totalSubjects), icon: ListChecks },
          { label: "Total Units", value: String(totalUnits), icon: Layers3 },
        ].map((item) => {
          const Icon = item.icon

          return (
            <article key={item.label} className="edu-bg-soft-glacier rounded-2xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <p className="mt-2 truncate text-lg font-semibold text-foreground">{item.value}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </article>
          )
        })}
      </div>

      {/* Term selector */}
      <Panel
        title={`${enrolledCurriculum.name}`}
        eyebrow={`${enrolledCurriculum.major} · ${totalSubjects} subjects`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => model.refreshDashboardData()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        }
      >
        {allTerms.length === 0 ? (
          <EmptyState text="No terms available for this curriculum." />
        ) : (
          <div className="space-y-4">
            <div className="edu-bg-soft-glacier grid gap-3 rounded-xl border border-[var(--edu-border-glacier)] p-4 sm:grid-cols-2">
              <Select
                label="Year Level"
                value={selectedYear}
                onChange={(year) => {
                  const nextIndex = allTerms.findIndex((term) => term.year === year)
                  if (nextIndex >= 0) setActiveTermIdx(nextIndex)
                }}
                options={curriculumYears}
              />
              <Select
                label="Semester"
                value={activeTerm?.semester ?? ""}
                onChange={(semester) => {
                  const nextIndex = allTerms.findIndex(
                    (term) => term.year === selectedYear && term.semester === semester
                  )
                  if (nextIndex >= 0) setActiveTermIdx(nextIndex)
                }}
                options={semesterOptions}
              />
            </div>

            {activeTerm ? (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-muted text-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Code</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Lec</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Lab</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Units</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {activeTerm.subjects.map((subject, i) => {
                      const status = getSubjectStatus(subject.code, subject.name, activeTerm.year, activeTerm.semester)
                      return (
                        <tr key={`${subject.code}-${i}`} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium text-foreground">{subject.code}</td>
                          <td className="px-4 py-3 text-foreground/80">{subject.name}</td>
                          <td className="px-4 py-3 text-foreground/80">{subject.lec}</td>
                          <td className="px-4 py-3 text-foreground/80">{subject.lab}</td>
                          <td className="px-4 py-3 text-foreground/80">{subject.total}</td>
                          <td className="px-4 py-3">
                            {status ? (
                              <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", status.className)}>
                                {status.label === "Passed" ? (
                                  <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                ) : null}
                                {status.label}
                                {isRetake(subject.code, subject.name) && status.label === "Current" && (
                                  <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    RETAKE
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Admin mode
   ────────────────────────────────────────────── */
function AdminCurriculumView({ model }: { model: NonNullable<PortalModuleProps["model"]> }) {
  const {
    curricula,
    curriculumFilter,
    selectedCurriculumId,
    setCurriculumFilter,
    setSelectedCurriculumId,
    handleDeleteCurriculum,
    handleUpdateCurriculum,
    handleAddTermToCurriculum,
    handleDeleteTermFromCurriculum,
    handleAddSubjectToTerm,
    handleUpdateSubjectInTerm,
    handleDeleteSubjectFromTerm,
    handleAddCurriculum,
    newCurriculum,
    setNewCurriculum,
  } = model

  const [showAddForm, setShowAddForm] = useState(false)
  const [editCurr, setEditCurr] = useState<CurriculumRecord | null>(null)
  const [deleteCurrId, setDeleteCurrId] = useState<string | null>(null)
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)

  /* ── term & subject CRUD local state ── */
  const [addTermCurrId, setAddTermCurrId] = useState<string | null>(null)
  const [newTermYear, setNewTermYear] = useState("First Year")
  const [newTermSemester, setNewTermSemester] = useState("First Semester")

  const [deleteTermKey, setDeleteTermKey] = useState<{
    currId: string
    index: number
  } | null>(null)

  const [addSubjectKey, setAddSubjectKey] = useState<{
    currId: string
    termIndex: number
  } | null>(null)
  const [newSubjCode, setNewSubjCode] = useState("")
  const [newSubjName, setNewSubjName] = useState("")
  const [newSubjLec, setNewSubjLec] = useState("3")
  const [newSubjLab, setNewSubjLab] = useState("0")
  const [newSubjTotal, setNewSubjTotal] = useState("3")

  const [editSubjectKey, setEditSubjectKey] = useState<{
    currId: string
    termIndex: number
    subjectIndex: number
    code: string
    name: string
    lec: string
    lab: string
    total: string
  } | null>(null)

  const [deleteSubjectKey, setDeleteSubjectKey] = useState<{
    currId: string
    termIndex: number
    subjectIndex: number
  } | null>(null)

  const majors = ["All", ...Array.from(new Set(curricula.map((c) => c.major)))]

  const visibleCurricula =
    curriculumFilter === "All"
      ? curricula
      : curricula.filter((c) => c.major === curriculumFilter)

  const selectedCurriculum =
    curricula.find((c) => c.id === selectedCurriculumId) ?? visibleCurricula[0]

  const selectedTotalSubjects =
    selectedCurriculum?.terms.reduce((t, term) => t + term.subjects.length, 0) ?? 0

  const groupedYears = useMemo(() => {
    if (!selectedCurriculum) return []
    const grouped = selectedCurriculum.terms.reduce<
      Record<
        string,
        {
          year: string
          terms: typeof selectedCurriculum.terms
          totalUnits: number
          totalSubjects: number
        }
      >
    >((acc, term) => {
      if (!acc[term.year]) {
        acc[term.year] = {
          year: term.year,
          terms: [],
          totalUnits: 0,
          totalSubjects: 0,
        }
      }
      acc[term.year].terms.push(term)
      acc[term.year].totalUnits += term.subjects.reduce((s, sub) => s + sub.total, 0)
      acc[term.year].totalSubjects += term.subjects.length
      return acc
    }, {})
    return Object.values(grouped)
  }, [selectedCurriculum])

  const activeYearGroup = groupedYears[selectedYearIndex]

  return (
    <div key={selectedCurriculum?.id ?? "no-curriculum"} className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <ClipboardList className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <GraduationCap className="size-4" />
              Curriculum Management
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Curriculum
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage program structures, majors, year levels, terms, subjects, and total academic units.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Curricula", value: String(visibleCurricula.length), icon: ClipboardList },
          { label: "Selected Subjects", value: String(selectedTotalSubjects), icon: ListChecks },
          { label: "Year Levels", value: String(groupedYears.length), icon: Layers3 },
        ].map((item) => {
          const Icon = item.icon

          return (
            <article key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </article>
          )
        })}
      </div>

      {/* ── Add / List Curricula ── */}
      <Panel
        title={`Curriculum (${visibleCurricula.length})`}
        eyebrow="Filter by curriculum and major"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select
              value={curriculumFilter}
              onChange={(v) => {
                setCurriculumFilter(v)
                setSelectedYearIndex(0)
              }}
              options={majors}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        }
      >
        {showAddForm ? (
          <form
            onSubmit={(e) => {
              handleAddCurriculum(e)
              setShowAddForm(false)
            }}
            className="mb-5 space-y-4 rounded-2xl border border-border bg-muted/30 p-4"
          >
            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Curriculum ID</label>
                <Input
                  value={newCurriculum.id}
                  onChange={(e) =>
                    setNewCurriculum((s) => ({ ...s, id: e.target.value }))
                  }
                  placeholder="Auto-generated if empty"
                  className="h-10 rounded-2xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input
                  value={newCurriculum.name}
                  onChange={(e) =>
                    setNewCurriculum((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="New Curriculum"
                  className="h-10 rounded-2xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Major *</label>
                <Input
                  value={newCurriculum.major}
                  onChange={(e) =>
                    setNewCurriculum((s) => ({ ...s, major: e.target.value }))
                  }
                  placeholder="Major / Specialization"
                  className="h-10 rounded-2xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Total units</label>
                <Input
                  value={newCurriculum.totalUnits}
                  onChange={(e) =>
                    setNewCurriculum((s) => ({ ...s, totalUnits: e.target.value }))
                  }
                  placeholder="166"
                  className="h-10 rounded-2xl"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="rounded-2xl">
                  <Plus className="size-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Curr ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Curriculum</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Major</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Units</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visibleCurricula.map((curriculum) => (
                <tr
                  key={curriculum.id}
                  className={
                    curriculum.id === selectedCurriculum?.id
                      ? "cursor-pointer bg-muted transition-colors"
                      : "cursor-pointer transition-colors hover:bg-muted/50"
                  }
                  onClick={() => {
                    setSelectedCurriculumId(curriculum.id)
                    setSelectedYearIndex(0)
                  }}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{curriculum.id}</td>
                  <td className="px-4 py-3 text-foreground/80">{curriculum.name}</td>
                  <td className="px-4 py-3 text-foreground/80">{curriculum.major}</td>
                  <td className="px-4 py-3 text-foreground/80">{curriculum.totalUnits}</td>
                  <td className="px-4 py-3"><StatusBadge value={curriculum.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditCurr(curriculum)}>
                        <Edit className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDeleteCurrId(curriculum.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!visibleCurricula.length ? (
          <div className="mt-4">
            <EmptyState text="No curriculum matches the selected filter." />
          </div>
        ) : null}
      </Panel>

      {/* ── Curriculum Detail ── */}
      {selectedCurriculum ? (
        <Panel
          title={selectedCurriculum.name}
          eyebrow={`${selectedCurriculum.major} · ${selectedTotalSubjects} total subjects`}
          actions={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setAddTermCurrId(selectedCurriculum.id)
                setNewTermYear("First Year")
                setNewTermSemester("First Semester")
              }}
            >
              <Plus className="size-3.5" />
              Add Term
            </Button>
          }
        >
          {/* summary cards + year groups (same as before) */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-foreground/70">Curriculum ID</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{selectedCurriculum.id}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-foreground/70">Major</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{selectedCurriculum.major}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-foreground/70">Total Units</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{selectedCurriculum.totalUnits}</p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-foreground/70">Status</p>
              <div className="mt-2"><StatusBadge value={selectedCurriculum.status} /></div>
            </article>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="size-4 text-foreground/70" />
              <h4 className="font-semibold text-foreground">Curriculum Overview</h4>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {groupedYears.map((yearGroup, index) => (
                <button
                  key={yearGroup.year}
                  type="button"
                  onClick={() => setSelectedYearIndex(index)}
                  className={
                    index === selectedYearIndex
                      ? "rounded-2xl border border-primary bg-card p-4 text-left shadow-sm ring-1 ring-primary/20 transition-all"
                      : "rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-muted/40"
                  }
                >
                  <p className="text-sm text-foreground/70">{yearGroup.year}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {yearGroup.totalSubjects} subjects
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">{yearGroup.totalUnits} units</p>
                  <p className="mt-1 text-xs text-foreground/60">
                    {yearGroup.terms.length} term{yearGroup.terms.length > 1 ? "s" : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {activeYearGroup ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{activeYearGroup.year}</h4>
                  <p className="text-sm text-foreground/70">
                    {activeYearGroup.totalSubjects} subjects · {activeYearGroup.totalUnits} units
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedYearIndex((p) => Math.max(p - 1, 0))}
                    disabled={selectedYearIndex === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedYearIndex((p) => Math.min(p + 1, groupedYears.length - 1))}
                    disabled={selectedYearIndex === groupedYears.length - 1}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {activeYearGroup.terms.map((term) => {
                  const globalTermIndex = selectedCurriculum.terms.findIndex(
                    (t) => t.year === term.year && t.semester === term.semester
                  )

                  return (
                    <div
                      key={`${selectedCurriculum.id}-${term.year}-${term.semester}`}
                      className="rounded-2xl border border-border bg-card shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <div>
                          <h5 className="font-semibold text-foreground">{term.semester}</h5>
                          <p className="text-sm text-foreground/70">
                            {term.subjects.length} subjects ·{" "}
                            {term.subjects.reduce((s, sub) => s + sub.total, 0)} units
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => {
                              setAddSubjectKey({
                                currId: selectedCurriculum.id,
                                termIndex: globalTermIndex,
                              })
                              setNewSubjCode("")
                              setNewSubjName("")
                              setNewSubjLec("3")
                              setNewSubjLab("0")
                              setNewSubjTotal("3")
                            }}
                          >
                            <Plus className="size-3.5" />
                            Subject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() =>
                              setDeleteTermKey({
                                currId: selectedCurriculum.id,
                                index: globalTermIndex,
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-muted text-foreground">
                            <tr className="border-b border-border">
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Code</th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Lec</th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Lab</th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Units</th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {term.subjects.map((subject, sIdx) => (
                              <tr key={`${subject.code}-${sIdx}`} className="transition-colors hover:bg-muted/40">
                                <td className="px-4 py-3 font-medium text-foreground">{subject.code}</td>
                                <td className="px-4 py-3 text-foreground/80">{subject.name}</td>
                                <td className="px-4 py-3 text-foreground/80">{subject.lec}</td>
                                <td className="px-4 py-3 text-foreground/80">{subject.lab}</td>
                                <td className="px-4 py-3 text-foreground/80">{subject.total}</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl"
                                      onClick={() =>
                                        setEditSubjectKey({
                                          currId: selectedCurriculum.id,
                                          termIndex: globalTermIndex,
                                          subjectIndex: sIdx,
                                          code: subject.code,
                                          name: subject.name,
                                          lec: String(subject.lec),
                                          lab: String(subject.lab),
                                          total: String(subject.total),
                                        })
                                      }
                                    >
                                      <Edit className="size-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl"
                                      onClick={() =>
                                        setDeleteSubjectKey({
                                          currId: selectedCurriculum.id,
                                          termIndex: globalTermIndex,
                                          subjectIndex: sIdx,
                                        })
                                      }
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
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
            </div>
          ) : (
            <EmptyState text="No year level data available for this curriculum." />
          )}
        </Panel>
      ) : null}

      {/* ── Dialogs ── */}

      {/* Edit Curriculum */}
      <Dialog open={!!editCurr} onOpenChange={(o) => !o && setEditCurr(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Edit Curriculum</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Update curriculum details</DialogDescription>
          </DialogHeader>
          {editCurr ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input value={editCurr.name} onChange={(e) => setEditCurr({ ...editCurr, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Major</label>
                  <Input value={editCurr.major} onChange={(e) => setEditCurr({ ...editCurr, major: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Total units</label>
                  <Input value={String(editCurr.totalUnits)} onChange={(e) => setEditCurr({ ...editCurr, totalUnits: Number(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select value={editCurr.status} onChange={(v) => setEditCurr({ ...editCurr, status: v as "Active" | "Archived" })} options={["Active", "Archived"]} />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => { if (editCurr) handleUpdateCurriculum(editCurr); setEditCurr(null) }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Curriculum */}
      <Dialog open={!!deleteCurrId} onOpenChange={(o) => !o && setDeleteCurrId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Curriculum</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => { if (deleteCurrId) handleDeleteCurriculum(deleteCurrId); setDeleteCurrId(null) }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Term */}
      <Dialog open={!!addTermCurrId} onOpenChange={(o) => !o && setAddTermCurrId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Add Term</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Add a new term to the curriculum</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Year level</label>
              <Select value={newTermYear} onChange={setNewTermYear} options={["First Year", "Second Year", "Third Year", "Fourth Year"]} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Semester</label>
              <Select value={newTermSemester} onChange={setNewTermSemester} options={["First Semester", "Second Semester", "Midyear"]} />
            </div>
          </div>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              if (addTermCurrId) {
                handleAddTermToCurriculum(addTermCurrId, newTermYear, newTermSemester)
                setAddTermCurrId(null)
              }
            }}>
              <Plus className="mr-1.5 size-4" /> Add Term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Term */}
      <Dialog open={!!deleteTermKey} onOpenChange={(o) => !o && setDeleteTermKey(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Term</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">This will remove the term and all its subjects.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => {
              if (deleteTermKey) {
                handleDeleteTermFromCurriculum(deleteTermKey.currId, deleteTermKey.index)
                setDeleteTermKey(null)
              }
            }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject to Term */}
      <Dialog open={!!addSubjectKey} onOpenChange={(o) => !o && setAddSubjectKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Add Subject</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Add a subject to this term</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Code *</label>
                <Input value={newSubjCode} onChange={(e) => setNewSubjCode(e.target.value)} placeholder="CS311" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input value={newSubjName} onChange={(e) => setNewSubjName(e.target.value)} placeholder="Web Systems and Technologies" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lec</label>
                <Select value={newSubjLec} onChange={setNewSubjLec} options={["0", "1", "2", "3", "4", "5"]} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lab</label>
                <Select value={newSubjLab} onChange={setNewSubjLab} options={["0", "1", "2", "3", "4", "5"]} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Total units</label>
                <Input value={newSubjTotal} onChange={(e) => setNewSubjTotal(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              if (addSubjectKey && newSubjCode.trim() && newSubjName.trim()) {
                handleAddSubjectToTerm(addSubjectKey.currId, addSubjectKey.termIndex, {
                  code: newSubjCode.trim().toUpperCase(),
                  name: newSubjName.trim(),
                  lec: Number(newSubjLec) || 0,
                  lab: Number(newSubjLab) || 0,
                  total: Number(newSubjTotal) || 0,
                })
                setAddSubjectKey(null)
              }
            }}>
              <Plus className="mr-1.5 size-4" /> Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject in Term */}
      <Dialog open={!!editSubjectKey} onOpenChange={(o) => !o && setEditSubjectKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Edit Subject</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Update subject details</DialogDescription>
          </DialogHeader>
          {editSubjectKey ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Code</label>
                  <Input value={editSubjectKey.code} onChange={(e) => setEditSubjectKey({ ...editSubjectKey, code: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <Input value={editSubjectKey.name} onChange={(e) => setEditSubjectKey({ ...editSubjectKey, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Lec</label>
                  <Select value={editSubjectKey.lec} onChange={(v) => setEditSubjectKey({ ...editSubjectKey, lec: v })} options={["0", "1", "2", "3", "4", "5"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Lab</label>
                  <Select value={editSubjectKey.lab} onChange={(v) => setEditSubjectKey({ ...editSubjectKey, lab: v })} options={["0", "1", "2", "3", "4", "5"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Total units</label>
                  <Input value={editSubjectKey.total} onChange={(e) => setEditSubjectKey({ ...editSubjectKey, total: e.target.value })} />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              if (editSubjectKey) {
                handleUpdateSubjectInTerm(editSubjectKey.currId, editSubjectKey.termIndex, editSubjectKey.subjectIndex, {
                  code: editSubjectKey.code.trim().toUpperCase(),
                  name: editSubjectKey.name.trim(),
                  lec: Number(editSubjectKey.lec) || 0,
                  lab: Number(editSubjectKey.lab) || 0,
                  total: Number(editSubjectKey.total) || 0,
                })
                setEditSubjectKey(null)
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject from Term */}
      <Dialog open={!!deleteSubjectKey} onOpenChange={(o) => !o && setDeleteSubjectKey(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Subject</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Remove this subject from the term.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => {
              if (deleteSubjectKey) {
                handleDeleteSubjectFromTerm(deleteSubjectKey.currId, deleteSubjectKey.termIndex, deleteSubjectKey.subjectIndex)
                setDeleteSubjectKey(null)
              }
            }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Exported component
   ────────────────────────────────────────────── */
export function CurriculumModule({ model }: PortalModuleProps) {
  if (model.role === "student") return <StudentCurriculumView model={model} />
  return <AdminCurriculumView model={model} />
}
