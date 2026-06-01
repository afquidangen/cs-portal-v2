"use client"

import { Pencil, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function ClassesModule({ model }: PortalModuleProps) {
  const {
    classSchedules,
    editingStudentId,
    facultyClassSections,
    facultyClassStudents,
    handleAddClassSection,
    handleCreateSchedule,
    handleSaveStudent,
    handleScheduleUpload,
    newSectionName,
    resetStudentDraft,
    role,
    scheduleDraft,
    selectedClassSection,
    selectedClassYear,
    setNewSectionName,
    setRoster,
    setScheduleDraft,
    setSelectedClassSection,
    setSelectedClassYear,
    setStudentDraft,
    startEditStudent,
    studentDraft,
    yearSections,
  } = model

  if (role === "faculty") {
    return (
      <div className="space-y-5">
        <Panel title="Manage Class" eyebrow="Sections handled">
          <div className="flex flex-wrap gap-2">
            {facultyClassSections.map((section) => (
              <Button
                key={section}
                type="button"
                variant={selectedClassSection === section ? "default" : "outline"}
                onClick={() => {
                  setSelectedClassSection(section)
                  setStudentDraft((current) => ({ ...current, section }))
                }}
                className="rounded-xl"
              >
                {section}
              </Button>
            ))}
          </div>

          <form
            onSubmit={handleSaveStudent}
            className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.3fr_auto_auto]"
          >
            <Input
              value={studentDraft.id}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  id: event.target.value,
                }))
              }
              placeholder="Student ID"
              className="h-10 rounded-2xl"
            />
            <Input
              value={studentDraft.name}
              onChange={(event) =>
                setStudentDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Student name"
              className="h-10 rounded-2xl"
            />
            <Button type="submit" className="rounded-2xl">
              {editingStudentId ? (
                <Pencil className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {editingStudentId ? "Update" : "Add"}
            </Button>
            {editingStudentId ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => resetStudentDraft(selectedClassSection)}
                className="rounded-2xl"
              >
                <X className="size-4" />
                Cancel
              </Button>
            ) : null}
          </form>
        </Panel>

        <Panel title={selectedClassSection} eyebrow="Students">
          <div className="space-y-3">
            {facultyClassStudents.map((student) => (
              <label
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-foreground/70">
                    {student.id} - {student.section}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.preventDefault()
                      startEditStudent(student)
                    }}
                    className="rounded-2xl"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>

                  <input
                    type="checkbox"
                    checked={student.enrolled}
                    onChange={(event) =>
                      setRoster((current) =>
                        current.map((item) =>
                          item.id === student.id
                            ? { ...item, enrolled: event.target.checked }
                            : item
                        )
                      )
                    }
                    className="size-5 rounded-md border border-border bg-background accent-primary"
                  />
                </div>
              </label>
            ))}
          </div>
        </Panel>
      </div>
    )
  }

  const selectedYear = yearSections.find((item) => item.year === selectedClassYear)

  return (
    <div className="space-y-5">
      <Panel title="Year Sections" eyebrow="Click a year to view sections">
        <div className="flex flex-wrap gap-2">
          {yearSections.map((item) => (
            <Button
              key={item.year}
              type="button"
              variant={selectedClassYear === item.year ? "default" : "outline"}
              onClick={() => setSelectedClassYear(item.year)}
              className="rounded-xl"
            >
              {item.year}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedYear?.sections.map((section) => (
            <StatusBadge key={section} value={section} />
          ))}
        </div>

        <form
          onSubmit={handleAddClassSection}
          className="mt-4 flex max-w-md gap-2"
        >
          <Input
            value={newSectionName}
            onChange={(event) => setNewSectionName(event.target.value)}
            placeholder="Add section, e.g. BSCS 1E"
            className="h-10 rounded-2xl"
          />
          <Button type="submit" className="rounded-2xl">
            Add
          </Button>
        </form>
      </Panel>

      <Panel title="Class Schedule Upload" eyebrow="Manual or Excel .xlsx">
        <form
          onSubmit={handleCreateSchedule}
          className="mb-4 grid gap-3 lg:grid-cols-6"
        >
          <Input
            value={scheduleDraft.section}
            onChange={(event) =>
              setScheduleDraft((current) => ({
                ...current,
                section: event.target.value,
              }))
            }
            placeholder="Section"
            className="h-10 rounded-2xl"
          />
          <Input
            value={scheduleDraft.subject}
            onChange={(event) =>
              setScheduleDraft((current) => ({
                ...current,
                subject: event.target.value,
              }))
            }
            placeholder="Subject"
            className="h-10 rounded-2xl"
          />
          <Input
            value={scheduleDraft.instructor}
            onChange={(event) =>
              setScheduleDraft((current) => ({
                ...current,
                instructor: event.target.value,
              }))
            }
            placeholder="Instructor"
            className="h-10 rounded-2xl"
          />
          <Input
            value={scheduleDraft.day}
            onChange={(event) =>
              setScheduleDraft((current) => ({
                ...current,
                day: event.target.value,
              }))
            }
            placeholder="Day"
            className="h-10 rounded-2xl"
          />
          <Input
            value={scheduleDraft.time}
            onChange={(event) =>
              setScheduleDraft((current) => ({
                ...current,
                time: event.target.value,
              }))
            }
            placeholder="Time"
            className="h-10 rounded-2xl"
          />
          <Button type="submit" className="rounded-2xl">
            <Plus className="size-4" />
            Add
          </Button>
          <Input
            value={scheduleDraft.room}
            onChange={(event) =>
              setScheduleDraft((current) => ({
                ...current,
                room: event.target.value,
              }))
            }
            placeholder="Room"
            className="h-10 rounded-2xl lg:col-span-5"
          />
        </form>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleScheduleUpload}
            className="h-10 rounded-2xl"
          />
          <Button type="button" variant="outline" className="rounded-2xl">
            Upload Schedule
          </Button>
        </div>
      </Panel>

      <Panel title="Encoded Schedules" eyebrow="Schedules and sections">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Section
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Subject
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Instructor
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Schedule
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Room
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-card">
              {classSchedules.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.section}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.subject}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.instructor}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.day}, {item.time}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.room}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
