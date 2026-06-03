"use client"

import { useMemo } from "react"
import { Download, Send, Upload, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  calculateGradePercentage,
  EQUIVALENT_GRADES,
  gradeRemarkOptions,
  transmutedToEquivalent,
} from "../../lib/grades"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function GradesModule({ model }: PortalModuleProps) {
  if (model.role === "faculty") {
    return <FacultyGradesPanel model={model} full />
  }

  const { downloadGradeReport, allStudentGrades, studentGrades } = model

  const gwaData = useMemo(() => {
    const graded = studentGrades.filter(
      (g) => g.midterm !== undefined && g.finalTerm !== undefined
    )
    if (graded.length === 0) return null
    const totalUnits = graded.reduce((sum, g) => sum + (g.units || 0), 0)
    const weightedSum = graded.reduce(
      (sum, g) => sum + (g.gradePercentage ?? 0) * (g.units || 0),
      0
    )
    const gwa = Number((weightedSum / totalUnits).toFixed(2))
    const equivalent = transmutedToEquivalent(gwa)
    let honors: string | null = null
    if (equivalent >= 1.0 && equivalent <= 1.19) honors = "With Highest Honors"
    else if (equivalent >= 1.2 && equivalent <= 1.44) honors = "With High Honors"
    else if (equivalent >= 1.45 && equivalent <= 1.75) honors = "Dean's Lister"
    return { gwa, totalUnits, equivalent, honors }
  }, [studentGrades])

  return (
    <Panel
      title="Grades & Report"
      eyebrow="Student records"
      actions={
        <Button size="sm" onClick={downloadGradeReport} className="rounded-2xl">
          <Download className="size-4" />
          Download CSV
        </Button>
      }
    >
      {gwaData && (
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              GWA
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {gwaData.equivalent.toFixed(2)}
            </p>
          </div>

          {gwaData.honors && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm dark:border-amber-800 dark:bg-amber-950">
              <Award className="size-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {gwaData.honors}
              </span>
            </div>
          )}
        </div>
      )}

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
                Grade %
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Equivalent
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {allStudentGrades.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No grade records yet.
                </td>
              </tr>
            ) : (
              allStudentGrades.map((grade) => {
                const percentage = calculateGradePercentage(grade)
                const equivalent =
                  percentage !== undefined
                    ? transmutedToEquivalent(percentage)
                    : undefined

                return (
                  <tr key={grade.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {grade.subject}
                      </p>
                      <p className="text-xs text-foreground/70">{grade.code}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{grade.units}</td>

                    {grade.released ? (
                      <>
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
                          {equivalent !== undefined ? equivalent.toFixed(2) : "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={grade.remarks || "Passed"} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-foreground/40">&mdash;</td>
                        <td className="px-4 py-3 text-foreground/40">&mdash;</td>
                        <td className="px-4 py-3 text-foreground/40">&mdash;</td>
                        <td className="px-4 py-3 text-foreground/40">&mdash;</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            IN PROGRESS
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })
            )}
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
        <table className="w-full min-w-[960px] text-left text-sm">
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
                Final
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Grade % (Transmuted)
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Equivalent
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
              const finalGrade = calculateGradePercentage(grade)
              const transmuted =
                finalGrade !== undefined
                  ? transmutedToEquivalent(finalGrade)
                  : undefined

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
                    <Select
                      value={grade.midterm !== undefined ? String(grade.midterm.toFixed(2)) : ""}
                      onChange={(value) =>
                        updateGrade(
                          grade.id,
                          "midterm",
                          value
                        )
                      }
                      options={EQUIVALENT_GRADES.map((g) => g.toFixed(2))}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <Select
                      value={grade.finalTerm !== undefined ? String(grade.finalTerm.toFixed(2)) : ""}
                      onChange={(value) =>
                        updateGrade(
                          grade.id,
                          "finalTerm",
                          value
                        )
                      }
                      options={EQUIVALENT_GRADES.map((g) => g.toFixed(2))}
                    />
                  </td>

                  <td className="px-4 py-3 font-semibold text-foreground">
                    {finalGrade !== undefined
                      ? finalGrade.toFixed(2)
                      : "N/A"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-foreground">
                    {transmuted !== undefined
                      ? transmuted.toFixed(2)
                      : "N/A"}
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
