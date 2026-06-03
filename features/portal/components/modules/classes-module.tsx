"use client"

import { useMemo, useState } from "react"
import { BookMarked, Pencil, Plus, Trash2, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
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
    handleDeleteRosterStudent, handleToggleEnrolled, handleSaveStudent, resetStudentDraft,
    selectedClassSection, setSelectedClassSection,
    setStudentDraft, startEditStudent, studentDraft,
    setUsers,
  } = model

  const [facultyDeleteId, setFacultyDeleteId] = useState<string | null>(null)

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
            <label className="mb-1 block text-sm font-medium text-foreground">Student ID</label>
            <Input value={studentDraft.id} onChange={(e) => setStudentDraft((c) => ({ ...c, id: e.target.value }))} placeholder="2024-001245" className="h-10 rounded-2xl" />
          </div>
          <div className="min-w-0 flex-[1.5]">
            <label className="mb-1 block text-sm font-medium text-foreground">Full name</label>
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
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setFacultyDeleteId(student.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm text-foreground/70 transition hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={student.enrolled}
                      onChange={(e) => handleToggleEnrolled(student.id, e.target.checked)}
                      className="size-4 rounded border-border accent-primary"
                    />
                    Enrolled
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!facultyDeleteId} onOpenChange={(o) => { if (!o) setFacultyDeleteId(null) }}>
          <DialogContent className="w-[95vw] sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove Student</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Remove this student from the roster? This will also remove their grade records.</p>
            <DialogFooter className="mt-2 gap-2">
              <Button variant="ghost" onClick={() => setFacultyDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                if (facultyDeleteId) {
                  handleDeleteRosterStudent(facultyDeleteId)
                  setUsers((current) => current.filter((u) => u.id !== facultyDeleteId))
                }
                setFacultyDeleteId(null)
              }}>
                <Trash2 className="mr-1.5 size-4" /> Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
    handleUpdateSchedule, handleDeleteSchedule, handleDeleteRosterStudent,
    handleToggleEnrolled, handleScheduleUpload,
    newSectionName, scheduleDraft, selectedClassYear, setNewSectionName,
    setScheduleDraft, setSelectedClassYear, setRoster, setUsers, users, yearSections, roster,
    subjects,
  } = model

  const [adminTab, setAdminTab] = useState("Sections")
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null)
  const [scheduleFilterYear, setScheduleFilterYear] = useState(yearSections[0]?.year ?? "")
  const [scheduleFilterSection, setScheduleFilterSection] = useState(yearSections[0]?.sections[0] ?? "")
  const [rosterDraft, setRosterDraft] = useState({ id: "", name: "", section: "" })
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null)
  const [deleteRosterId, setDeleteRosterId] = useState<string | null>(null)
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)

  const sectionOptions = useMemo(() => yearSections.flatMap((y) => y.sections), [yearSections])
  const subjectOptions = useMemo(() => subjects.map((s) => s.code), [subjects])
  const instructorOptions = useMemo(() => users.filter((u) => u.role === "faculty").map((u) => u.name), [users])
  const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const timeOptions = [
    "7:00 AM - 8:00 AM", "7:30 AM - 9:00 AM", "8:00 AM - 9:00 AM", "8:00 AM - 10:00 AM",
    "9:00 AM - 10:00 AM", "9:00 AM - 11:00 AM", "10:00 AM - 11:00 AM", "10:00 AM - 12:00 PM",
    "11:00 AM - 12:00 PM", "11:00 AM - 1:00 PM", "1:00 PM - 2:00 PM", "1:00 PM - 3:00 PM",
    "2:00 PM - 3:00 PM", "2:00 PM - 4:00 PM", "3:00 PM - 4:00 PM", "3:00 PM - 5:00 PM",
    "4:00 PM - 5:00 PM", "4:00 PM - 6:00 PM",
  ]
  const roomOptions = useMemo(() => {
    const defaults = ["Room 101", "Room 102", "Room 103", "Room 201", "Room 202", "Room 203", "Room 204", "Room 205", "Room 301", "Room 302", "Room 303", "Room 401", "Room 402", "Lab 201", "Lab 202", "Lab 203", "Lab 204", "CS Lab 1", "CS Lab 2", "Auditorium", "Multimedia Room"]
    const existing = new Set(classSchedules.map((s) => s.room).filter(Boolean))
    return [...new Set([...defaults, ...existing])]
  }, [classSchedules])

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
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">ID</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Name</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {sectionRoster.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-muted/50">
                      <td className="max-w-[120px] truncate px-4 py-3 font-medium text-foreground">{student.id}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-foreground/80">{student.name}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">{student.section}</td>
                      <td className="px-4 py-3">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={student.enrolled}
                            onChange={(e) => handleToggleEnrolled(student.id, e.target.checked)}
                            className="size-4 rounded border-border accent-primary"
                          />
                          <StatusBadge value={student.enrolled ? "Active" : "Inactive"} />
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                            setEditingRosterId(student.id)
                            setRosterDraft({ id: student.id, name: student.name, section: student.section })
                          }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDeleteRosterId(student.id)}>
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

          {/* Edit roster student dialog */}
          <Dialog open={!!editingRosterId} onOpenChange={(o) => { if (!o) { setEditingRosterId(null); setRosterDraft({ id: "", name: "", section: selectedYear?.sections[0] ?? "" }) } }}>
            <DialogContent className="w-[95vw] sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Student ID</label>
                  <Input value={rosterDraft.id} onChange={(e) => setRosterDraft((c) => ({ ...c, id: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Full name</label>
                  <Input value={rosterDraft.name} onChange={(e) => setRosterDraft((c) => ({ ...c, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Section</label>
                  <Select
                    value={rosterDraft.section}
                    onChange={(value) => setRosterDraft((c) => ({ ...c, section: value }))}
                    options={yearSections.flatMap((y) => y.sections)}
                  />
                </div>
              </div>
              <DialogFooter className="mt-2 gap-2">
                <Button variant="ghost" onClick={() => { setEditingRosterId(null); setRosterDraft({ id: "", name: "", section: selectedYear?.sections[0] ?? "" }) }}>Cancel</Button>
                <Button onClick={() => {
                  if (!editingRosterId) return
                  setRoster((current) => current.map((s) =>
                    s.id === editingRosterId ? { ...s, id: rosterDraft.id, name: rosterDraft.name, section: rosterDraft.section, enrolled: s.enrolled } : s
                  ))
                  setUsers((current) => current.map((u) =>
                    u.id === editingRosterId ? { ...u, id: rosterDraft.id, name: rosterDraft.name, section: rosterDraft.section } : u
                  ))
                  setEditingRosterId(null)
                  setRosterDraft({ id: "", name: "", section: selectedYear?.sections[0] ?? "" })
                }}>
                  <Pencil className="mr-1.5 size-4" /> Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete roster student confirmation */}
          <Dialog open={!!deleteRosterId} onOpenChange={(o) => { if (!o) setDeleteRosterId(null) }}>
            <DialogContent className="w-[95vw] sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Remove Student</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Remove this student from the roster? This will also remove their grade records.</p>
              <DialogFooter className="mt-2 gap-2">
                <Button variant="ghost" onClick={() => setDeleteRosterId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => {
                  if (deleteRosterId) {
                    handleDeleteRosterStudent(deleteRosterId)
                    setUsers((current) => current.filter((u) => u.id !== deleteRosterId))
                  }
                  setDeleteRosterId(null)
                }}>
                  <Trash2 className="mr-1.5 size-4" /> Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Panel>
      ) : null}

      {/* ── Schedules ── */}
      {adminTab === "Schedules" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Class Schedules</h3>
              <p className="text-sm text-muted-foreground">Manage and organize class schedules</p>
            </div>
            <Button onClick={() => setAddScheduleOpen(true)} className="rounded-2xl">
              <Plus className="size-4" /> Add Schedule Entry
            </Button>
          </div>

          <Input id="schedule-upload" type="file" accept=".xlsx" onChange={handleScheduleUpload} className="hidden" />
          <Button variant="outline" className="rounded-2xl" onClick={() => document.getElementById("schedule-upload")?.click()}>
            Upload File
          </Button>

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
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-muted text-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Instructor</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Schedule</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Room</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredSchedules.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-muted/50">
                        <td className="max-w-[120px] truncate px-4 py-3 font-medium text-foreground">{item.section}</td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-foreground/80">{item.subject}</td>
                        <td className="hidden lg:table-cell max-w-[160px] truncate px-4 py-3 text-foreground/80">{item.instructor}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{item.day}, {item.time}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">{item.room}</td>
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

          {/* ── Add Schedule Dialog ── */}
          <Dialog open={addScheduleOpen} onOpenChange={(o) => {
            if (o) setScheduleDraft({ day: "", time: "", subject: "", room: "", instructor: "", section: selectedYear?.sections[0] ?? "" })
            if (!o) setAddScheduleOpen(false)
          }}>
            <DialogContent className="w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground">Add Schedule Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleCreateSchedule(e)
                setAddScheduleOpen(false)
              }} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Select
                    label="Section"
                    value={scheduleDraft.section}
                    onChange={(value) => setScheduleDraft((c) => ({ ...c, section: value }))}
                    options={sectionOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Select
                    label="Subject"
                    value={scheduleDraft.subject}
                    onChange={(value) => setScheduleDraft((c) => ({ ...c, subject: value }))}
                    options={subjectOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Select
                    label="Instructor"
                    value={scheduleDraft.instructor}
                    onChange={(value) => setScheduleDraft((c) => ({ ...c, instructor: value }))}
                    options={instructorOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Select
                    label="Day"
                    value={scheduleDraft.day}
                    onChange={(value) => setScheduleDraft((c) => ({ ...c, day: value }))}
                    options={dayOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Select
                    label="Time"
                    value={scheduleDraft.time}
                    onChange={(value) => setScheduleDraft((c) => ({ ...c, time: value }))}
                    options={timeOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Select
                    label="Room"
                    value={scheduleDraft.room}
                    onChange={(value) => setScheduleDraft((c) => ({ ...c, room: value }))}
                    options={roomOptions}
                  />
                </div>
                <DialogFooter className="mt-2 gap-2 sm:col-span-2">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button type="submit"><Plus className="size-4" /> Add Schedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingSchedule} onOpenChange={(open) => { if (!open) setEditingSchedule(null) }}>
            <DialogContent className="w-[95vw] sm:max-w-lg">
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
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-1.5 sm:col-span-2">
                    <Select
                      label="Section"
                      value={editingSchedule.section}
                      onChange={(value) => setEditingSchedule((c) => ({ ...c!, section: value }))}
                      options={sectionOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Select
                      label="Subject"
                      value={editingSchedule.subject}
                      onChange={(value) => setEditingSchedule((c) => ({ ...c!, subject: value }))}
                      options={subjectOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Select
                      label="Instructor"
                      value={editingSchedule.instructor}
                      onChange={(value) => setEditingSchedule((c) => ({ ...c!, instructor: value }))}
                      options={instructorOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Select
                      label="Day"
                      value={editingSchedule.day}
                      onChange={(value) => setEditingSchedule((c) => ({ ...c!, day: value }))}
                      options={dayOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Select
                      label="Time"
                      value={editingSchedule.time}
                      onChange={(value) => setEditingSchedule((c) => ({ ...c!, time: value }))}
                      options={timeOptions}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Select
                      label="Room"
                      value={editingSchedule.room}
                      onChange={(value) => setEditingSchedule((c) => ({ ...c!, room: value }))}
                      options={roomOptions}
                    />
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
            <DialogContent className="w-[95vw] sm:max-w-sm">
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
