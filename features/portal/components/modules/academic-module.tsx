"use client"

import { useState } from "react"
import { Check, Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { semestersSeed, subjectsSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"
import { CurriculumModule } from "./curriculum-module"

export function AcademicModule() {
  const [subjects, setSubjects] = useState(subjectsSeed)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: "", totalUnits: "", instructor: "" })

  function startEdit(code: string) {
    const subject = subjects.find((s) => s.code === code)
    if (!subject) return
    setEditingId(code)
    setEditForm({
      title: subject.title,
      totalUnits: String(subject.totalUnits),
      instructor: subject.instructor,
    })
  }

  function saveEdit(code: string) {
    setSubjects((prev) =>
      prev.map((s) =>
        s.code === code
          ? {
              ...s,
              title: editForm.title || s.title,
              totalUnits: Number(editForm.totalUnits) || s.totalUnits,
              instructor: editForm.instructor || s.instructor,
            }
          : s
      )
    )
    setEditingId(null)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Semester Management" eyebrow="School year">
        <div className="space-y-3">
          {semestersSeed.map((semester) => (
            <div
              key={`${semester.name}-${semester.schoolYear}`}
              className="rounded-lg border border-slate-200 p-4"
            >
              <h4 className="font-semibold text-slate-950">
                {semester.name} {semester.schoolYear}
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                Enrollment: {semester.enrollment}
              </p>
              <p className="text-sm text-slate-500">
                Grade submission: {semester.gradeSubmission}
              </p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Subjects Management" eyebrow="Courses">
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div
              key={subject.code}
              className="rounded-lg border border-slate-200 p-4"
            >
              {editingId === subject.code ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Subject title"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={editForm.totalUnits}
                      onChange={(e) => setEditForm((f) => ({ ...f, totalUnits: e.target.value }))}
                      placeholder="Units"
                      className="h-8 w-20 text-sm"
                    />
                    <Input
                      value={editForm.instructor}
                      onChange={(e) => setEditForm((f) => ({ ...f, instructor: e.target.value }))}
                      placeholder="Instructor"
                      className="h-8 flex-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => saveEdit(subject.code)}>
                      <Check className="size-3.5" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      <X className="size-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {subject.code} - {subject.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {subject.totalUnits} units - {subject.instructor}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(subject.code)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>
      <div className="xl:col-span-2">
        <CurriculumModule />
      </div>
    </div>
  )
}
