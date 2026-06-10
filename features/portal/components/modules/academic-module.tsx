"use client"

import { useState } from "react"
import { CalendarRange, Edit, Plus, Trash2 } from "lucide-react"

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

import { EmptyState, Panel, Select as SelectUI, StatusBadge } from "../shared/dashboard-ui"
import { CurriculumModule } from "./curriculum-module"
import type { PortalModuleProps } from "./types"
import type { SemesterRecord } from "@/lib/types"

const TABS = [
  { key: "Semesters", label: "Semesters", icon: CalendarRange },
  { key: "Curriculum", label: "Curriculum", icon: Plus },
] as const

export function AcademicModule({ model }: PortalModuleProps) {
  const {
    handleAddSemester, handleUpdateSemester, handleDeleteSemester,
    newSemester,
    selectedAcademicSection, semesters,
    setNewSemester,
    setSelectedAcademicSection,
  } = model

  const [editSemester, setEditSemester] = useState<SemesterRecord | null>(null)
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null)
  const [addSemesterOpen, setAddSemesterOpen] = useState(false)

  function submitSemester(e: React.FormEvent) {
    e.preventDefault()
    handleAddSemester(e as unknown as React.FormEvent<HTMLFormElement>)
    setAddSemesterOpen(false)
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - 2 + i))
  const activeSemesterCount = semesters.filter((semester) => semester.status === "Active").length

  return (
    <div className="space-y-5">
      {/* ── Tab bar ── */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Configured Semesters", value: String(semesters.length), note: "School-year records" },
          { label: "Active Terms", value: String(activeSemesterCount), note: "Open for portal workflows" },
          { label: "Current View", value: selectedAcademicSection, note: "Setup workspace" },
        ].map((item) => (
          <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = selectedAcademicSection === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedAcademicSection(tab.key)}
              className={
                active
                  ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                  : "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
              }
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ───── Semesters Tab ───── */}
      {selectedAcademicSection === "Semesters" ? (
        <Panel
          title={`Semesters (${semesters.length})`}
          eyebrow="School year and enrollment periods"
          actions={
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setAddSemesterOpen(true)}>
              <Plus className="size-4" /> Add Semester
            </Button>
          }
        >
          {semesters.length === 0 ? (
            <EmptyState text="No semesters configured yet." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {semesters.map((sem, idx) => (
                <div key={sem?.id ?? idx} className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm transition-colors hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-semibold text-foreground">
                          {sem.semester} - {sem.schoolYearStart}/{sem.schoolYearEnd}
                        </h4>
                        <StatusBadge value={sem.status} />
                      </div>
                      <p className="mt-1 text-sm text-foreground/80">
                        School Year {sem.schoolYearStart}-{sem.schoolYearEnd}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditSemester(sem)}><Edit className="size-3.5" /></Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setDeleteSemesterId(sem.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {/* ───── Curriculum Tab ───── */}
      {selectedAcademicSection === "Curriculum" ? (
        <CurriculumModule model={model} />
      ) : null}

      {/* ── Dialogs ── */}

      {/* Add Semester */}
      <Dialog open={addSemesterOpen} onOpenChange={setAddSemesterOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={submitSemester}>
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">Add Semester</DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">Create a new semester entry</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Semester *</label>
                <SelectUI
                  value={newSemester.semester}
                  onChange={(v) => setNewSemester((s) => ({ ...s, semester: v as "First Semester" | "Midyear" | "Second Semester" }))}
                  options={["First Semester", "Midyear", "Second Semester"]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">School Year Start *</label>
                <SelectUI
                  value={String(newSemester.schoolYearStart)}
                  onChange={(v) => {
                    const start = Number(v)
                    setNewSemester((s) => ({ ...s, schoolYearStart: start, schoolYearEnd: start + 1 }))
                  }}
                  options={yearOptions}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">School Year End</label>
                <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/80">
                  {newSemester.schoolYearEnd}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <SelectUI
                  value={newSemester.status}
                  onChange={(v) => setNewSemester((s) => ({ ...s, status: v as "Active" | "Inactive" }))}
                  options={["Active", "Inactive"]}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                <Plus className="mr-1.5 size-4" /> Save Semester
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Semester */}
      <Dialog open={!!editSemester} onOpenChange={(o) => !o && setEditSemester(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Edit Semester</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Update semester details</DialogDescription>
          </DialogHeader>
          {editSemester ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Semester</label>
                <SelectUI
                  value={editSemester.semester}
                  onChange={(v) => setEditSemester({ ...editSemester, semester: v as "First Semester" | "Midyear" | "Second Semester" })}
                  options={["First Semester", "Midyear", "Second Semester"]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">School Year Start</label>
                <SelectUI
                  value={String(editSemester.schoolYearStart)}
                  onChange={(v) => {
                    const start = Number(v)
                    setEditSemester({ ...editSemester, schoolYearStart: start, schoolYearEnd: start + 1 })
                  }}
                  options={yearOptions}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">School Year End</label>
                <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/80">
                  {editSemester.schoolYearEnd}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <SelectUI
                  value={editSemester.status}
                  onChange={(v) => setEditSemester({ ...editSemester, status: v as "Active" | "Inactive" })}
                  options={["Active", "Inactive"]}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => { if (editSemester) handleUpdateSemester(editSemester); setEditSemester(null) }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Semester */}
      <Dialog open={!!deleteSemesterId} onOpenChange={(o) => !o && setDeleteSemesterId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Semester</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => { if (deleteSemesterId) handleDeleteSemester(deleteSemesterId); setDeleteSemesterId(null) }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}
