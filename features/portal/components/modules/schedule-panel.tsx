"use client"

import { ArrowLeft, Download, Send, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  calculateGradePercentage,
  gradeRemarkOptions,
  transmutedToEquivalent,
} from "../../lib/grades"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function SchedulePanel({ model }: PortalModuleProps) {
  const {
    visibleSchedules,
    selectedScheduleEntry,
    setSelectedScheduleEntry,
    selectedScheduleStudents,
    selectedScheduleGrades,
    handleCreateGrade,
    updateGrade,
    updateGradeRemarks,
    releaseGradesForSection,
    downloadGradeTemplate,
    handleGradeWorkbookUpload,
    uploadName,
  } = model

  if (selectedScheduleEntry) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSelectedScheduleEntry(null)}
            className="rounded-xl"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {selectedScheduleEntry.subject}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedScheduleEntry.section} &middot; {selectedScheduleEntry.day}{" "}
              {selectedScheduleEntry.time} &middot; {selectedScheduleEntry.room}
            </p>
          </div>
        </div>

        <Panel
          title="Class Roster & Grades"
          eyebrow={selectedScheduleEntry.section}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={downloadGradeTemplate}
                className="rounded-2xl"
              >
                <Download className="size-4" />
                Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  releaseGradesForSection(selectedScheduleEntry.section, selectedScheduleEntry.subject)
                }
                className="rounded-2xl"
              >
                <Send className="size-4" />
                Release
              </Button>
            </div>
          }
        >
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
          {uploadName ? (
            <p className="mb-4 text-sm text-muted-foreground">{uploadName}</p>
          ) : null}

          {selectedScheduleStudents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students enrolled in this section.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Student
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
                  {selectedScheduleStudents.map((student) => {
                    const grade = selectedScheduleGrades.find(
                      (g) => g.studentId === student.id
                    )
                    const finalGrade = grade
                      ? calculateGradePercentage(grade)
                      : undefined
                    const transmuted =
                      finalGrade !== undefined
                        ? transmutedToEquivalent(finalGrade)
                        : undefined

                    return (
                      <tr
                        key={student.id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {student.id} - {student.section}
                          </p>
                        </td>

                        {grade ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={grade.midterm}
                                onChange={(e) =>
                                  updateGrade(grade.id, "midterm", e.target.value)
                                }
                                className="h-11 w-24 rounded-md border border-border bg-white px-3 text-sm text-foreground dark:bg-neutral-950"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={grade.finalTerm}
                                onChange={(e) =>
                                  updateGrade(grade.id, "finalTerm", e.target.value)
                                }
                                className="h-11 w-24 rounded-md border border-border bg-white px-3 text-sm text-foreground dark:bg-neutral-950"
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
                                onChange={(value) =>
                                  updateGradeRemarks(grade.id, value)
                                }
                                options={gradeRemarkOptions}
                              />
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge
                                value={
                                  grade.released ? "Released" : "Draft"
                                }
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td
                              colSpan={6}
                              className="px-4 py-3 text-center"
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleCreateGrade(
                                    student.id,
                                    student.name
                                  )
                                }
                                className="rounded-xl"
                              >
                                Add Grade
                              </Button>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    )
  }

  return (
    <Panel title="Weekly Schedule" eyebrow="Classes">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Day
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Time
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Section
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Room
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {visibleSchedules.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No class schedules assigned to you.
                </td>
              </tr>
            ) : (
              visibleSchedules.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedScheduleEntry(item)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.day}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.time}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.subject}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.section}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {item.room}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
