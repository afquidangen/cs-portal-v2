"use client"

import { useMemo, useState } from "react"
import { Award, BarChart3, BookMarked, ClipboardList, Download, FileSpreadsheet, GraduationCap, ListChecks, Search, Send, Upload, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  calculateGradePercentage,
  gradeRemarkOptions,
  transmutedToEquivalent,
} from "../../lib/grades"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { GradeRecord } from "../../data/portal-data"

export function GradesModule({ model }: PortalModuleProps) {
  const { downloadGradeReport, allStudentGrades, studentGrades } = model

  const visibleAllGrades = useMemo(
    () => allStudentGrades.filter((g) => !(g.remarks === "Passed" && g.released)),
    [allStudentGrades]
  )

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

  if (model.role === "faculty") {
    return <FacultyGradesPanel model={model} />
  }

  return (
    <Panel
      title="Grades & Report"
      className="[&>div:first-child]:hidden"
    >
      <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <BarChart3 className="size-8" />
        </div>
        <div>
          <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="size-4" />
            Student Records
          </p>
          <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            Grades & Report
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review your released grades, academic standing, equivalent marks, and downloadable grade report.
          </p>
          <Button size="sm" onClick={downloadGradeReport} className="mt-4 rounded-lg">
            <Download className="size-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Visible Records",
            value: String(visibleAllGrades.length),
            note: "Current grade rows",
            icon: ListChecks,
          },
          {
            label: "Total Units",
            value: gwaData ? String(gwaData.totalUnits) : "0",
            note: "Released graded units",
            icon: BookMarked,
          },
          {
            label: "GWA Equivalent",
            value: gwaData ? gwaData.equivalent.toFixed(2) : "N/A",
            note: gwaData?.honors ?? "Awaiting complete grades",
            icon: Award,
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {gwaData && (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card px-5 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              GWA
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {gwaData.equivalent.toFixed(2)}
            </p>
          </div>

          {gwaData.honors && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm dark:border-amber-800 dark:bg-amber-950">
              <Award className="size-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {gwaData.honors}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-foreground">Grade Records</h4>
          <p className="text-sm text-muted-foreground">Released grades display full scores; active subjects remain in progress.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
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
            {visibleAllGrades.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No grade records yet.
                </td>
              </tr>
            ) : (
              visibleAllGrades.map((grade) => {
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
                          {grade.midtermTransmuted !== undefined ? grade.midtermTransmuted.toFixed(2) : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-foreground/80">
                          {grade.finalTransmuted !== undefined ? grade.finalTransmuted.toFixed(2) : "N/A"}
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

function FacultyGradesPanel({ model }: PortalModuleProps) {
  const {
    downloadGradeTemplate,
    grades,
    setGrades,
    roster,
    handleGradeWorkbookUpload,
    releaseGradesForSection,
    updateGrade,
    updateGradeRemarks,
    uploadName,
    visibleSchedules,
  } = model

  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [studentQuery, setStudentQuery] = useState("")

  const facultySubjects = useMemo(() => {
    const seen = new Set<string>()
    return visibleSchedules.filter((s) => {
      if (seen.has(s.subject)) return false
      seen.add(s.subject)
      return true
    })
  }, [visibleSchedules])

  const subjectSections = useMemo(() => {
    if (!selectedSubject) return []
    const seen = new Set<string>()
    return visibleSchedules
      .filter((s) => s.subject === selectedSubject)
      .filter((s) => {
        if (seen.has(s.section)) return false
        seen.add(s.section)
        return true
      })
      .map((s) => s.section)
  }, [visibleSchedules, selectedSubject])

  const subjectRoster = useMemo(() => {
    if (subjectSections.length === 0) return []
    const sectionSet = new Set(subjectSections)
    const passedIds = new Set(
      grades
        .filter((g) => g.subject === selectedSubject && g.remarks === "Passed" && g.released)
        .map((g) => g.studentId)
    )
    return roster.filter((s) => sectionSet.has(s.section) && s.enrolled && !passedIds.has(s.id))
  }, [roster, subjectSections, grades, selectedSubject])

  const rosterBySection = useMemo(() => {
    const groups = new Map<string, typeof subjectRoster>()
    for (const student of subjectRoster) {
      const section = student.section || "Unassigned"
      if (!groups.has(section)) groups.set(section, [])
      groups.get(section)!.push(student)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [subjectRoster])

  const filteredRosterBySection = useMemo(() => {
    const q = studentQuery.toLowerCase().trim()
    return rosterBySection
      .map(([section, students]) => {
        let filtered = students
        if (q) {
          filtered = students.filter((s) => {
            const displayName = s.lastName
              ? `${s.lastName}, ${s.firstName ?? ""}${s.middleName ? ` ${s.middleName}` : ""}`
              : s.name
            return displayName.toLowerCase().includes(q)
          })
        }
        const sorted = [...filtered].sort((a, b) => {
          const aLast = a.lastName ?? a.name.split(" ").pop() ?? ""
          const bLast = b.lastName ?? b.name.split(" ").pop() ?? ""
          const cmp = aLast.localeCompare(bLast)
          if (cmp !== 0) return cmp
          const aFirst = a.firstName ?? a.name
          const bFirst = b.firstName ?? b.name
          return aFirst.localeCompare(bFirst)
        })
        return [section, sorted] as [string, typeof subjectRoster]
      })
      .filter(([, students]) => students.length > 0)
  }, [rosterBySection, studentQuery])

  const gradeMap = useMemo(() => {
    const map = new Map()
    if (!selectedSubject) return map
    for (const g of grades) {
      if (g.subject === selectedSubject) {
        map.set(g.studentId, g)
      }
    }
    return map
  }, [grades, selectedSubject])

  function handleReleaseAll() {
    if (subjectSections.length === 0 || !selectedSubject) return
    const label = `${selectedSubject} (${subjectSections.join(", ")})`
    model.setPendingConfirm({
      title: "Release All Grades",
      description: `Release all grades for ${label} to students? This will make them visible to students.`,
      variant: "default",
      confirmLabel: "Release",
      onConfirm: () => {
        for (const section of subjectSections) {
          releaseGradesForSection(section, selectedSubject)
        }
      },
    })
  }

  return (
    <Panel
      title="Manage Grades"
      className="[&>div:first-child]:hidden"
    >
      <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <ClipboardList className="size-8" />
        </div>
        <div>
          <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="size-4" />
            Subject Grade Encoding
          </p>
          <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            Manage Grades
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Select a subject, encode student grades, upload grade sheets, and release finalized records to students.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={downloadGradeTemplate} className="rounded-lg">
              <Download className="size-4" />
              Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReleaseAll}
              className="rounded-lg bg-card/80"
            >
              <Send className="size-4" />
              Release
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        {[
          { label: "Assigned Subjects", value: String(facultySubjects.length), icon: BookMarked },
          { label: "Active Sections", value: String(subjectSections.length), icon: UsersRound },
          { label: "Students Listed", value: String(subjectRoster.length), icon: FileSpreadsheet },
        ].map((item) => {
          const Icon = item.icon

          return (
            <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Subject selector */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <BookMarked className="size-4" />
          Subject
        </p>
        <div className="flex flex-wrap gap-2">
          {facultySubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects assigned.</p>
          ) : (
            facultySubjects.map((s) => (
              <Button
                key={s.subject}
                type="button"
                variant={selectedSubject === s.subject ? "default" : "outline"}
                onClick={() => {
                  setSelectedSubject(s.subject)
                  setSelectedSection(null)
                }}
                className="rounded-xl"
              >
                {s.subject}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Upload */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Upload className="size-4" />
          Workbook Upload
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleGradeWorkbookUpload}
            className="h-10 rounded-lg"
          />
          <Button type="button" variant="outline" className="rounded-lg">
            <Upload className="size-4" />
            Upload Excel
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{uploadName}</p>
      </div>

      {/* Section selector */}
      {selectedSubject && subjectSections.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <UsersRound className="size-4" />
            Section
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedSection === null ? "default" : "outline"}
              onClick={() => setSelectedSection(null)}
              className="rounded-xl"
            >
              All Sections
            </Button>
            {subjectSections.map((s) => (
              <Button
                key={s}
                type="button"
                variant={selectedSection === s ? "default" : "outline"}
                onClick={() => setSelectedSection(s)}
                className="rounded-xl"
              >
                Section {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Student search */}
      {selectedSubject && subjectSections.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Search students by name..."
              className="h-9 rounded-xl pl-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Grade tables */}
      {selectedSubject && filteredRosterBySection.length > 0 ? (
        selectedSection === null ? (
          /* All sections stacked */
          <div className="space-y-6">
            {filteredRosterBySection.map(([section, students]) => (
              <SectionTable
                key={section}
                section={section}
                students={students}
                gradeMap={gradeMap}
                selectedSubject={selectedSubject}
                updateGrade={updateGrade}
                updateGradeRemarks={updateGradeRemarks}
                setGrades={setGrades}
              />
            ))}
          </div>
        ) : (() => {
          const students = filteredRosterBySection.find(([sec]) => sec === selectedSection)?.[1] ?? []
          return (
            <SectionTable
              section={selectedSection}
              students={students}
              gradeMap={gradeMap}
              selectedSubject={selectedSubject}
              updateGrade={updateGrade}
              updateGradeRemarks={updateGradeRemarks}
              setGrades={setGrades}
            />
          )
        })()
      ) : (
        selectedSubject && (
          <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] px-4 py-12 text-center text-sm text-muted-foreground">
            <GraduationCap className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            No students enrolled for this subject.
          </div>
        )
      )}
    </Panel>
  )
}

function SectionTable({
  section, students, gradeMap, selectedSubject, updateGrade, updateGradeRemarks, setGrades,
}: {
  section: string
  students: Array<{ id: string; name: string; section: string; enrolled?: boolean; firstName?: string; middleName?: string; lastName?: string }>
  gradeMap: Map<string, GradeRecord>
  selectedSubject: string
  updateGrade: (id: string, field: string, value: string) => void
  updateGradeRemarks: (id: string, value: string) => void
  setGrades: (updater: (prev: GradeRecord[]) => GradeRecord[]) => void
}) {
  if (students.length === 0) {
    return (
      <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] px-4 py-12 text-center text-sm text-muted-foreground">
        <GraduationCap className="mx-auto mb-2 size-8 text-muted-foreground/50" />
        No students enrolled for this section.
      </div>
    )
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Section {section}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="w-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">No.</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Midterm</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Final</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Grade %</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Equivalent</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Remarks</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {students.map((student, index) => {
              const grade = gradeMap.get(student.id)
              const finalGrade = grade ? calculateGradePercentage(grade) : undefined
              const transmuted = finalGrade !== undefined ? transmutedToEquivalent(finalGrade) : undefined

              function ensureGradeFor() {
                const existing = gradeMap.get(student.id)
                if (existing) return existing.id
                const newId = `GRD-${Date.now()}`
                const now = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                setGrades((current) => [{
                  id: newId,
                  studentId: student.id,
                  student: student.name,
                  section: student.section,
                  subject: selectedSubject,
                  code: selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject,
                  units: 3,
                  midtermTransmuted: undefined,
                  midterm: 0,
                  finalTransmuted: undefined,
                  finalTerm: 0,
                  released: false,
                  updatedAt: now,
                }, ...current])
                return newId
              }

              function handleMidterm(value: string) {
                const g = gradeMap.get(student.id)
                if (g) updateGrade(g.id, "midterm", value)
                else updateGrade(ensureGradeFor(), "midterm", value)
              }

              function handleFinal(value: string) {
                const g = gradeMap.get(student.id)
                if (g) updateGrade(g.id, "finalTerm", value)
                else updateGrade(ensureGradeFor(), "finalTerm", value)
              }

              function handleRemarks(value: string) {
                const g = gradeMap.get(student.id)
                if (g) updateGradeRemarks(g.id, value)
                else updateGradeRemarks(ensureGradeFor(), value)
              }

              return (
                <tr key={student.id} className="transition-colors hover:bg-muted/50">
                  <td className="w-12 px-4 py-3 text-center text-sm text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {student.lastName
                        ? `${student.lastName}, ${student.firstName ?? ""}${student.middleName ? ` ${student.middleName}` : ""}`
                        : student.name}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={grade?.midtermTransmuted !== undefined ? String(grade.midtermTransmuted) : ""}
                      onChange={(e) => handleMidterm(e.target.value)}
                      className="h-9 w-24 rounded-xl"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={grade?.finalTransmuted !== undefined ? String(grade.finalTransmuted) : ""}
                      onChange={(e) => handleFinal(e.target.value)}
                      className="h-9 w-24 rounded-xl"
                    />
                  </td>

                  <td className="px-4 py-3 font-semibold text-foreground">
                    {finalGrade !== undefined ? finalGrade.toFixed(2) : "N/A"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-foreground">
                    {transmuted !== undefined ? transmuted.toFixed(2) : "N/A"}
                  </td>

                  <td className="px-4 py-3">
                    <Select
                      value={grade?.remarks || "Passed"}
                      onChange={handleRemarks}
                      options={gradeRemarkOptions}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge value={grade?.released ? "Released" : "Draft"} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
