"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Archive, ArchiveRestore, CalendarDays, CheckCircle2, Clock, Download, GraduationCap, Plus, RotateCcw, Timer, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Panel } from "../shared/dashboard-ui"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { PortalModuleProps } from "./types"
import type { GradeRecord, ScheduleItem } from "../../data/portal-data"
import type { SemesterRecord } from "@/lib/types"

export function SemesterManagementModule({ model }: PortalModuleProps) {
  const {
    activeSemester,
    inactiveSemesters,
    archivedSemesters,
    semesters,
    setSemesters,
    inactivateSemester,
    archiveSemester,
    unarchiveSemester,
    activateSemester,
    setGradingPeriod,
    setSemesterEndDate,
    handleDeleteSemester,
    handleAddSemester,
    newSemester,
    setNewSemester,
    setShowAddSemesterForm,
    showAddSemesterForm,
    grades,
    classSchedules,
    role,
  } = model

  const [archiveTarget, setArchiveTarget] = useState<string | null>(null)
  const [inactiveTarget, setInactiveTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [endDateValue, setEndDateValue] = useState(activeSemester?.endDate?.split("T")[0] ?? "")

  useEffect(() => {
    setEndDateValue(activeSemester?.endDate?.split("T")[0] ?? "")
  }, [activeSemester])

  const daysRemaining = useMemo(() => {
    if (!activeSemester?.endDate) return null
    const diff = new Date(activeSemester.endDate).getTime() - Date.now()
    if (diff <= 0) return 0
    return Math.ceil(diff / 86400000)
  }, [activeSemester?.endDate])

  function handleMarkInactive() {
    if (!inactiveTarget) return
    inactivateSemester(inactiveTarget)
    setInactiveTarget(null)
  }

  function handleArchive() {
    if (!archiveTarget) return
    archiveSemester(archiveTarget)
    setArchiveTarget(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    handleDeleteSemester(deleteTarget)
    setDeleteTarget(null)
  }

  function handleEndDateSave() {
    if (!activeSemester || !endDateValue) return
    setSemesterEndDate(activeSemester.id, new Date(endDateValue).toISOString())
  }

  function getSemesterSchedules(sem: SemesterRecord): ScheduleItem[] {
    return classSchedules.filter((s) => s.semesterId === sem.id)
  }

  function getSemesterGrades(sem: SemesterRecord): GradeRecord[] {
    const direct = grades.filter((g) => g.semesterId === sem.id)
    if (direct.length > 0) return direct
    const pairs = new Set(
      classSchedules
        .filter((s) => s.semesterId === sem.id)
        .map((s) => `${s.section}|${s.subject}`)
    )
    return grades.filter((g) => pairs.has(`${g.section}|${g.subject}`))
  }

  function downloadCsv(sem: SemesterRecord) {
    const semSchedules = getSemesterSchedules(sem)
    const semGrades = getSemesterGrades(sem)

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

  return (
    <Panel title="Semester Management" className="[&>div:first-child]:hidden">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <CalendarDays className="size-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Administration</p>
              <h3 className="text-2xl font-black tracking-tight text-foreground">Semester Management</h3>
            </div>
          </div>
        </div>

        {/* Active Semester Card */}
        {activeSemester ? (
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Active Semester</p>
                <h4 className="mt-1 text-xl font-black text-foreground">
                  {activeSemester.semester}, A.Y. {activeSemester.schoolYearStart}-{activeSemester.schoolYearEnd}
                </h4>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Timer className="size-5 text-muted-foreground" />
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  daysRemaining !== null && daysRemaining <= 30 ? "text-destructive" : "text-foreground"
                )}>
                  {daysRemaining !== null ? `${daysRemaining}d` : "--"}
                </span>
                <span className="text-xs text-muted-foreground">remaining</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {/* Grading Period Toggle */}
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Grading Period</p>
                <div className="flex gap-1.5">
                  {(["Midterm", "Final"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setGradingPeriod(activeSemester.id, period)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                        activeSemester.gradingPeriod === period
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* End Date */}
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">End Date</p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDateValue}
                    onChange={(e) => setEndDateValue(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
                  />
                  <Button size="sm" variant="outline" onClick={handleEndDateSave} className="shrink-0">
                    Save
                  </Button>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="rounded-xl border-2 border-destructive/20 bg-destructive/[0.03] p-3 flex items-end">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setInactiveTarget(activeSemester.id)}
                  className="w-full"
                >
                  <ToggleRight className="size-4" />
                  Mark as Ended
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="size-4" />
                <strong className="text-foreground">{classSchedules.filter(s => s.semesterId === activeSemester.id).length}</strong> subjects
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <strong className="text-foreground">{grades.filter(g => g.semesterId === activeSemester.id).length}</strong> grade records
              </span>
            </div>

            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(activeSemester.id)}>
                <Trash2 className="size-4" />
                Delete Semester
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/10 p-8 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No active semester</p>
            <p className="mt-1 text-xs text-muted-foreground">Create a new semester to get started.</p>
          </div>
        )}

        {/* Inactive Semesters */}
        {inactiveSemesters.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Ended Semesters ({inactiveSemesters.length})
              </h4>
            </div>
            <div className="space-y-2">
              {inactiveSemesters.map((sem) => (
                <div
                  key={sem.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sem.semester}, A.Y. {sem.schoolYearStart}-{sem.schoolYearEnd}
                    </p>
                    <p className="text-xs text-muted-foreground">Ended — ready for archival</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => activateSemester(sem.id)}>
                      <RotateCcw className="size-4" />
                      Reactivate
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setArchiveTarget(sem.id)}>
                      <Archive className="size-4" />
                      Archive
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(sem.id)}>
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archived Semesters */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Archived Semesters ({archivedSemesters.length})
            </h4>
          </div>
          {archivedSemesters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/5 py-6 text-center">
              <Archive className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-xs text-muted-foreground">No archived semesters yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {archivedSemesters.map((sem) => (
                <div
                  key={sem.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sem.semester}, A.Y. {sem.schoolYearStart}-{sem.schoolYearEnd}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Archived {sem.archivedAt ? new Date(sem.archivedAt).toLocaleDateString() : "---"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => unarchiveSemester(sem.id)}>
                      <ArchiveRestore className="size-4" />
                      Unarchive
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => activateSemester(sem.id)}>
                      <RotateCcw className="size-4" />
                      Activate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadCsv(sem)}>
                      <Download className="size-4" />
                      Download CSV
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(sem.id)}>
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create New Semester */}
        <div>
          <Button variant="outline" onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus className="size-4" />
            {showCreateForm ? "Cancel" : "Create New Semester"}
          </Button>

          {showCreateForm && (
            <form
              onSubmit={handleAddSemester}
              className="mt-3 rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Semester</label>
                  <select
                    value={newSemester.semester}
                    onChange={(e) => setNewSemester({ ...newSemester, semester: e.target.value as typeof newSemester.semester })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Midyear">Midyear</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Year Start</label>
                    <input
                      type="number"
                      value={newSemester.schoolYearStart}
                      onChange={(e) => setNewSemester({ ...newSemester, schoolYearStart: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Year End</label>
                    <input
                      type="number"
                      value={newSemester.schoolYearEnd}
                      onChange={(e) => setNewSemester({ ...newSemester, schoolYearEnd: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activate-new"
                  checked={newSemester.status === "Active"}
                  onChange={(e) => setNewSemester({ ...newSemester, status: e.target.checked ? "Active" : "Inactive" })}
                  className="rounded border-border"
                />
                <label htmlFor="activate-new" className="text-xs font-medium text-foreground">
                  Activate immediately (deactivates current)
                </label>
              </div>
              <Button type="submit" size="sm">
                <Plus className="size-4" />
                Create Semester
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Mark as Ended Confirmation */}
      <ConfirmDialog
        open={inactiveTarget !== null}
        onOpenChange={(open) => { if (!open) setInactiveTarget(null) }}
        title="Mark Semester as Ended?"
        description={
          inactiveTarget
            ? `Set "${semesters.find(s => s.id === inactiveTarget)?.semester}" to ended. This will hide it from active student and faculty views.`
            : ""
        }
        variant="destructive"
        confirmLabel="Mark as Ended"
        onConfirm={handleMarkInactive}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title="Archive Semester?"
        description={
          archiveTarget
            ? `Archive "${semesters.find(s => s.id === archiveTarget)?.semester}" permanently. Students and faculty will still be able to view grades and records for this semester.`
            : ""
        }
        variant="destructive"
        confirmLabel="Archive Semester"
        onConfirm={handleArchive}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Semester?"
        description={
          deleteTarget
            ? `Permanently delete "${semesters.find(s => s.id === deleteTarget)?.semester}"? This action cannot be undone.`
            : ""
        }
        variant="destructive"
        confirmLabel="Delete Semester"
        onConfirm={handleDelete}
      />
    </Panel>
  )
}
