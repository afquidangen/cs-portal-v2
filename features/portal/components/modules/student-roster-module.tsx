"use client"

import { useMemo, useState } from "react"
import {
  BookMarked,
  Layers3,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { getSubjectRoster } from "../../lib/subject-roster"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

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
        .filter((g) => {
          if (g.deletedAt) return false
          if (normalize(g.subject ?? "") !== normalize(selectedSubject ?? "")) return false
          if (normalize(g.section ?? "") !== normalize(addSection)) return false
          return g.remarks !== "Passed"
        })
        .map((g) => g.studentId)
    )

    return users.filter((u) => {
      if (u.role !== "student") return false
      const name = (u.name ?? "").replace(/\s+/g, "").toLowerCase()
      const id = (u.id ?? "").toLowerCase()
      return !alreadyInSubject.has(u.id) && (name.includes(search) || id.includes(search))
    })
  }, [studentSearch, users, grades, selectedSubject, addSection])

  function handleAdd(studentId: string, studentName: string) {
    if (!currentSubject?.code || !addSection) return
    handleAddStudentToSubject(studentId, studentName, selectedSubject!, addSection, currentSubject.code)
    setAddDialog(false)
    setStudentSearch("")
    setAddSection("")
  }

  function openAddDialog() {
    setStudentSearch("")
    setAddSection(selectedSection ?? sectionOptions[0] ?? "")
    setAddDialog(true)
  }

  const rosterStudents = useMemo(() => {
    if (!selectedSubject || !currentSubject) return []
    return getSubjectRoster({
      roster,
      grades,
      users,
      subject: selectedSubject,
      subjectCode: currentSubject.code,
      section: selectedSection,
      sections: sectionOptions,
    })
  }, [grades, roster, users, selectedSubject, selectedSection, sectionOptions, currentSubject])

  return (
    <div className="space-y-4 pb-6 pt-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Student Roster</h1>
        <p className="mt-2 text-sm text-slate-600">Review enrolled students by subject and section.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Subjects", value: String(subjectOptions.length), icon: BookMarked },
          { label: "Sections", value: String(sectionOptions.length), icon: Layers3 },
          { label: "Visible Students", value: String(rosterStudents.length), icon: Users },
        ].map((item) => {
          const Icon = item.icon

          return (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Icon className="size-5" />
              </span>
            </div>
          </div>
          )
        })}
      </div>

      {/* Subject selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <BookMarked className="size-4" />
          Subject Selection
        </p>
        {subjectOptions.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
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
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Layers3 className="size-4" />
                Section Filter
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["All Sections", ...sectionOptions].map((sec) => {
                  const active = sec === "All Sections" ? !selectedSection : selectedSection === sec
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec === "All Sections" ? null : sec)}
                      className={
                        active
                          ? "rounded-md border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm"
                          : "rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                      }
                    >
                      {sec}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Roster table */}
          <Panel
            title="Student Roster"
            eyebrow={`${selectedSubject} - ${sectionOptions.join(", ")} - ${rosterStudents.length} students`}
          >
            <div className="mb-3 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 rounded-md border-slate-200"
                onClick={openAddDialog}
              >
                <UserPlus className="size-3.5 mr-1" /> Add Student
              </Button>
            </div>
            {rosterStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-14 text-center">
                <Users className="mb-3 size-10 text-slate-300" />
                <p className="text-sm text-slate-500">
                  No students enrolled in this subject yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Student</th>
                      <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide sm:table-cell">Section</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {rosterStudents.map((entry) => {
                      const user = users.find((u) => u.id === entry.id)
                      const studentType = user?.studentType
                      return (
                        <tr key={entry.id} className="transition-colors hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10 shrink-0 ring-1 ring-border">
                                <AvatarImage src={user?.photoUrl} alt={entry.name} className="object-cover" />
                                <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-600">{getInitials(entry.lastName ? `${entry.lastName} ${entry.firstName ?? ""}` : entry.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-950">{entry.lastName ? `${entry.lastName}, ${entry.firstName ?? ""}${entry.middleName ? ` ${entry.middleName}` : ""}` : entry.name}</p>
                                <p className="truncate text-xs text-slate-500">{entry.id}</p>
                                {studentType && IRREGULAR_TYPES.includes(studentType) ? (
                                  <StatusBadge value={studentType} />
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                            {entry.section}
                          </td>
                          <td className="px-4 py-3">
                            {entry.enrolled ? (
                              entry.released ? <StatusBadge value="Released" /> : <StatusBadge value="Draft" />
                            ) : (
                              <span className="text-xs text-slate-500">Not Enrolled</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {entry.enrolled ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md border-slate-200 text-red-500 hover:text-red-600"
                                onClick={() => setConfirmUnenroll({ gradeId: entry.gradeId, studentId: entry.id, section: entry.section })}
                              >
                                <Trash2 className="size-3.5 mr-1" /> Unenroll
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
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
            <BookMarked className="mb-3 size-12 text-slate-300" />
            <p className="text-sm text-slate-500">
              Choose a subject above to view and manage enrolled students.
            </p>
          </div>
        </Panel>
      )}

      <Dialog open={!!confirmUnenroll} onOpenChange={(o) => { if (!o) setConfirmUnenroll(null) }}>
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-950">Confirm Unenroll</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-slate-600">
            Remove this student&apos;s enrollment from this subject? The grade record will be permanently deleted.
          </p>
          <DialogFooter className="mt-2 gap-2">
            <Button type="button" variant="outline" className="rounded-md border-slate-200" onClick={() => setConfirmUnenroll(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => {
              if (confirmUnenroll) handleUnenrollFromSubject(confirmUnenroll.studentId, confirmUnenroll.section, confirmUnenroll.gradeId)
              setConfirmUnenroll(null)
            }}>
              <Trash2 className="size-3.5 mr-1" /> Unenroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialog} onOpenChange={(o) => { if (!o) { setAddDialog(false); setStudentSearch(""); setAddSection("") } }}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-950">Add Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Select a section</Label>
            <div className="flex flex-wrap gap-1.5">
              {sectionOptions.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => { setAddSection(sec); setStudentSearch("") }}
                  className={
                    addSection === sec
                      ? "rounded-md border border-blue-600 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm"
                      : "rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
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
                <Label htmlFor="student-search" className="text-sm font-medium text-slate-700">Search student by ID or name</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="student-search"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type to search..."
                    className="h-10 rounded-md border-slate-200 bg-white pl-9 text-slate-950 placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-2 max-h-[260px] space-y-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-500">
                    {studentSearch ? "No matching students found." : "Type an ID or name to search."}
                  </p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAdd(u.id, u.name ?? u.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-950">{u.name ?? u.id}</span>
                      <span className="text-xs text-slate-500">{u.id}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="mb-2 size-8 text-slate-300" />
              <p className="text-sm text-slate-500">Select a section above to search for students.</p>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" className="rounded-md border-slate-200" onClick={() => { setAddDialog(false); setStudentSearch(""); setAddSection("") }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const IRREGULAR_TYPES = ["Irregular", "Transferee", "Shifter"]
