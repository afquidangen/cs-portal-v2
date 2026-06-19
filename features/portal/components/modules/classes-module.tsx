"use client"

import { useMemo, useState } from "react"
import { Award, BookMarked, BookOpen, CalendarDays, ClipboardList, GraduationCap, Layers3, Library, Pencil, Plus, School, Trash2, Users, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TimePicker, formatScheduleTime } from "@/components/ui/time-picker"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { ScheduleItem } from "../../data/portal-data"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ──────────────────────────────────────────────
   Faculty view
   ────────────────────────────────────────────── */
function FacultyView({ model }: { model: PortalModuleProps["model"] }) {
  const {
    editingStudentId, facultyClassSections, facultyClassStudents,
    handleDeleteRosterStudent, handleToggleEnrolled, handleSaveStudent, resetStudentDraft,
    selectedClassSection, setSelectedClassSection,
    setStudentDraft, startEditStudent, studentDraft,
    users, setUsers,
  } = model

  const [facultyDeleteId, setFacultyDeleteId] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Current Section", value: selectedClassSection, note: "Faculty roster view" },
          { label: "Students", value: String(facultyClassStudents.length), note: "Listed in this section" },
          { label: "Enrolled", value: String(facultyClassStudents.filter((student) => student.enrolled).length), note: "Currently active" },
        ].map((item) => (
          <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
            <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm">
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
                ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                : "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
            }
          >
            {section}
          </button>
        ))}
      </div>

      <Panel title="Student Management" eyebrow={`${selectedClassSection} \u2022 ${facultyClassStudents.length} students`}>
        <form onSubmit={handleSaveStudent} className="edu-bg-soft-glacier mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--edu-border-glacier)] p-4">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">Student ID</label>
            <Input value={studentDraft.id} onChange={(e) => setStudentDraft((c) => ({ ...c, id: e.target.value }))} placeholder="2024-001245" className="h-10 rounded-lg" />
          </div>
          <div className="min-w-0 flex-[1.5]">
            <label className="mb-1 block text-sm font-medium text-foreground">Full name</label>
            <Input value={studentDraft.name} onChange={(e) => setStudentDraft((c) => ({ ...c, name: e.target.value }))} placeholder="Juan Dela Cruz" className="h-10 rounded-lg" />
          </div>
          <Button type="submit" className="rounded-lg">
            {editingStudentId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {editingStudentId ? "Update" : "Add"}
          </Button>
          {editingStudentId ? (
            <Button type="button" variant="outline" onClick={() => resetStudentDraft(selectedClassSection)} className="rounded-lg">
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
            {facultyClassStudents.map((student) => {
              const user = users.find((u) => u.id === student.id)
              return (
              <div key={student.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/25 hover:shadow-md">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="size-12 shrink-0 ring-1 ring-border">
                    <AvatarImage src={user?.photoUrl} alt={student.name} className="object-cover" />
                    <AvatarFallback className="bg-muted text-xs text-foreground">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{student.name}</p>
                    <p className="truncate text-sm text-foreground/70">{student.id}</p>
                  </div>
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
            )})}
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
    handleToggleEnrolled,
    newSectionName, scheduleDraft, selectedClassYear, setNewSectionName,
    setScheduleDraft, setSelectedClassYear, setRoster, setUsers, users, yearSections, roster,
    semesters, curricula,
  } = model

  const [adminTab, setAdminTab] = useState("Sections")
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = useState(
    semesters.find((s) => s.status === "Active")?.id ?? semesters[0]?.id ?? ""
  )
  const [rosterDraft, setRosterDraft] = useState({ id: "", name: "", section: "" })
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null)
  const [deleteRosterId, setDeleteRosterId] = useState<string | null>(null)
  const [selectedRosterSection, setSelectedRosterSection] = useState("All Sections")
  const [selectedScheduleYear, setSelectedScheduleYear] = useState("All Years")
  const [selectedScheduleSection, setSelectedScheduleSection] = useState("All Sections")
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)
  const [addScheduleYear, setAddScheduleYear] = useState("")
  const [expandedYearForSections, setExpandedYearForSections] = useState<string | null>(null)
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false)

  const activeSemester = semesters.find((s) => s.id === selectedSemesterId)

  const sectionOptions = useMemo(() => yearSections.flatMap((y) => y.sections), [yearSections])

  const yearOptionsList = useMemo(() => yearSections.map((y) => y.year), [yearSections])

  const addSectionOptions = useMemo(() => {
    if (!addScheduleYear) return []
    const found = yearSections.find((y) => y.year === addScheduleYear)
    return found?.sections ?? []
  }, [addScheduleYear, yearSections])
  const scheduleYearOptions = useMemo(
    () => ["All Years", ...yearSections.map((y) => y.year)],
    [yearSections]
  )
  const scheduleSectionOptions = useMemo(() => {
    if (selectedScheduleYear === "All Years")
      return ["All Sections", ...yearSections.flatMap((y) => y.sections)]
    const found = yearSections.find((y) => y.year === selectedScheduleYear)
    return ["All Sections", ...(found?.sections ?? [])]
  }, [selectedScheduleYear, yearSections])
  const curriculumSubjectOptions = useMemo(() => {
    return curricula.flatMap((c) =>
      c.terms.flatMap((t) =>
        t.subjects.map((s) => `${s.code} - ${s.name}`)
      )
    )
  }, [curricula])

  function getCurriculumSubjects(year: string, semesterType: string): string[] {
    const results: string[] = []
    for (const c of curricula) {
      for (const term of c.terms) {
        if (term.year === year && term.semester === semesterType) {
          for (const sub of term.subjects) {
            results.push(`${sub.code} - ${sub.name}`)
          }
        }
      }
    }
    return results
  }

  function getSemesterType(semesterId: string): string {
    return semesters.find((s) => s.id === semesterId)?.semester ?? ""
  }

  const curriculumOptions = useMemo(() => curricula.map((c) => c.name), [curricula])

  function getCurriculumId(name: string): string {
    return curricula.find((c) => c.name === name)?.id ?? ""
  }

  function getSubjectsForCurriculum(curriculumId: string, year: string, semesterType: string): string[] {
    const curriculum = curricula.find((c) => c.id === curriculumId)
    if (!curriculum) return []
    const results: string[] = []
    for (const term of curriculum.terms) {
      if (term.year === year && term.semester === semesterType) {
        for (const sub of term.subjects) {
          results.push(`${sub.code} - ${sub.name}`)
        }
      }
    }
    return results
  }

  const instructorOptions = useMemo(() => users.filter((u) => u.role === "faculty").map((u) => u.name), [users])

  const semesterLabels = useMemo(
    () => semesters.map((s) => `${s.semester} - ${s.schoolYearStart}/${s.schoolYearEnd}`),
    [semesters]
  )

  const selectedYear = yearSections.find((y) => y.year === selectedClassYear)

  const sectionRoster = useMemo(() => {
    if (!selectedYear) return []
    const sections = selectedYear.sections
    return roster.filter((s) => {
      if (!sections.includes(s.section)) return false
      if (selectedRosterSection !== "All Sections" && s.section !== selectedRosterSection) return false
      return true
    })
  }, [roster, selectedYear, selectedRosterSection])

  const studentsByYearLevel = useMemo(() => {
    const studentUsers = users.filter((u) => u.role === "student")
    const counts: Record<string, number> = {
      "First Year": 0,
      "Second Year": 0,
      "Third Year": 0,
      "Fourth Year": 0,
    }
    for (const u of studentUsers) {
      if (u.currentYearLevel && counts[u.currentYearLevel] !== undefined) {
        counts[u.currentYearLevel]++
      }
    }
    return counts
  }, [users])

  const studentsBySection = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const section of sectionOptions) {
      counts[section] = roster.filter((r) => r.section === section).length
    }
    return counts
  }, [roster, sectionOptions])

  const expandedYearSections = useMemo(() => {
    if (!expandedYearForSections) return []
    return yearSections.find((y) => y.year === expandedYearForSections)?.sections ?? []
  }, [expandedYearForSections, yearSections])

  const filteredSchedules = useMemo(() => {
    let result = classSchedules
    if (selectedSemesterId) {
      result = result.filter((s) => s.semesterId === selectedSemesterId)
    }
    if (selectedScheduleYear !== "All Years") {
      const sectionsInYear = yearSections.find((y) => y.year === selectedScheduleYear)?.sections ?? []
      result = result.filter((s) => sectionsInYear.includes(s.section))
    }
    if (selectedScheduleSection !== "All Sections") {
      result = result.filter((s) => s.section === selectedScheduleSection)
    }
    return result
  }, [classSchedules, selectedSemesterId, selectedScheduleYear, selectedScheduleSection, yearSections])

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <School className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <CalendarDays className="size-4" />
              Classes and Enrollment
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Classes
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage year sections, student rosters, class schedules, instructors, rooms, and semester class blocks.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Year Levels", value: String(yearSections.length), note: "Configured groups", icon: Layers3 },
          { label: "Sections", value: String(sectionOptions.length), note: "Across all years", icon: Users },
          { label: "Roster", value: String(roster.length), note: "Student records", icon: ClipboardList },
          { label: "Classes", value: String(filteredSchedules.length), note: "Selected semester", icon: CalendarDays },
        ].map((item) => {
          const Icon = item.icon

          return (
          <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
              </div>
              <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                <Icon className="size-5" />
              </span>
            </div>
          </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {[
          { key: "Sections", label: "Year Sections", icon: Users },
          { key: "Roster", label: "Student Roster", icon: BookMarked },
          { key: "Schedules", label: "Schedules", icon: CalendarDays },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setAdminTab(tab.key)}
              className={
                adminTab === tab.key
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

      {/* ── Year Sections ── */}
      {adminTab === "Sections" ? (
        <Panel title="Year Sections" eyebrow="Manage year levels and sections">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "First Year", icon: GraduationCap },
              { label: "Second Year", icon: Library },
              { label: "Third Year", icon: BookOpen },
              { label: "Fourth Year", icon: Award },
            ].map(({ label, icon: Icon }) => {
              const year = yearSections.find((y) => y.year === label)
              const count = year?.sections.length ?? 0
              const active = selectedClassYear === label
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedClassYear(label)}
                  className={`edu-bg-soft-glacier rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    active
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-[var(--edu-border-glacier)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{label}</p>
                      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{count}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{count === 1 ? "section" : "sections"}</p>
                    </div>
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                      active ? "bg-primary text-primary-foreground" : "edu-lapis"
                    }`}>
                      <Icon className="size-5" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sections under {selectedClassYear}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedYear?.sections.map((section) => (
                <div
                  key={section}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
                >
                  <Users className="size-4 text-muted-foreground" />
                  {section}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setNewSectionName("")
                  setAddSectionDialogOpen(true)
                }}
                className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary hover:shadow-sm"
              >
                <Plus className="size-4" />
                Add Section
              </button>
            </div>
          </div>

          <Dialog open={addSectionDialogOpen} onOpenChange={setAddSectionDialogOpen}>
            <DialogContent className="w-[95vw] sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Section</DialogTitle>
                <DialogDescription>Add a new section under {selectedClassYear}</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  handleAddClassSection(e)
                  setAddSectionDialogOpen(false)
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Section name</label>
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="e.g. BSCS 1E"
                    className="h-10 rounded-lg"
                    autoFocus
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="ghost" onClick={() => setAddSectionDialogOpen(false)}>Cancel</Button>
                  <Button type="submit"><Plus className="size-4" /> Add</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Panel>
      ) : null}

        {/* ── Student Roster ── */}
      {adminTab === "Roster" ? (
        <Panel
          title="Student Roster"
          eyebrow={`${selectedClassYear} \u2022 ${sectionRoster.length} students`}
        >
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            {[
              { label: "First Year", count: studentsByYearLevel["First Year"], icon: GraduationCap },
              { label: "Second Year", count: studentsByYearLevel["Second Year"], icon: Library },
              { label: "Third Year", count: studentsByYearLevel["Third Year"], icon: BookOpen },
              { label: "Fourth Year", count: studentsByYearLevel["Fourth Year"], icon: Award },
            ].map((item) => {
              const Icon = item.icon
              const active = expandedYearForSections === item.label
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setExpandedYearForSections(null)
                    } else {
                      setExpandedYearForSections(item.label)
                      setSelectedClassYear(item.label)
                      setSelectedRosterSection("All Sections")
                    }
                  }}
                  className={`edu-bg-soft-glacier rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    active
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-[var(--edu-border-glacier)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{item.count}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {active ? "Click to hide sections" : "Click to show sections"}
                      </p>
                    </div>
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                      active ? "bg-primary text-primary-foreground" : "edu-lapis"
                    }`}>
                      <Icon className="size-5" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {expandedYearForSections ? (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Sections under {expandedYearForSections}
              </p>
              <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
                {[
                  { section: "All Sections" },
                  ...expandedYearSections.map((s) => ({ section: s })),
                ].map(({ section }) => {
                  const count = section === "All Sections"
                    ? (studentsByYearLevel[expandedYearForSections] ?? 0)
                    : (studentsBySection[section] ?? 0)
                  const active = section === "All Sections"
                    ? selectedRosterSection === "All Sections"
                    : selectedRosterSection === section
                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => {
                        setSelectedClassYear(expandedYearForSections)
                        setSelectedRosterSection(section)
                      }}
                      className={`edu-bg-soft-glacier rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                        active
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-[var(--edu-border-glacier)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Section</p>
                          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{count}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{section}</p>
                        </div>
                        <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                          <Users className="size-5" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {sectionRoster.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No students enrolled in this year level.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Student</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {sectionRoster.map((student) => {
                    const user = users.find((u) => u.id === student.id)
                    return (
                    <tr key={student.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 shrink-0 ring-1 ring-border">
                            <AvatarImage src={user?.photoUrl} alt={student.name} className="object-cover" />
                            <AvatarFallback className="bg-muted text-xs text-foreground">{getInitials(student.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{student.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{student.id}</p>
                          </div>
                        </div>
                      </td>
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
                  )})}
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                <CalendarDays className="size-5 text-primary" />
                Manage Classes
              </h3>
              <p className="text-sm text-muted-foreground">Select a semester then add classes</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={semesters.find((s) => s.id === selectedSemesterId)
                  ? `${semesters.find((s) => s.id === selectedSemesterId)!.semester} - ${semesters.find((s) => s.id === selectedSemesterId)!.schoolYearStart}/${semesters.find((s) => s.id === selectedSemesterId)!.schoolYearEnd}`
                  : semesterLabels[0] ?? ""}
                onChange={(v) => {
                  const idx = semesterLabels.indexOf(v)
                  if (idx !== -1) {
                    const id = semesters[idx]?.id ?? ""
                    setSelectedSemesterId(id)
                    setScheduleDraft((c) => ({ ...c, semesterId: id }))
                  }
                }}
                options={semesterLabels}
              />
              <Select
                value={selectedScheduleYear}
                onChange={(v) => {
                  setSelectedScheduleYear(v)
                  setSelectedScheduleSection("All Sections")
                }}
                options={scheduleYearOptions}
                className="min-w-[120px]"
              />
              <Select
                value={selectedScheduleSection}
                onChange={setSelectedScheduleSection}
                options={scheduleSectionOptions}
                className="min-w-[140px]"
              />
              <Button onClick={() => {
                setScheduleDraft((c) => ({ ...c, semesterId: selectedSemesterId }))
                setAddScheduleOpen(true)
              }} className="rounded-2xl">
                <Plus className="size-4" /> Add Class
              </Button>
            </div>
          </div>

          <Panel
            title={`Classes (${filteredSchedules.length})`}
            eyebrow={activeSemester ? `${activeSemester.semester} - ${activeSemester.schoolYearStart}/${activeSemester.schoolYearEnd}` : "No semester selected"}
          >
            {filteredSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trash2 className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No classes added for this semester yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-muted text-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Subject</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Instructor</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Days</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Time</th>
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
                        <td className="whitespace-nowrap px-4 py-3 text-foreground/80">{item.day}</td>
                        <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">{formatScheduleTime(item.time)}</td>
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

          {/* ── Add New Class Dialog ── */}
          <Dialog open={addScheduleOpen} onOpenChange={(o) => {
            if (o) {
              const firstYear = yearOptionsList[0] ?? ""
              setAddScheduleYear(firstYear)
              setScheduleDraft((c) => ({
                ...c,
                semesterId: selectedSemesterId,
                day: "", time: "", subject: "", room: "", instructor: "", section: "", curriculumId: "",
              }))
            }
            if (!o) setAddScheduleOpen(false)
          }}>
            <DialogContent className="flex flex-col w-full sm:max-w-lg md:max-w-xl max-h-[85dvh] p-0 gap-0">
              <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
                <DialogTitle className="text-lg sm:text-xl text-foreground">Add New Class</DialogTitle>
                <DialogDescription className="pt-1 text-muted-foreground">Create a class under {activeSemester ? `${activeSemester.semester} - ${activeSemester.schoolYearStart}/${activeSemester.schoolYearEnd}` : "selected semester"}</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleCreateSchedule(e)
                setAddScheduleOpen(false)
              }} className="flex flex-col min-h-0 flex-1">
                <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Year</p>
                      <Select
                        value={addScheduleYear}
                        onChange={(v) => {
                          setAddScheduleYear(v)
                          setScheduleDraft((c) => ({ ...c, section: "", curriculumId: "" }))
                        }}
                        options={yearOptionsList}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Section *</p>
                      <Select
                        value={scheduleDraft.section}
                        onChange={(value) => setScheduleDraft((c) => ({ ...c, section: value }))}
                        options={addSectionOptions}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Curriculum *</p>
                      <Select
                        value={curricula.find((c) => c.id === scheduleDraft.curriculumId)?.name ?? ""}
                        onChange={(value) => {
                          setScheduleDraft((c) => ({ ...c, curriculumId: getCurriculumId(value), subject: "" }))
                        }}
                        options={curriculumOptions}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Instructor *</p>
                      <Select
                        value={scheduleDraft.instructor}
                        onChange={(value) => setScheduleDraft((c) => ({ ...c, instructor: value }))}
                        options={instructorOptions}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Subject *</p>
                      <Select
                        value={scheduleDraft.subject}
                        onChange={(value) => setScheduleDraft((c) => ({ ...c, subject: value }))}
                        options={
                          addScheduleYear && selectedSemesterId && scheduleDraft.curriculumId
                            ? getSubjectsForCurriculum(scheduleDraft.curriculumId, addScheduleYear, getSemesterType(selectedSemesterId))
                            : addScheduleYear && selectedSemesterId
                            ? getCurriculumSubjects(addScheduleYear, getSemesterType(selectedSemesterId))
                            : curriculumSubjectOptions
                        }
                        contentClassName="max-h-48 overflow-y-auto"
                      />
                    </div>
                    <div />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Days *</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["M", "T", "W", "Th", "F"].map((day) => {
                          const days = scheduleDraft.day ? scheduleDraft.day.split(/\s+/).filter(Boolean) : []
                          const checked = days.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = checked
                                  ? days.filter((d) => d !== day)
                                  : [...days, day]
                                setScheduleDraft((c) => ({ ...c, day: newDays.join(" ") }))
                              }}
                              className={
                                checked
                                  ? "inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                                  : "inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
                              }
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Room</p>
                      <Input
                        type="text"
                        value={scheduleDraft.room}
                        onChange={(e) => setScheduleDraft((c) => ({ ...c, room: e.target.value }))}
                        placeholder="e.g. Room 101"
                        className="h-11 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Start Time</p>
                      <TimePicker
                        value={scheduleDraft.time?.split(" - ")[0] ?? ""}
                        onChange={(val) => {
                          const end = scheduleDraft.time?.split(" - ")[1] ?? ""
                          setScheduleDraft((c) => ({ ...c, time: end ? `${val} - ${end}` : val }))
                        }}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">End Time</p>
                      <TimePicker
                        value={scheduleDraft.time?.split(" - ")[1] ?? ""}
                        onChange={(val) => {
                          const start = scheduleDraft.time?.split(" - ")[0] ?? ""
                          setScheduleDraft((c) => ({ ...c, time: start ? `${start} - ${val}` : val }))
                        }}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="shrink-0 px-5 pb-5 pt-4 border-t border-border gap-3 flex-col-reverse sm:flex-row">
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" className="w-full sm:w-auto">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="w-full sm:w-auto"><Plus className="size-4" /> Add Class</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingSchedule} onOpenChange={(open) => { if (!open) setEditingSchedule(null) }}>
            <DialogContent className="flex flex-col w-full sm:max-w-lg max-h-[85dvh] p-0 gap-0">
              <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
                <DialogTitle>Edit Class</DialogTitle>
              </DialogHeader>
              {editingSchedule ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleUpdateSchedule(editingSchedule)
                    setEditingSchedule(null)
                  }}
                  className="flex flex-col min-h-0 flex-1"
                >
                  <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Year</p>
                        <Select
                          value={
                            yearSections.find((y) => y.sections.includes(editingSchedule.section))?.year ?? ""
                          }
                          onChange={(v) => {
                            const year = yearSections.find((y) => y.year === v)
                            const firstSection = year?.sections[0] ?? editingSchedule.section
                            setEditingSchedule((c) => ({ ...c!, section: firstSection }))
                          }}
                          options={yearOptionsList}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Section</p>
                        <Select
                          value={editingSchedule.section}
                          onChange={(value) => setEditingSchedule((c) => ({ ...c!, section: value }))}
                          options={
                            yearSections.find((y) => y.sections.includes(editingSchedule.section))
                              ?.sections ?? sectionOptions
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Curriculum</p>
                        <Select
                          value={curricula.find((c) => c.id === editingSchedule.curriculumId)?.name ?? ""}
                          onChange={(value) => setEditingSchedule((c) => ({ ...c!, curriculumId: getCurriculumId(value) }))}
                          options={curriculumOptions}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Instructor</p>
                        <Select
                          value={editingSchedule.instructor}
                          onChange={(value) => setEditingSchedule((c) => ({ ...c!, instructor: value }))}
                          options={instructorOptions}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Subject *</p>
                        <Select
                          value={editingSchedule.subject}
                          onChange={(value) => setEditingSchedule((c) => ({ ...c!, subject: value }))}
                          options={
                            (() => {
                              const editYear = yearSections.find((y) => y.sections.includes(editingSchedule.section))?.year
                              const editSemesterType = getSemesterType(editingSchedule.semesterId)
                              if (editYear && editSemesterType && editingSchedule.curriculumId) {
                                return getSubjectsForCurriculum(editingSchedule.curriculumId, editYear, editSemesterType)
                              }
                              return editYear && editSemesterType
                                ? getCurriculumSubjects(editYear, editSemesterType)
                                : curriculumSubjectOptions
                            })()
                          }
                          contentClassName="max-h-48 overflow-y-auto"
                        />
                      </div>
                      <div />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Days</p>
                        <div className="flex flex-wrap gap-1.5">
                          {["M", "T", "W", "Th", "F"].map((day) => {
                            const days = editingSchedule.day ? editingSchedule.day.split(/\s+/).filter(Boolean) : []
                            const checked = days.includes(day)
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const newDays = checked
                                    ? days.filter((d) => d !== day)
                                    : [...days, day]
                                  setEditingSchedule((c) => ({ ...c!, day: newDays.join(" ") }))
                                }}
                                className={
                                  checked
                                    ? "inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                                    : "inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
                                }
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Room</p>
                        <Input
                          type="text"
                          value={editingSchedule.room}
                          onChange={(e) => setEditingSchedule((c) => ({ ...c!, room: e.target.value }))}
                          placeholder="e.g. Room 101"
                          className="h-11 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">Start Time</p>
                        <TimePicker
                          value={editingSchedule.time?.split(" - ")[0] ?? ""}
                          onChange={(val) => {
                            const end = editingSchedule.time?.split(" - ")[1] ?? ""
                            setEditingSchedule((c) => ({ ...c!, time: end ? `${val} - ${end}` : val }))
                          }}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 text-sm font-medium text-foreground">End Time</p>
                        <TimePicker
                          value={editingSchedule.time?.split(" - ")[1] ?? ""}
                          onChange={(val) => {
                            const start = editingSchedule.time?.split(" - ")[0] ?? ""
                            setEditingSchedule((c) => ({ ...c!, time: start ? `${start} - ${val}` : val }))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="shrink-0 px-5 pb-5 pt-4 border-t border-border gap-3">
                    <Button type="button" variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
                    <Button type="submit"><Pencil className="size-4" /> Update Class</Button>
                  </DialogFooter>
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
