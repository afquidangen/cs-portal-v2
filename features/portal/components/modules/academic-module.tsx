"use client"

import { useState } from "react"
import { BookOpen, CalendarRange, Edit, GraduationCap, Plus, Trash2 } from "lucide-react"

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
import { CurriculumModule } from "./curriculum-module"
import type { PortalModuleProps } from "./types"
import type { SemesterRecord } from "../../data/portal-data"

const TABS = [
  { key: "Semesters", label: "Semesters", icon: CalendarRange },
  { key: "Subjects", label: "Subjects", icon: BookOpen },
  { key: "Curriculum", label: "Curriculum", icon: GraduationCap },
] as const

export function AcademicModule({ model }: PortalModuleProps) {
  const {
    handleAddSemester, handleUpdateSemester, handleDeleteSemester,
    handleAddSubject, handleUpdateSubject, handleDeleteSubject,
    newSemester, newSubject,
    selectedAcademicSection, semesters,
    setNewSemester, setNewSubject,
    setSelectedAcademicSection,

    subjects,
  } = model

  const [editSemester, setEditSemester] = useState<SemesterRecord | null>(null)
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null)
  const [addSemesterOpen, setAddSemesterOpen] = useState(false)
  const [addSubjectOpen, setAddSubjectOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<{
    originalCode: string; code: string; title: string; units: string; instructor: string
  } | null>(null)
  const [deleteSubjectCode, setDeleteSubjectCode] = useState<string | null>(null)

  function submitSemester(e: React.FormEvent) {
    e.preventDefault()
    handleAddSemester(e as unknown as React.FormEvent<HTMLFormElement>)
    setAddSemesterOpen(false)
  }

  function submitSubject(e: React.FormEvent) {
    e.preventDefault()
    handleAddSubject(e as unknown as React.FormEvent<HTMLFormElement>)
    setAddSubjectOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
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
                  ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                  : "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
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
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAddSemesterOpen(true)}>
              <Plus className="size-4" /> Add Semester
            </Button>
          }
        >
          {semesters.length === 0 ? (
            <EmptyState text="No semesters configured yet." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {semesters.map((sem, idx) => (
                <div key={sem?.id ?? idx} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-semibold text-foreground">{sem.name} {sem.schoolYear}</h4>
                        <StatusBadge value={sem.enrollment} />
                      </div>
                      <p className="mt-1 text-sm text-foreground/80">Grade submission: {sem.gradeSubmission}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditSemester(sem)}><Edit className="size-3.5" /></Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDeleteSemesterId(sem.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {/* ───── Subjects Tab ───── */}
      {selectedAcademicSection === "Subjects" ? (
        <Panel
          title={`Subjects (${subjects.length})`}
          eyebrow="Course offerings and instructors"
          actions={
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAddSubjectOpen(true)}>
              <Plus className="size-4" /> Add Subject
            </Button>
          }
        >
          {subjects.length === 0 ? (
            <EmptyState text="No subjects configured yet." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Code</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Units</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Instructor</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {subjects.map((subject, idx) => (
                    <tr key={subject?.code ?? idx} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{subject.code}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.title}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.units}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.instructor}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditSubject({
                            originalCode: subject.code, code: subject.code, title: subject.title,
                            units: String(subject.units), instructor: subject.instructor,
                          })}><Edit className="size-3.5" /></Button>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDeleteSubjectCode(subject.code)}><Trash2 className="size-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        <DialogContent className="edu-sidebar-shell max-w-lg rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <form onSubmit={submitSemester}>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Add Semester</DialogTitle>
              <DialogDescription className="pt-1 text-white/70">Create a new semester entry</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Name *</label>
                  <Select value={newSemester.name} onChange={(v) => setNewSemester((s) => ({ ...s, name: v }))} options={["1st Semester", "2nd Semester", "Summer Term"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">School year *</label>
                  <Input value={newSemester.schoolYear} onChange={(e) => setNewSemester((s) => ({ ...s, schoolYear: e.target.value }))} placeholder="2025-2026" className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white placeholder:text-white/40" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Enrollment</label>
                  <Select value={newSemester.enrollment} onChange={(v) => setNewSemester((s) => ({ ...s, enrollment: v }))} options={["Open", "Upcoming", "Closed"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Grade submission</label>
                  <Input value={newSemester.gradeSubmission} onChange={(e) => setNewSemester((s) => ({ ...s, gradeSubmission: e.target.value }))} placeholder="May 20 - June 5, 2026" className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white placeholder:text-white/40" />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200">
                <Plus className="mr-1.5 size-4" /> Save Semester
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Semester */}
      <Dialog open={!!editSemester} onOpenChange={(o) => !o && setEditSemester(null)}>
        <DialogContent className="edu-sidebar-shell max-w-lg rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Edit Semester</DialogTitle>
            <DialogDescription className="pt-1 text-white/70">Update semester details</DialogDescription>
          </DialogHeader>
          {editSemester ? (
            <div className="space-y-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Name</label>
                  <Select value={editSemester.name} onChange={(v) => setEditSemester({ ...editSemester, name: v })} options={["1st Semester", "2nd Semester", "Summer Term"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">School year</label>
                  <Input value={editSemester.schoolYear} onChange={(e) => setEditSemester({ ...editSemester, schoolYear: e.target.value })} className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Enrollment</label>
                  <Select value={editSemester.enrollment} onChange={(v) => setEditSemester({ ...editSemester, enrollment: v })} options={["Open", "Upcoming", "Closed"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Grade submission</label>
                  <Input value={editSemester.gradeSubmission} onChange={(e) => setEditSemester({ ...editSemester, gradeSubmission: e.target.value })} className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white" />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">Cancel</Button>
            </DialogClose>
            <Button variant="ghost" className="rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200" onClick={() => { if (editSemester) handleUpdateSemester(editSemester); setEditSemester(null) }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Semester */}
      <Dialog open={!!deleteSemesterId} onOpenChange={(o) => !o && setDeleteSemesterId(null)}>
        <DialogContent className="edu-sidebar-shell max-w-sm rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Delete Semester</DialogTitle>
            <DialogDescription className="pt-1 text-white/70">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">Cancel</Button>
            </DialogClose>
            <Button variant="ghost" className="rounded-xl border border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200" onClick={() => { if (deleteSemesterId) handleDeleteSemester(deleteSemesterId); setDeleteSemesterId(null) }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject */}
      <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
        <DialogContent className="edu-sidebar-shell max-w-lg rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <form onSubmit={submitSubject}>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Add Subject</DialogTitle>
              <DialogDescription className="pt-1 text-white/70">Create a new subject entry</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Code *</label>
                  <Input value={newSubject.code} onChange={(e) => setNewSubject((s) => ({ ...s, code: e.target.value }))} placeholder="CS311" className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white placeholder:text-white/40" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Title *</label>
                  <Input value={newSubject.title} onChange={(e) => setNewSubject((s) => ({ ...s, title: e.target.value }))} placeholder="Web Systems" className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white placeholder:text-white/40" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Units</label>
                  <Select value={newSubject.units} onChange={(v) => setNewSubject((s) => ({ ...s, units: v }))} options={["1", "2", "3", "4", "5", "6"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Instructor</label>
                  <Input value={newSubject.instructor} onChange={(e) => setNewSubject((s) => ({ ...s, instructor: e.target.value }))} placeholder="Maria Santos" className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white placeholder:text-white/40" />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200">
                <Plus className="mr-1.5 size-4" /> Save Subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject */}
      <Dialog open={!!editSubject} onOpenChange={(o) => !o && setEditSubject(null)}>
        <DialogContent className="edu-sidebar-shell max-w-lg rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Edit Subject</DialogTitle>
            <DialogDescription className="pt-1 text-white/70">Update subject details</DialogDescription>
          </DialogHeader>
          {editSubject ? (
            <div className="space-y-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Code</label>
                  <Input value={editSubject.code} onChange={(e) => setEditSubject({ ...editSubject, code: e.target.value })} className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Title</label>
                  <Input value={editSubject.title} onChange={(e) => setEditSubject({ ...editSubject, title: e.target.value })} className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Units</label>
                  <Select value={editSubject.units} onChange={(v) => setEditSubject({ ...editSubject, units: v })} options={["1", "2", "3", "4", "5", "6"]} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Instructor</label>
                  <Input value={editSubject.instructor} onChange={(e) => setEditSubject({ ...editSubject, instructor: e.target.value })} className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white" />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">Cancel</Button>
            </DialogClose>
            <Button variant="ghost" className="rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200" onClick={() => { if (editSubject) { handleUpdateSubject({ code: editSubject.code, title: editSubject.title, units: Number(editSubject.units) || 0, instructor: editSubject.instructor }); } setEditSubject(null) }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject */}
      <Dialog open={!!deleteSubjectCode} onOpenChange={(o) => !o && setDeleteSubjectCode(null)}>
        <DialogContent className="edu-sidebar-shell max-w-sm rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Delete Subject</DialogTitle>
            <DialogDescription className="pt-1 text-white/70">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">Cancel</Button>
            </DialogClose>
            <Button variant="ghost" className="rounded-xl border border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200" onClick={() => { if (deleteSubjectCode) handleDeleteSubject(deleteSubjectCode); setDeleteSubjectCode(null) }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
