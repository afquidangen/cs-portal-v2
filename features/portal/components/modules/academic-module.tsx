"use client"

import { useMemo, useState } from "react"
import { BookOpen, CalendarRange, Edit, GraduationCap, Plus, Search, Trash2 } from "lucide-react"

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

import { EmptyState, Panel, Select as SelectUI, StatusBadge } from "../shared/dashboard-ui"
import { CurriculumModule } from "./curriculum-module"
import type { PortalModuleProps } from "./types"
import type { SemesterRecord, SubjectRecord } from "../../data/portal-data"

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
    curricula,
    subjects,
  } = model

  const [editSemester, setEditSemester] = useState<SemesterRecord | null>(null)
  const [deleteSemesterId, setDeleteSemesterId] = useState<string | null>(null)
  const [addSemesterOpen, setAddSemesterOpen] = useState(false)
  const [addSubjectOpen, setAddSubjectOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<SubjectRecord | null>(null)
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null)

  const [subjectSearch, setSubjectSearch] = useState("")
  const [subjectCurriculumFilter, setSubjectCurriculumFilter] = useState("All")

  const curriculumNames = useMemo(
    () => ["All", ...Array.from(new Set(curricula.map((c) => c.name)))],
    [curricula]
  )

  const filteredSubjects = useMemo(() => {
    let result = subjects
    if (subjectCurriculumFilter !== "All") {
      const curr = curricula.find((c) => c.name === subjectCurriculumFilter)
      if (curr) result = result.filter((s) => s.curriculumId === curr.id)
    }
    if (subjectSearch.trim()) {
      const q = subjectSearch.toLowerCase()
      result = result.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      )
    }
    return result
  }, [subjects, subjectCurriculumFilter, subjectSearch, curricula])

  const semesterOptions = ["First Semester", "Midyear", "Second Semester"]

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

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - 2 + i))
  const yearLevelOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

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
          title={`Subjects (${filteredSubjects.length})`}
          eyebrow="Course offerings"
          actions={
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Search code or name..."
                  className="h-10 w-48 rounded-2xl pl-9"
                />
              </div>
              <SelectUI
                value={subjectCurriculumFilter}
                onChange={setSubjectCurriculumFilter}
                options={curriculumNames}
              />
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAddSubjectOpen(true)}>
                <Plus className="size-4" /> Add Subject
              </Button>
            </div>
          }
        >
          {filteredSubjects.length === 0 ? (
            <EmptyState text="No subjects found." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Curr ID</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Code</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Lec</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Lab</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {filteredSubjects.map((subject, idx) => (
                    <tr key={subject?.id ?? idx} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{subject.curriculumId}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.code}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.name}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.type}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.lectureUnits}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.labUnits}</td>
                      <td className="px-4 py-3 text-foreground/80">{subject.totalUnits}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditSubject(subject)}><Edit className="size-3.5" /></Button>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDeleteSubjectId(subject.id)}><Trash2 className="size-3.5" /></Button>
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

      {/* Add Subject */}
      <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={submitSubject}>
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">Add Subject</DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">Create a new subject entry</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Curriculum *</label>
                <SelectUI
                  value={newSubject.curriculumId}
                  onChange={(v) => setNewSubject((s) => ({ ...s, curriculumId: v }))}
                  options={curricula.map((c) => c.id)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Year Level *</label>
                <SelectUI
                  value={newSubject.yearLevel}
                  onChange={(v) => setNewSubject((s) => ({ ...s, yearLevel: v }))}
                  options={yearLevelOptions}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Semester *</label>
                <SelectUI
                  value={newSubject.semester}
                  onChange={(v) => setNewSubject((s) => ({ ...s, semester: v }))}
                  options={["First Semester", "Second Semester", "Midyear"]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Subject Code *</label>
                <Input value={newSubject.code} onChange={(e) => setNewSubject((s) => ({ ...s, code: e.target.value }))} placeholder="CS311" required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Subject Name *</label>
                <Input value={newSubject.name} onChange={(e) => setNewSubject((s) => ({ ...s, name: e.target.value }))} placeholder="Web Systems and Technologies" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Type *</label>
                <SelectUI
                  value={newSubject.type}
                  onChange={(v) => setNewSubject((s) => ({ ...s, type: v as "Lecture" | "Lecture with Lab" }))}
                  options={["Lecture", "Lecture with Lab"]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lecture Units</label>
                <SelectUI
                  value={String(newSubject.lectureUnits)}
                  onChange={(v) => setNewSubject((s) => ({ ...s, lectureUnits: Number(v), totalUnits: Number(v) + s.labUnits }))}
                  options={["1", "2", "3", "4", "5"]}
                />
              </div>
              {newSubject.type === "Lecture with Lab" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Lab Units</label>
                  <SelectUI
                    value={String(newSubject.labUnits)}
                    onChange={(v) => setNewSubject((s) => ({ ...s, labUnits: Number(v), totalUnits: s.lectureUnits + Number(v) }))}
                    options={["1", "2", "3"]}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Total Units</label>
                <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/80">
                  {newSubject.totalUnits}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit">
                <Plus className="mr-1.5 size-4" /> Save Subject
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject */}
      <Dialog open={!!editSubject} onOpenChange={(o) => !o && setEditSubject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Edit Subject</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">Update subject details</DialogDescription>
          </DialogHeader>
          {editSubject ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Curriculum</label>
                <SelectUI
                  value={editSubject.curriculumId ?? curricula[0]?.id ?? ""}
                  onChange={(v) => setEditSubject({ ...editSubject, curriculumId: v })}
                  options={curricula.map((c) => c.id)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Year Level</label>
                <SelectUI
                  value={editSubject.yearLevel ?? "1st Year"}
                  onChange={(v) => setEditSubject({ ...editSubject, yearLevel: v })}
                  options={yearLevelOptions}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Semester</label>
                <SelectUI
                  value={editSubject.semester ?? "First Semester"}
                  onChange={(v) => setEditSubject({ ...editSubject, semester: v })}
                  options={["First Semester", "Second Semester", "Midyear"]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Subject Code</label>
                <Input value={editSubject.code ?? ""} onChange={(e) => setEditSubject({ ...editSubject, code: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Subject Name</label>
                <Input value={editSubject.name ?? ""} onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Type</label>
                <SelectUI
                  value={editSubject.type ?? "Lecture"}
                  onChange={(v) => setEditSubject({ ...editSubject, type: v as "Lecture" | "Lecture with Lab" })}
                  options={["Lecture", "Lecture with Lab"]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Lecture Units</label>
                <SelectUI
                  value={String(editSubject.lectureUnits ?? 3)}
                  onChange={(v) => setEditSubject({ ...editSubject, lectureUnits: Number(v), totalUnits: Number(v) + (editSubject.labUnits ?? 0) })}
                  options={["1", "2", "3", "4", "5"]}
                />
              </div>
              {editSubject.type === "Lecture with Lab" ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Lab Units</label>
                  <SelectUI
                    value={String(editSubject.labUnits ?? 0)}
                    onChange={(v) => setEditSubject({ ...editSubject, labUnits: Number(v), totalUnits: (editSubject.lectureUnits ?? 3) + Number(v) })}
                    options={["1", "2", "3"]}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Total Units</label>
                <p className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground/80">
                  {editSubject.totalUnits ?? 0}
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={() => { if (editSubject) handleUpdateSubject(editSubject); setEditSubject(null) }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject */}
      <Dialog open={!!deleteSubjectId} onOpenChange={(o) => !o && setDeleteSubjectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Subject</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => { if (deleteSubjectId) handleDeleteSubject(deleteSubjectId); setDeleteSubjectId(null) }}>
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
