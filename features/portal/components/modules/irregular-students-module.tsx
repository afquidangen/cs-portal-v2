"use client"

import { useMemo, useState } from "react"
import {
  BookMarked,
  ClipboardList,
  GraduationCap,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundSearch,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { GradeHistoryEntry } from "../../data/portal-data"
import type { PortalModuleProps } from "./types"

const irregularTypes = ["Irregular", "Transferee", "Shifter"]

function getStudentTypeColor(type?: string) {
  if (type === "Irregular") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100"
  if (type === "Transferee") return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100"
  if (type === "Shifter") return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/25 dark:bg-purple-500/10 dark:text-purple-100"
  return ""
}

export function IrregularStudentsModule({ model }: PortalModuleProps) {
  const {
    users,
    curricula,
    yearSections,
    handleAddGradeHistory,
    handleUpdateGradeHistory,
    handleRemoveGradeHistory,
    handleUpsertCompletedGrade,
    handleDeleteCompletedGrade,
  } = model

  const [search, setSearch] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [gradeDialog, setGradeDialog] = useState<{
    mode: "add" | "edit"
    subjectCode: string
    subjectName: string
    yearLevel: string
    semester: string
    section?: string
    index?: number
  } | null>(null)
  const [customDialog, setCustomDialog] = useState(false)
  const [gradeForm, setGradeForm] = useState({
    subjectCode: "",
    subjectName: "",
    finalPercentile: "",
    remarks: "Passed",
    section: "",
    units: 3,
  })

  const irregularStudents = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "student" &&
          u.studentType &&
          irregularTypes.includes(u.studentType)
      ),
    [users]
  )

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase()
    return irregularStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    )
  }, [irregularStudents, search])

  const selectedStudent = useMemo(
    () => users.find((u) => u.id === selectedStudentId) ?? null,
    [users, selectedStudentId]
  )

  const studentCurriculum = useMemo(() => {
    if (!selectedStudent) return null
    return (
      curricula.find((c) => c.id === selectedStudent.curriculumId) ?? null
    )
  }, [selectedStudent, curricula])

  const gradeHistory = selectedStudent?.gradeHistory ?? []

  function getSubjectStatus(
    code: string,
    name: string,
    year: string,
    semester: string
  ): "pending" | "passed" | "failed" {
    const entry = gradeHistory.find(
      (g) =>
        g.subjectCode === code &&
        g.yearLevel === year &&
        g.semester === semester
    )
    if (!entry) return "pending"
    if (entry.remarks?.toLowerCase() === "passed") return "passed"
    return "failed"
  }

  function handleMarkSubject(code: string, name: string, year: string, semester: string) {
    const existing = gradeHistory.findIndex(
      (g) =>
        g.subjectCode === code &&
        g.yearLevel === year &&
        g.semester === semester
    )
    if (existing !== -1) {
      const entry = gradeHistory[existing]
      setGradeForm({
        subjectCode: entry.subjectCode,
        subjectName: entry.subjectName,
        finalPercentile: String(entry.finalPercentile ?? ""),
        remarks: entry.remarks ?? "Passed",
        section: entry.section ?? "",
      })
      setGradeDialog({ mode: "edit", subjectCode: code, subjectName: name, yearLevel: year, semester, section: entry.section ?? "", index: existing })
    } else {
      setGradeForm({ subjectCode: code, subjectName: name, finalPercentile: "75", remarks: "Passed", section: "" })
      setGradeDialog({ mode: "add", subjectCode: code, subjectName: name, yearLevel: year, semester })
    }
  }

  function handleSaveGrade() {
    if (!selectedStudent) return
    const percentile = Number(gradeForm.finalPercentile)
    if (Number.isNaN(percentile)) return

    const transmuted = percentile >= 97 ? 1.0 : percentile >= 94 ? 1.25 : percentile >= 91 ? 1.5 : percentile >= 88 ? 1.75 : percentile >= 85 ? 2.0 : percentile >= 82 ? 2.25 : percentile >= 79 ? 2.5 : percentile >= 76 ? 2.75 : 3.0

    const curriculumSubject = studentCurriculum?.terms
      .flatMap((t) => t.subjects)
      .find((s) => s.code === gradeForm.subjectCode)

    const entry: GradeHistoryEntry = {
      subjectCode: gradeForm.subjectCode,
      subjectName: gradeForm.subjectName,
      finalPercentile: percentile,
      transmutedGrade: transmuted,
      remarks: gradeForm.remarks,
      curriculumId: selectedStudent.curriculumId ?? "",
      yearLevel: gradeDialog?.yearLevel ?? "",
      semester: gradeDialog?.semester ?? "",
      section: gradeForm.section || gradeDialog?.section || undefined,
      units: curriculumSubject?.total ?? gradeForm.units,
    }

    if (gradeDialog?.mode === "edit" && gradeDialog.index !== undefined) {
      handleUpdateGradeHistory(selectedStudent.id, gradeDialog.index, entry)
    } else {
      handleAddGradeHistory(selectedStudent.id, entry)
    }

    handleUpsertCompletedGrade(
      selectedStudent.id,
      selectedStudent.name,
      gradeForm.subjectCode,
      gradeForm.subjectName,
      percentile,
      gradeForm.remarks,
      selectedStudent.curriculumId ?? ""
    )

    setGradeDialog(null)
    setGradeForm({ subjectCode: "", subjectName: "", finalPercentile: "", remarks: "Passed", section: "", units: 3 })
  }

  function handleSaveCustom() {
    if (!selectedStudent) return
    if (!gradeForm.subjectCode || !gradeForm.subjectName) return
    const percentile = Number(gradeForm.finalPercentile)
    if (Number.isNaN(percentile)) return

    const transmuted = percentile >= 97 ? 1.0 : percentile >= 94 ? 1.25 : percentile >= 91 ? 1.5 : percentile >= 88 ? 1.75 : percentile >= 85 ? 2.0 : percentile >= 82 ? 2.25 : percentile >= 79 ? 2.5 : percentile >= 76 ? 2.75 : 3.0

    const entry: GradeHistoryEntry = {
      subjectCode: gradeForm.subjectCode,
      subjectName: gradeForm.subjectName,
      finalPercentile: percentile,
      transmutedGrade: transmuted,
      remarks: gradeForm.remarks,
      curriculumId: selectedStudent.curriculumId ?? "",
      yearLevel: selectedStudent.currentYearLevel ?? "",
      semester: selectedStudent.currentSemester ?? "",
      section: gradeForm.section || undefined,
      units: gradeForm.units,
    }

    handleAddGradeHistory(selectedStudent.id, entry)

    handleUpsertCompletedGrade(
      selectedStudent.id,
      selectedStudent.name,
      gradeForm.subjectCode,
      gradeForm.subjectName,
      percentile,
      gradeForm.remarks,
      selectedStudent.curriculumId ?? ""
    )

    setCustomDialog(false)
    setGradeForm({ subjectCode: "", subjectName: "", finalPercentile: "", remarks: "Passed", section: "", units: 3 })
  }

  function handleRemoveGrade(index: number) {
    if (!selectedStudent) return
    const entry = selectedStudent.gradeHistory?.[index]
    handleRemoveGradeHistory(selectedStudent.id, index)
    if (entry) {
      handleDeleteCompletedGrade(selectedStudent.id, entry.subjectCode)
    }
  }

  function openAddCustom() {
    setGradeForm({ subjectCode: "", subjectName: "", finalPercentile: "75", remarks: "Passed", units: 3 })
    setCustomDialog(true)
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <UserRoundSearch className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <GraduationCap className="size-4" />
              Curriculum Progress Review
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Irregular Students
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review non-regular student records, track completed subjects, and manage curriculum progress by term.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Irregular Students", value: irregularStudents.filter((s) => s.studentType === "Irregular").length, icon: ClipboardList, tone: "Irregular" },
          { label: "Transferees", value: irregularStudents.filter((s) => s.studentType === "Transferee").length, icon: Users, tone: "Transferee" },
          { label: "Shifters", value: irregularStudents.filter((s) => s.studentType === "Shifter").length, icon: Layers3, tone: "Shifter" },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className={`rounded-2xl border p-4 shadow-sm ${getStudentTypeColor(item.tone)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-80">{item.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight">{item.value}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white/45 shadow-sm dark:bg-white/10">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Student list panel */}
        <Panel
          title="Non-Regular Students"
          eyebrow={`${filteredStudents.length} students`}
          className="lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto"
          actions={
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="h-9 rounded-xl pl-9 text-sm"
              />
            </div>
          }
        >
          <div className="space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No non-regular students found.</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left transition-all",
                    selectedStudentId === student.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{student.id}</p>
                    </div>
                    {student.studentType ? (
                      <StatusBadge value={student.studentType} />
                    ) : null}
                  </div>
                  {student.curriculum ? (
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      {student.curriculum}
                    </p>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Panel>

        {/* Curriculum editor panel */}
        <Panel
          title={
            selectedStudent
              ? `${selectedStudent.name} \u2022 Curriculum`
              : "Curriculum Editor"
          }
          eyebrow={
            selectedStudent
              ? `${selectedStudent.id} \u2022 ${selectedStudent.currentYearLevel ?? "N/A"} \u2022 ${selectedStudent.currentSemester ?? "N/A"}`
              : "Select a student to manage their curriculum progress"
          }
        >
          {!selectedStudent || !studentCurriculum ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="mb-3 size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {!selectedStudent
                  ? "Select a student from the list to manage their curriculum."
                  : "No curriculum assigned to this student."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student info cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Curriculum</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{studentCurriculum.name}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completed Subjects</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {gradeHistory.filter((g) => g.remarks?.toLowerCase() === "passed").length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Student Type</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedStudent.studentType ?? "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Year / Semester</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedStudent.currentYearLevel ?? "—"} / {selectedStudent.currentSemester ?? "—"}
                  </p>
                </div>
              </div>

              {/* Curriculum terms */}
              {studentCurriculum.terms.map((term) => {
                const passedInTerm = gradeHistory.filter(
                  (g) => g.yearLevel === term.year && g.semester === term.semester && g.remarks?.toLowerCase() === "passed"
                ).length

                return (
                  <div key={`${term.year}-${term.semester}`} className="rounded-2xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-3 border-b border-border">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {term.year} — {term.semester}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {passedInTerm} / {term.subjects.length} completed
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted">
                          <tr className="border-b border-border">
                            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Code</th>
                            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Units</th>
                            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                            <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {term.subjects.map((subj, si) => {
                            const status = getSubjectStatus(subj.code, subj.name, term.year, term.semester)
                            return (
                              <tr key={`${subj.code}-${si}`} className="transition-colors hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium text-foreground">{subj.code}</td>
                                <td className="px-4 py-3 text-foreground/80">{subj.name}</td>
                                <td className="px-4 py-3 text-foreground/80">{subj.total}</td>
                                <td className="px-4 py-3">
                                  {status === "passed" ? (
                                    <StatusBadge value="Passed" />
                                  ) : status === "failed" ? (
                                    <StatusBadge value="Failed" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Pending</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    size="sm"
                                    variant={status === "pending" ? "default" : "outline"}
                                    className="rounded-xl"
                                    onClick={() => handleMarkSubject(subj.code, subj.name, term.year, term.semester)}
                                  >
                                    {status === "pending" ? (
                                      <><Plus className="size-3.5 mr-1" /> Mark Passed</>
                                    ) : (
                                      <><Pencil className="size-3.5 mr-1" /> Edit</>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}

              {/* Custom subjects from grade history */}
              {gradeHistory.length > 0 && (
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center justify-between gap-3 bg-muted/30 px-4 py-3 border-b border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Additional Completed Subjects</p>
                      <p className="text-xs text-muted-foreground">
                        Subjects manually added not in the curriculum
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted">
                        <tr className="border-b border-border">
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Code</th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Grade</th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Year/Sem</th>
                          <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {gradeHistory.map((entry, idx) => (
                          <tr key={`custom-${idx}`} className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium text-foreground">{entry.subjectCode}</td>
                            <td className="px-4 py-3 text-foreground/80">{entry.subjectName}</td>
                            <td className="px-4 py-3 text-foreground/80">{entry.transmutedGrade}</td>
                            <td className="px-4 py-3 text-foreground/80">
                              {entry.yearLevel} / {entry.semester}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl"
                                  onClick={() => {
                                    setGradeForm({
                                      subjectCode: entry.subjectCode,
                                      subjectName: entry.subjectName,
                                      finalPercentile: String(entry.finalPercentile ?? ""),
                                      remarks: entry.remarks ?? "Passed",
                                      section: entry.section ?? "",
                                    })
                                    setGradeDialog({
                                      mode: "edit",
                                      subjectCode: entry.subjectCode,
                                      subjectName: entry.subjectName,
                                      yearLevel: entry.yearLevel,
                                      semester: entry.semester,
                                      section: entry.section ?? "",
                                      index: idx,
                                    })
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl text-red-500 hover:text-red-600"
                                  onClick={() => handleRemoveGrade(idx)}
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
              )}

              {/* Add custom subject button */}
              <Button onClick={openAddCustom} className="rounded-2xl w-full">
                <Plus className="size-4 mr-1.5" /> Add Custom Subject
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {/* Grade dialog */}
      <Dialog
        open={!!gradeDialog && !customDialog}
        onOpenChange={(o) => { if (!o) { setGradeDialog(null); setGradeForm({ subjectCode: "", subjectName: "", finalPercentile: "", remarks: "Passed", section: "" }) } }}
      >
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {gradeDialog?.mode === "edit" ? "Edit Grade" : "Mark Subject as Passed"}
            </DialogTitle>
            <DialogDescription>
              {gradeDialog?.subjectCode} — {gradeDialog?.subjectName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject Code</label>
              <Input
                value={gradeForm.subjectCode}
                onChange={(e) => setGradeForm((c) => ({ ...c, subjectCode: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject Name</label>
              <Input
                value={gradeForm.subjectName}
                onChange={(e) => setGradeForm((c) => ({ ...c, subjectName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Final Percentile (0–100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={gradeForm.finalPercentile}
                onChange={(e) => setGradeForm((c) => ({ ...c, finalPercentile: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Remarks</label>
              <Select
                value={gradeForm.remarks}
                onChange={(v) => setGradeForm((c) => ({ ...c, remarks: v }))}
                options={["Passed", "Failed", "INC", "Dropped"]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Section</label>
              <Select
                value={gradeForm.section}
                onChange={(v) => setGradeForm((c) => ({ ...c, section: v }))}
                options={yearSections.find((ys) => ys.year === gradeDialog?.yearLevel)?.sections ?? []}
              />
            </div>
          </div>
          <DialogFooter className="mt-2 gap-2">
            <Button variant="ghost" onClick={() => setGradeDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveGrade}>
              <BookMarked className="mr-1.5 size-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom subject dialog */}
      <Dialog
        open={customDialog}
        onOpenChange={(o) => { if (!o) { setCustomDialog(false); setGradeForm({ subjectCode: "", subjectName: "", finalPercentile: "", remarks: "Passed", section: "", units: 3 }) } }}
      >
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Subject</DialogTitle>
            <DialogDescription>
              Add a subject not in the student&apos;s curriculum that they have already completed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject Code *</label>
              <Input
                value={gradeForm.subjectCode}
                onChange={(e) => setGradeForm((c) => ({ ...c, subjectCode: e.target.value }))}
                placeholder="e.g. CS 101"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject Name *</label>
              <Input
                value={gradeForm.subjectName}
                onChange={(e) => setGradeForm((c) => ({ ...c, subjectName: e.target.value }))}
                placeholder="e.g. Introduction to Computing"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Final Percentile (0–100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={gradeForm.finalPercentile}
                onChange={(e) => setGradeForm((c) => ({ ...c, finalPercentile: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Units</label>
              <Input
                type="number"
                min={0}
                max={15}
                value={gradeForm.units ?? 3}
                onChange={(e) => setGradeForm((c) => ({ ...c, units: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Remarks</label>
              <Select
                value={gradeForm.remarks}
                onChange={(v) => setGradeForm((c) => ({ ...c, remarks: v }))}
                options={["Passed", "Failed", "INC", "Dropped"]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Section</label>
              <Select
                value={gradeForm.section}
                onChange={(v) => setGradeForm((c) => ({ ...c, section: v }))}
                options={yearSections.find((ys) => ys.year === selectedStudent?.currentYearLevel)?.sections ?? []}
              />
            </div>
          </div>
          <DialogFooter className="mt-2 gap-2">
            <Button variant="ghost" onClick={() => setCustomDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCustom}>
              <Plus className="mr-1.5 size-4" /> Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
