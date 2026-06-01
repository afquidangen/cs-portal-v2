"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { semestersSeed, subjectsSeed } from "../../data/portal-data"
import { Panel, StatusBadge } from "../shared/dashboard-ui"
import { CurriculumModule } from "./curriculum-module"
import type { PortalModuleProps } from "./types"

export function AcademicModule({ model }: PortalModuleProps) {
  const {
    handleAddCurriculum,
    newCurriculum,
    selectedAcademicSection,
    setNewCurriculum,
    setSelectedAcademicSection,
  } = model

  const sections = ["Semesters", "Subjects", "Curriculum"]

  return (
    <div className="space-y-5">
      <Panel title="Academic Setup" eyebrow="Management sections">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <Button
              key={section}
              type="button"
              variant={selectedAcademicSection === section ? "default" : "outline"}
              onClick={() => setSelectedAcademicSection(section)}
              className="rounded-xl"
            >
              {section}
            </Button>
          ))}
        </div>
      </Panel>

      {selectedAcademicSection === "Semesters" ? (
        <Panel title="Semester Management" eyebrow="School year">
          <div className="grid gap-3 md:grid-cols-2">
            {semestersSeed.map((semester) => (
              <div
                key={`${semester.name}-${semester.schoolYear}`}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {semester.name} {semester.schoolYear}
                    </h4>
                    <p className="mt-1 text-sm text-foreground/80">
                      Grade submission: {semester.gradeSubmission}
                    </p>
                  </div>
                  <StatusBadge value={semester.enrollment} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {selectedAcademicSection === "Subjects" ? (
        <Panel title="Subject Management" eyebrow="Units and instructors">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                    Code
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                    Subject
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                    Units
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                    Instructor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {subjectsSeed.map((subject) => (
                  <tr
                    key={subject.code}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {subject.code}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">
                      {subject.title}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">
                      {subject.units}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">
                      {subject.instructor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {selectedAcademicSection === "Curriculum" ? (
        <div className="space-y-5">
          <Panel title="Add Curriculum" eyebrow="Future curriculum support">
            <form
              onSubmit={handleAddCurriculum}
              className="grid gap-3 md:grid-cols-4"
            >
              <Input
                value={newCurriculum.name}
                onChange={(event) =>
                  setNewCurriculum((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Curriculum name"
                className="h-10 rounded-2xl"
              />
              <Input
                value={newCurriculum.major}
                onChange={(event) =>
                  setNewCurriculum((current) => ({
                    ...current,
                    major: event.target.value,
                  }))
                }
                placeholder="Major or specialization"
                className="h-10 rounded-2xl md:col-span-2"
              />
              <div className="flex gap-2">
                <Input
                  value={newCurriculum.totalUnits}
                  onChange={(event) =>
                    setNewCurriculum((current) => ({
                      ...current,
                      totalUnits: event.target.value,
                    }))
                  }
                  placeholder="Units"
                  className="h-10 rounded-2xl"
                />
                <Button type="submit" className="rounded-2xl">
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </form>
          </Panel>

          <CurriculumModule model={model} />
        </div>
      ) : null}
    </div>
  )
}