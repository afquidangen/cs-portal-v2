"use client"

import { useMemo, useState } from "react"
import { BookMarked, Pencil, Plus, Trash2, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { ScheduleItem } from "../../data/portal-data"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

/* ──────────────────────────────────────────────
   Faculty view
   ────────────────────────────────────────────── */
function FacultyView({ model }: { model: PortalModuleProps["model"] }) {
  const {
    editingStudentId, facultyClassSections, facultyClassStudents,
    handleSaveStudent, resetStudentDraft,
    selectedClassSection, setSelectedClassSection,
    setStudentDraft, startEditStudent, studentDraft,
    setRoster,
  } = model

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        {facultyClassSections.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => {
              setSelectedClassSection(section)
              setStudentDraft((c) => ({ ...c, section }))
            }}
            className={
              selectedClassSection === section
                ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                : "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
            }
          >
            {section}
          </button>
        ))}
      </div>

      <Panel title="Student Management" eyebrow={`${selectedClassSection} \u2022 ${facultyClassStudents.length} students`}>
        <form onSubmit={handleSaveStudent} className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-foreground/70">Student ID</label>
            <Input value={studentDraft.id} onChange={(e) => setStudentDraft((c) => ({ ...c, id: e.target.value }))} placeholder="2024-001245" className="h-10 rounded-2xl" />
          </div>
          <div className="min-w-0 flex-[1.5]">
            <label className="mb-1 block text-xs font-medium text-foreground/70">Full name</label>
            <Input value={studentDraft.name} onChange={(e) => setStudentDraft((c) => ({ ...c, name: e.target.value }))} placeholder="Juan Dela Cruz" className="h-10 rounded-2xl" />
          </div>
          <Button type="submit" className="rounded-2xl">
            {editingStudentId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {editingStudentId ? "Update" : "Add"}
          </Button>
          {editingStudentId ? (
            <Button type="button" variant="outline" onClick={() => resetStudentDraft(selectedClassSection)} className="rounded-2xl">
              <X className="size-4" /> Cancel
            </Button>
          ) : null}
        </form>

        {facultyClassStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No students in this section yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {facultyClassStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{student.name}</p>
                  <p className="truncate text-sm text-foreground/70">{student.id}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => startEditStudent(student)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm text-foreground/70 transition hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={student.enrolled}
                      onChange={(e) => setRoster((current) => current.map((item) => item.id === student.id ? { ...item, enrolled: e.target.checked } : item))}
                      className="size-4 rounded border-border accent-primary"
                    />
                    Enrolled
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Admin view
   ────────────────────────────────────────────── */
function AdminView({ model }: { model: PortalModuleProps["model"] }) {
  const {
    classSchedules, handleAddClassSection, handleCreateSchedule,
    handleUpdateSchedule, handleDeleteSchedule,
    handleScheduleUpload, newSectionName, scheduleDraft,
    selectedClassYear, setNewSectionName, setScheduleDraft,
    setSelectedClassYear, setRoster, yearSections, roster,
  } = model

  const [adminTab, setAdminTab] = useState("Sections")
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null)
  const [scheduleFilterYear, setScheduleFilterYear] = useState(yearSections[0]?.year ?? "")
  const [scheduleFilterSection, setScheduleFilterSection] = useState(yearSections[0]?.sections[0] ?? "")

  const selectedYear = yearSections.find((y) => y.year === selectedClassYear)

  const sectionRoster = useMemo(() => {
    if (!selectedYear) return []
    const sections = selectedYear.sections
    return roster.filter((s) => sections.includes(s.section))
  }, [roster, selectedYear])

  const scheduleYear = yearSections.find((y) => y.year === scheduleFilterYear)

  const filteredSchedules = useMemo(() => {
    if (!scheduleFilterSection) return classSchedules
    return classSchedules.filter((s) => s.section === scheduleFilterSection)
  }, [classSchedules, scheduleFilterSection])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        {[
          { key: "Sections", label: "Year Sections", icon: Users },
          { key: "Roster", label: "Student Roster", icon: BookMarked },
          { key: "Schedules", label: "Schedules", icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAdminTab(tab.key)}
              className={
                adminTab === tab.key
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

      {/* ── Year Sections ── */}
      {adminTab === "Sections" ? (
        <Panel title="Year Sections" eyebrow="Manage year levels and sections">
          <div className="flex flex-wrap gap-2">
            {yearSections.map((item) => (
              <button
                key={item.year}
                type="button"
                onClick={() => setSelectedClassYear(item.year)}
                className={
                  selectedClassYear === item.year
                    ? "rounded-xl border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-sm"
                    : "rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                }
              >
                {item.year}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sections under {selectedClassYear}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedYear?.sections.map((section) => (
                <StatusBadge key={section} value={section} />
              ))}
            </div>
          </div>

          <form onSubmit={handleAddClassSection} className="mt-5 flex max-w-md gap-2 rounded-2xl border border-border bg-muted/30 p-3">
            <Input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} placeholder="Add section, e.g. BSCS 1E" className="h-10 rounded-2xl" />
            <Button type="submit" className="rounded-2xl"><Plus className="size-4" /> Add</Button>
          </form>
        </Panel>
      ) : null}

      {/* ── Student Roster ── */}
      {adminTab === "Roster" ? (
        <Panel
          title="Student Roster"
          eyebrow={`${selectedClassYear} \u2022 ${sectionRoster.length} students`}
          actions={
            <div className="flex flex-wrap gap-2">
              {yearSections.map((item) => (
                <button
                  key={item.year}
                  type="button"
                  onClick={() => setSelectedClassYear(item.year)}
                  className={
                    selectedClassYear === item.year
                      ? "rounded-lg border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      : "rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
                  }
                >
                  {item.year}
                </button>
              ))}
            </div>
          }
        >
          {sectionRoster.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No students enrolled in this year level.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">ID</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {sectionRoster.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{student.id}</td>
                      <td className="px-4 py-3 text-foreground/80">{student.name}</td>
                      <td className="px-4 py-3 text-foreground/80">{student.section}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={student.enrolled ? "Active" : "Inactive"} />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={student.enrolled}
                          onChange={(e) => setRoster((current) => current.map((item) => item.id === student.id ? { ...item, enrolled: e.target.checked } : item))}
                          className="size-4 rounded border-border accent-primary"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {/* ── Schedules ── */}
      {adminTab === "Schedules" ? (
        <>
          <Panel title="Add Schedule Entry" eyebrow="Manual entry">
            <form onSubmit={handleCreateSchedule} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-foreground/70">Section</label>
                <Input value={scheduleDraft.section} onChange={(e) => setScheduleDraft((c) => ({ ...c, section: e.target.value }))} placeholder="BSCS 3A" className="h-10 rounded-2xl" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-medium text-foreground/70">Subject</label>
                <Input value={scheduleDraft.subject} onChange={(e) => setScheduleDraft((c) => ({ ...c, subject: e.target.value }))} placeholder="CS311" className="h-10 rounded-2xl" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-medium text-foreground/70">Instructor</label>
                <Input value={scheduleDraft.instructor} onChange={(e) => setScheduleDraft((c) => ({ ...c, instructor: e.target.value }))} placeholder="Maria Santos" className="h-10 rounded-2xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/70">Day</label>
                <Input value={scheduleDraft.day} onChange={(e) => setScheduleDraft((c) => ({ ...c, day: e.target.value }))} placeholder="Mon/Wed" className="h-10 rounded-2xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/70">Time</label>
                <Input value={scheduleDraft.time} onChange={(e) => setScheduleDraft((c) => ({ ...c, time: e.target.value }))} placeholder="8:00-9:30" className="h-10 rounded-2xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/70">Room</label>
                <Input value={scheduleDraft.room} onChange={(e) => setScheduleDraft((c) => ({ ...c, room: e.target.value }))} placeholder="Room 201" className="h-10 rounded-2xl" />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-6">
                <Button type="submit" className="rounded-2xl"><Plus className="size-4" /> Add Schedule</Button>
              </div>
            </form>
          </Panel>

          <Panel title="Bulk Upload" eyebrow="Import from Excel .xlsx">
            <div className="flex flex-wrap gap-3">
              <Input type="file" accept=".xlsx" onChange={handleScheduleUpload} className="h-10 max-w-sm rounded-2xl" />
              <Button type="button" variant="outline" className="rounded-2xl">Upload File</Button>
            </div>
          </Panel>

          <Panel
            title={`All Schedules (${filteredSchedules.length})`}
            eyebrow="Sections and instructors"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5">
                  {yearSections.map((item) => (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => {
                        setScheduleFilterYear(item.year)
                        setScheduleFilterSection(item.sections[0] ?? "")
                      }}
                      className={
                        scheduleFilterYear === item.year
                          ? "rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                          : "rounded-md px-2.5 py-1 text-xs font-medium text-foreground/70 transition hover:text-foreground"
                      }
                    >
                      {item.year}
                    </button>
                  ))}
                </div>
                <Select
                  value={scheduleFilterSection}
                  onChange={setScheduleFilterSection}
                  options={scheduleYear?.sections ?? []}
                />
              </div>
            }
          >
            {filteredSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trash2 className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No schedules yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-muted text-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Instructor</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Schedule</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Room</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredSchedules.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-foreground">{item.section}</td>
                        <td className="px-4 py-3 text-foreground/80">{item.subject}</td>
                        <td className="px-4 py-3 text-foreground/80">{item.instructor}</td>
                        <td className="px-4 py-3 text-foreground/80">{item.day}, {item.time}</td>
                        <td className="px-4 py-3 text-foreground/80">{item.room}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={() => setEditingSchedule(item)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="rounded-xl text-red-500 hover:text-red-600" onClick={() => setDeleteScheduleId(item.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Dialog open={!!editingSchedule} onOpenChange={(open) => { if (!open) setEditingSchedule(null) }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Schedule</DialogTitle>
              </DialogHeader>
              {editingSchedule ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleUpdateSchedule(editingSchedule)
                    setEditingSchedule(null)
                  }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-foreground/70">Section</label>
                    <Input value={editingSchedule.section} onChange={(e) => setEditingSchedule((c) => ({ ...c!, section: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Subject</label>
                    <Input value={editingSchedule.subject} onChange={(e) => setEditingSchedule((c) => ({ ...c!, subject: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Instructor</label>
                    <Input value={editingSchedule.instructor} onChange={(e) => setEditingSchedule((c) => ({ ...c!, instructor: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Day</label>
                    <Input value={editingSchedule.day} onChange={(e) => setEditingSchedule((c) => ({ ...c!, day: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Time</label>
                    <Input value={editingSchedule.time} onChange={(e) => setEditingSchedule((c) => ({ ...c!, time: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Room</label>
                    <Input value={editingSchedule.room} onChange={(e) => setEditingSchedule((c) => ({ ...c!, room: e.target.value }))} />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <Button type="submit"><Pencil className="size-4" /> Update Schedule</Button>
                    <Button type="button" variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
                  </div>
                </form>
              ) : null}
            </DialogContent>
          </Dialog>

          <Dialog open={!!deleteScheduleId} onOpenChange={(open) => { if (!open) setDeleteScheduleId(null) }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete Schedule</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Are you sure you want to delete this schedule entry? This action cannot be undone.</p>
              <DialogFooter className="mt-2 gap-2">
                <Button variant="ghost" onClick={() => setDeleteScheduleId(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deleteScheduleId) handleDeleteSchedule(deleteScheduleId)
                    setDeleteScheduleId(null)
                  }}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Exported component
   ────────────────────────────────────────────── */
export function ClassesModule({ model }: PortalModuleProps) {
  if (model.role === "faculty") return <FacultyView model={model} />
  return <AdminView model={model} />
}
