"use client"

import { Download, Send, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  calculateFinalGrade,
  calculateGradePercentage,
  gradeRemarkOptions,
  gradeRemarks,
} from "../../lib/grades"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
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
        <table className="w-full min-w-[820px] text-left text-sm">
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
                Percentage
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
              const percentage = calculateGradePercentage(grade)

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
                  <td className="px-4 py-3 text-foreground/80">
                    {percentage !== undefined ? percentage.toFixed(2) : "N/A"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {finalGrade.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={gradeRemarks(finalGrade, grade.remarks)} />
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
  const {
    downloadGradeTemplate,
    facultyClassSections,
    facultyGradeRecords,
    handleGradeWorkbookUpload,
    releaseGradesForSection,
    selectedGradeSection,
    setSelectedGradeSection,
    updateGrade,
    updateGradeRemarks,
    uploadName,
  } = model
  const visibleGrades = full ? facultyGradeRecords : facultyGradeRecords.slice(0, 4)

  return (
    <Panel
      title="Manage Grades"
      eyebrow="Section grade encoding"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={downloadGradeTemplate} className="rounded-2xl">
            <Download className="size-4" />
            Template
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => releaseGradesForSection(selectedGradeSection)}
            className="rounded-2xl"
          >
            <Send className="size-4" />
            Release
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {facultyClassSections.map((section) => (
          <Button
            key={section}
            type="button"
            variant={selectedGradeSection === section ? "default" : "outline"}
            onClick={() => setSelectedGradeSection(section)}
            className="rounded-xl"
          >
            {section}
          </Button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <Input
          type="file"
          accept=".xlsx"
          onChange={handleGradeWorkbookUpload}
          className="h-10 rounded-2xl"
        />
        <Button type="button" variant="outline" className="rounded-2xl">
          <Upload className="size-4" />
          Upload Excel
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{uploadName}</p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Student
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Midterm %
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Midterm Eq.
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Final %
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Final Eq.
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Final Rating
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Remarks
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {visibleGrades.map((grade) => {
              const finalGrade = calculateFinalGrade(grade)

              return (
                <tr key={grade.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {grade.student}
                    </p>
                    <p className="text-xs text-foreground/70">
                      {grade.studentId} - {grade.section}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-foreground/80">
                    <p>{grade.code}</p>
                    <p className="text-xs text-foreground/70">{grade.subject}</p>
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={grade.midtermTransmuted ?? ""}
                      onChange={(event) =>
                        updateGrade(
                          grade.id,
                          "midtermTransmuted",
                          event.target.value
                        )
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
                      min="0"
                      max="100"
                      value={grade.finalTransmuted ?? ""}
                      onChange={(event) =>
                        updateGrade(
                          grade.id,
                          "finalTransmuted",
                          event.target.value
                        )
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
                    <Select
                      value={grade.remarks || "Passed"}
                      onChange={(value) => updateGradeRemarks(grade.id, value)}
                      options={gradeRemarkOptions}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge value={grade.released ? "Released" : "Draft"} />
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
