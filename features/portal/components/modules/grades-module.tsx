"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { calculateFinalGrade, gradeRemarks } from "../../lib/grades"
import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function GradesModule({ model }: PortalModuleProps) {
  if (model.role === "faculty") {
    return <FacultyGradesPanel model={model} full />
  }

  const { downloadGradeReport, studentGrades } = model

  return (
    <Panel
      title="Curriculum Plan, Grade Guide, and Downloadable Report"
      eyebrow="Student records"
      actions={
        <Button size="sm" onClick={downloadGradeReport} className="rounded-2xl">
          <Download className="size-4" />
          Download CSV
        </Button>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Units
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Midterm
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Final Term
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Final Grade
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Remarks
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {studentGrades.map((grade) => {
              const finalGrade = calculateFinalGrade(grade)

              return (
                <tr key={grade.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {grade.subject}
                    </p>
                    <p className="text-xs text-foreground/70">{grade.code}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{grade.units}</td>
                  <td className="px-4 py-3 text-foreground/80">
                    {grade.midterm.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {grade.finalTerm.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {finalGrade.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={gradeRemarks(finalGrade)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function FacultyGradesPanel({
  model,
  full = false,
}: PortalModuleProps & { full?: boolean }) {
  const { downloadGradeTemplate, grades, updateGrade } = model

  return (
    <Panel
      title="Manage Grades"
      eyebrow="Midterm and final term encoding"
      actions={
        <Button size="sm" onClick={downloadGradeTemplate} className="rounded-2xl">
          <Download className="size-4" />
          Template
        </Button>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Student
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Midterm
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Final Term
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Computed
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {(full ? grades : grades.slice(0, 4)).map((grade) => {
              const finalGrade = calculateFinalGrade(grade)

              return (
                <tr key={grade.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {grade.student}
                    </p>
                    <p className="text-xs text-foreground/70">
                      {grade.studentId}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-foreground/80">
                    {grade.code}
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.25"
                      min="1"
                      max="5"
                      value={grade.midterm}
                      onChange={(event) =>
                        updateGrade(grade.id, "midterm", event.target.value)
                      }
                      className="h-9 w-24 rounded-2xl"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      step="0.25"
                      min="1"
                      max="5"
                      value={grade.finalTerm}
                      onChange={(event) =>
                        updateGrade(grade.id, "finalTerm", event.target.value)
                      }
                      className="h-9 w-24 rounded-2xl"
                    />
                  </td>

                  <td className="px-4 py-3 font-semibold text-foreground">
                    {finalGrade.toFixed(2)}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge value={gradeRemarks(finalGrade)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}