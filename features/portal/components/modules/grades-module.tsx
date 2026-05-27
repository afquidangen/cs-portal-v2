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
        <Button size="sm" onClick={downloadGradeReport}>
          <Download className="size-4" />
          Download CSV
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Units</th>
              <th className="py-2 pr-4">Midterm</th>
              <th className="py-2 pr-4">Final Term</th>
              <th className="py-2 pr-4">Final Grade</th>
              <th className="py-2">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentGrades.map((grade) => {
              const finalGrade = calculateFinalGrade(grade)
              return (
                <tr key={grade.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">
                      {grade.subject}
                    </p>
                    <p className="text-xs text-slate-500">{grade.code}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{grade.units}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {grade.midterm.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {grade.finalTerm.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-950">
                    {finalGrade.toFixed(2)}
                  </td>
                  <td className="py-3">
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
        <Button size="sm" onClick={downloadGradeTemplate}>
          <Download className="size-4" />
          Template
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Student</th>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Midterm</th>
              <th className="py-2 pr-4">Final Term</th>
              <th className="py-2 pr-4">Computed</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(full ? grades : grades.slice(0, 4)).map((grade) => {
              const finalGrade = calculateFinalGrade(grade)
              return (
                <tr key={grade.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">
                      {grade.student}
                    </p>
                    <p className="text-xs text-slate-500">
                      {grade.studentId}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {grade.code}
                  </td>
                  <td className="py-3 pr-4">
                    <Input
                      type="number"
                      step="0.25"
                      min="1"
                      max="5"
                      value={grade.midterm}
                      onChange={(event) =>
                        updateGrade(grade.id, "midterm", event.target.value)
                      }
                      className="h-8 w-24 rounded-lg"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <Input
                      type="number"
                      step="0.25"
                      min="1"
                      max="5"
                      value={grade.finalTerm}
                      onChange={(event) =>
                        updateGrade(grade.id, "finalTerm", event.target.value)
                      }
                      className="h-8 w-24 rounded-lg"
                    />
                  </td>
                  <td className="py-3 pr-4 font-semibold text-slate-950">
                    {finalGrade.toFixed(2)}
                  </td>
                  <td className="py-3">
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
