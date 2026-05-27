"use client"

import { Button } from "@/components/ui/button"

import { semestersSeed, subjectsSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"
import { CurriculumModule } from "./curriculum-module"

export function AcademicModule() {
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
          {subjectsSeed.map((subject) => (
            <div
              key={subject.code}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {subject.code} - {subject.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {subject.units} units - {subject.instructor}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
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
