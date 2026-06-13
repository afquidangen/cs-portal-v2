"use client"

import { useMemo, useState } from "react"
import {
  BookMarked,
  ClipboardList,
  Layers3,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function StudentRosterModule({ model }: PortalModuleProps) {
  const {
    facultySubjects,
    users,
    grades,
    roster,
    handleUnenrollFromSubject,
    handleAddStudentToSubject,
  } = model

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const subjectOptions = useMemo(
    () => facultySubjects.map((s) => s.subject),
    [facultySubjects]
  )

  const currentSubject = useMemo(
    () => facultySubjects.find((s) => s.subject === selectedSubject) ?? null,
    [facultySubjects, selectedSubject]
  )

  const sectionOptions = useMemo(
    () => currentSubject?.sections ?? [],
    [currentSubject]
  )

  const [confirmUnenroll, setConfirmUnenroll] = useState<{ gradeId?: string; studentId: string; section: string } | null>(null)

  const [addDialog, setAddDialog] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")
  const [addSection, setAddSection] = useState("")

  const filteredUsers = useMemo(() => {
    const search = studentSearch.replace(/\s+/g, "").toLowerCase()
    if (!search) return []
    if (!addSection) return []

    const normalize = (s?: string) => (s ?? "").replace(/\s+/g, "").toLowerCase()

    const alreadyInSubject = new Set(
      grades
        .filter((g) => normalize(g.subject) === normalize(selectedSubject ?? ""))
        .map((g) => g.studentId)
        .concat(
          roster
            .filter((r) => sectionOptions.some((s) => normalize(s) === normalize(r.section)) && r.enrolled)
            .map((r) => r.id)
        )
    )

    return users.filter((u) => {
      const name = (u.name ?? "").replace(/\s+/g, "").toLowerCase()
      const id = (u.id ?? "").toLowerCase()
      return !alreadyInSubject.has(u.id) && (name.includes(search) || id.includes(search))
    })
  }, [studentSearch, users, grades, roster, selectedSubject, sectionOptions, addSection])

  function handleAdd(studentId: string, studentName: string) {
    if (!currentSubject?.code || !addSection) return
    handleAddStudentToSubject(studentId, studentName, selectedSubject!, addSection, currentSubject.code)
    setAddDialog(false)
    setStudentSearch("")
  }

  const rosterStudents = useMemo(() => {
    if (!selectedSubject) return []

    const currentCode = currentSubject?.code ?? ""
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase()

    const passedIds = new Set(
      users
        .filter((u) =>
          (u.gradeHistory ?? []).some(
            (h) =>
              normalize(h.subjectCode) === normalize(currentCode) &&
              h.remarks?.toLowerCase() === "passed"
          )
        )
        .map((u) => u.id)
    )

    const passedIrregularIds = new Set(
      users
        .filter((u) =>
          irregularTypes.includes(u.studentType ?? "") &&
          (u.gradeHistory ?? []).some(
            (h) =>
              normalize(h.subjectCode) === normalize(currentCode) &&
              h.remarks?.toLowerCase() === "passed"
          )
        )
        .map((u) => u.id)
    )

    const gradeMap = new Map<
      string,
      { id: string; studentId: string; student: string; section: string; released: boolean }
    >()
    for (const g of grades) {
      if (
        g.subject === selectedSubject &&
        (selectedSection ? g.section === selectedSection : sectionOptions.includes(g.section))
      ) {
        gradeMap.set(g.studentId, {
          id: g.id,
          studentId: g.studentId,
          student: g.student,
          section: g.section,
          released: g.released ?? false,
        })
      }
    }

    const sections = selectedSection ? [selectedSection] : sectionOptions

    const result: {
      studentId: string
      student: string
      section: string
      gradeId?: string
      released: boolean
      enrolled: boolean
    }[] = []

    const seen = new Set<string>()

    for (const r of roster) {
      if (!sections.includes(r.section)) continue
      if (passedIrregularIds.has(r.id)) continue
      if (passedIds.has(r.id) && !gradeMap.has(r.id)) continue
      if (seen.has(r.id)) continue
      const grade = gradeMap.get(r.id)
      result.push({
        studentId: r.id,
        student: r.name,
        section: r.section,
        gradeId: grade?.id,
        released: grade?.released ?? false,
        enrolled: r.enrolled,
      })
      seen.add(r.id)
    }

    for (const [, g] of gradeMap) {
      if (!seen.has(g.studentId) && !passedIrregularIds.has(g.studentId)) {
        result.push({
          studentId: g.studentId,
          student: g.student,
          section: g.section,
          gradeId: g.id,
          released: g.released,
          enrolled: true,
        })
      }
    }

    return result.filter((e) => e.enrolled)
  }, [grades, roster, users, selectedSubject, selectedSection, sectionOptions, currentSubject?.code])

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <ClipboardList className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Users className="size-4" />
              Class Enrollment Directory
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Student Roster
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Select a subject and section to review enrolled students, draft grade status, and roster actions.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Subjects", value: String(subjectOptions.length), icon: BookMarked },
          { label: "Sections", value: String(sectionOptions.length), icon: Layers3 },
          { label: "Visible Students", value: String(rosterStudents.length), icon: Users },
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

      {/* Subject selector */}
      <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <BookMarked className="size-4" />
          Subject Selection
        </p>
        {subjectOptions.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No subjects assigned to you yet.
          </p>
        ) : (
          <Select
            label="Subject"
            value={selectedSubject ?? ""}
            onChange={(value) => {
              setSelectedSubject(value)
              setSelectedSection(null)
            }}
            options={subjectOptions}
          />
        )}
      </div>

      {selectedSubject ? (
        <>
          {/* Section filter */}
          {sectionOptions.length > 1 ? (
            <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers3 className="size-4" />
                Section Filter
              </p>
              <Select
                label="Section"
                value={selectedSection ?? "All Sections"}
                onChange={(value) => setSelectedSection(value === "All Sections" ? null : value)}
                options={["All Sections", ...sectionOptions]}
              />
            </div>
          ) : null}

          {/* Roster table */}
          <Panel
            title="Student Roster"
            eyebrow={`${selectedSubject} \u2022 ${sectionOptions.join(", ")} \u2022 ${rosterStudents.length} students`}
          >
            <div className="mb-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  setAddSection("")
                  setAddDialog(true)
                }}
              >
                <UserPlus className="size-3.5 mr-1" /> Add Student
              </Button>
            </div>
            {rosterStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Users className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No students enrolled in this subject yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-muted text-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Student ID</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Name</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Section</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {rosterStudents.map((entry) => {
                      const user = users.find((u) => u.id === entry.studentId)
                      const studentType = user?.studentType
                      return (
                        <tr key={entry.studentId} className="transition-colors hover:bg-muted/50">
                          <td className="max-w-[120px] truncate px-4 py-3 font-medium text-foreground">
                            {entry.studentId}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-foreground/80">
                            <div className="flex items-center gap-2">
                              <span>{entry.student}</span>
                              {studentType && irregularTypes.includes(studentType) ? (
                                <StatusBadge value={studentType} />
                              ) : null}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 text-foreground/80">
                            {entry.section}
                          </td>
                          <td className="px-4 py-3">
                            {entry.enrolled ? (
                              entry.released ? <StatusBadge value="Released" /> : <StatusBadge value="Draft" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Not Enrolled</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {entry.enrolled ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-red-500 hover:text-red-600"
                                onClick={() => setConfirmUnenroll({ gradeId: entry.gradeId, studentId: entry.studentId, section: entry.section })}
                              >
                                <Trash2 className="size-3.5 mr-1" /> Unenroll
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      ) : (
        <Panel title="Student Roster" eyebrow="Select a subject">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookMarked className="mb-3 size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Choose a subject above to view and manage enrolled students.
            </p>
          </div>
        </Panel>
      )}

      <Dialog open={!!confirmUnenroll} onOpenChange={(o) => { if (!o) setConfirmUnenroll(null) }}>
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Unenroll</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove this student&apos;s enrollment from this subject? The grade record will be permanently deleted.
          </p>
          <DialogFooter className="mt-2 gap-2">
            <Button variant="ghost" onClick={() => setConfirmUnenroll(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (confirmUnenroll) handleUnenrollFromSubject(confirmUnenroll.studentId, confirmUnenroll.section, confirmUnenroll.gradeId)
              setConfirmUnenroll(null)
            }}>
              <Trash2 className="size-3.5 mr-1" /> Unenroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialog} onOpenChange={(o) => { if (!o) { setAddDialog(false); setStudentSearch(""); setAddSection("") } }}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground/80">Select a section</Label>
            <div className="flex flex-wrap gap-1.5">
              {sectionOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => { setAddSection(sec); setStudentSearch("") }}
                  className={
                    addSection === sec
                      ? "rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      : "rounded-lg bg-muted px-3 py-1 text-xs font-medium text-foreground/70 transition hover:bg-muted/80"
                  }
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {addSection ? (
            <>
              <div className="space-y-3">
                <Label htmlFor="student-search" className="text-sm font-medium text-foreground/80">Search student by ID or name</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="student-search"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type to search..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-2 max-h-[260px] space-y-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {studentSearch ? "No matching students found." : "Type an ID or name to search."}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAdd(u.id, u.name ?? u.id)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{u.name ?? u.id}</span>
                      <span className="text-xs text-muted-foreground">{u.id}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Select a section above to search for students.</p>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => { setAddDialog(false); setStudentSearch(""); setAddSection("") }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const irregularTypes = ["Irregular", "Transferee", "Shifter", "Overstayed"]
