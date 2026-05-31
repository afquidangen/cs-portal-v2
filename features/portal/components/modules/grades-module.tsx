"use client"

import { useState } from "react"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { calculateFinalGrade, gradeRemarks } from "../../lib/grades"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

const gradeRemarksOptions = ["", "INC", "Dropped", "Unofficial Dropped"]

const gradeEquivalents: Record<string, string> = {
  "99": "1.0",
  "96": "1.25",
  "93": "1.5",
  "90": "1.75",
  "87": "2.0",
  "84": "2.25",
  "81": "2.5",
  "78": "2.75",
  "75": "3.0",
}

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
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-glacier text-xs uppercase text-slate-blue dark:border-lapis">
            <tr>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Units</th>
              <th className="py-2 pr-4">Midterm</th>
              <th className="py-2 pr-4">Final Term</th>
              <th className="py-2 pr-4">Final Rating</th>
              <th className="py-2 pr-4">Transmuted</th>
              <th className="py-2 pr-4">Equivalent</th>
              <th className="py-2">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glacier dark:divide-lapis">
            {studentGrades.map((grade) => {
              const finalGrade = calculateFinalGrade(grade)
              return (
                <tr key={grade.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-abyss dark:text-quartz">{grade.subject}</p>
                    <p className="text-xs text-slate-blue dark:text-glacier">{grade.code}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{grade.units}</td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{grade.midterm?.toFixed(2) ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{grade.finalTerm?.toFixed(2) ?? "—"}</td>
                  <td className="py-3 pr-4 font-semibold text-abyss dark:text-quartz">{finalGrade?.toFixed(2) ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{grade.transmutedGrade?.toFixed(2) ?? "—"}</td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{grade.equivalent}</td>
                  <td className="py-3">
                    <StatusBadge value={grade.remarks || gradeRemarks(finalGrade)} />
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
  const { downloadGradeTemplate, grades, updateGrade, releaseGrades } = model
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null)

  const facultySections = ["BSCS 3A", "BSCS 3B"]

  if (!activeSection) {
    return (
      <Panel title="Manage Grades" eyebrow="Select a section">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {facultySections.map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className="rounded-xl border border-glacier bg-white p-6 text-left shadow-sm transition hover:border-lapis hover:shadow-md dark:border-lapis dark:bg-abyss/50 dark:hover:border-glacier"
            >
              <h3 className="text-lg font-semibold text-abyss dark:text-quartz">{section}</h3>
              <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                {grades.filter((g) => g.studentId.startsWith("2024")).length} students
              </p>
            </button>
          ))}
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title={`Manage Grades - ${activeSection}`}
      eyebrow="Midterm and final term encoding"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={downloadGradeTemplate}>
            <Download className="size-4" />
            Template
          </Button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-glacier bg-white px-3 py-1.5 text-sm font-medium text-abyss shadow-sm hover:bg-glacier/50 dark:border-lapis dark:bg-abyss/50 dark:text-quartz dark:hover:bg-lapis/50">
            <Upload className="size-4" />
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (e) => {
                  const text = e.target?.result as string
                  const lines = text.split("\n").filter(Boolean)
                  const uploaded: string[] = []
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",")
                    if (cols.length >= 5) {
                      const studentId = cols[0].trim()
                      const midterm = Number(cols[3].trim())
                      const finalTerm = Number(cols[4].trim())
                      updateGrade(studentId, "midterm", String(midterm))
                      updateGrade(studentId, "finalTerm", String(finalTerm))
                      uploaded.push(cols[1].trim() || studentId)
                    }
                  }
                  setUploadFeedback(`Uploaded grades for ${uploaded.length} student(s).`)
                  setTimeout(() => setUploadFeedback(null), 3000)
                }
                reader.readAsText(file)
                event.target.value = ""
              }}
            />
          </label>
          {uploadFeedback ? (
            <span className="text-xs text-emerald-600">{uploadFeedback}</span>
          ) : null}
          {showReleaseConfirm ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => {
                releaseGrades()
                setShowReleaseConfirm(false)
              }}>
                Confirm Release
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowReleaseConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setShowReleaseConfirm(true)}>
              Release Grades
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setActiveSection(null)}>
            Back
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-glacier text-xs uppercase text-slate-blue dark:border-lapis">
            <tr>
              <th className="py-2 pr-4">Student</th>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">%</th>
              <th className="py-2 pr-4">Midterm</th>
              <th className="py-2 pr-4">Final Term</th>
              <th className="py-2 pr-4">Final Rating</th>
              <th className="py-2 pr-4">Transmuted</th>
              <th className="py-2 pr-4">Equivalent</th>
              <th className="py-2">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glacier dark:divide-lapis">
            {(full ? grades : grades.slice(0, 4)).map((grade) => {
              const finalGrade = calculateFinalGrade(grade)
              return (
                <tr key={grade.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-abyss dark:text-quartz">{grade.student}</p>
                    <p className="text-xs text-slate-blue dark:text-glacier">{grade.studentId}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{grade.code}</td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">50%</td>
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
                      className="h-8 w-20 rounded-lg"
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
                      className="h-8 w-20 rounded-lg"
                    />
                  </td>
                  <td className="py-3 pr-4 font-semibold text-abyss dark:text-quartz">
                    {finalGrade?.toFixed(2) ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                    {grade.transmutedGrade?.toFixed(2) ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                    {grade.equivalent}
                  </td>
                  <td className="py-3">
                    <Select
                      value={grade.remarks || gradeRemarks(finalGrade)}
                      onChange={(value) => updateGrade(grade.id, "remarks", value)}
                      options={gradeRemarksOptions}
                    />
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
