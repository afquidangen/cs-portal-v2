"use client"

import { useEffect, useState, useMemo } from "react"
import { BookOpen, GraduationCap, Table2, Variable, AlertCircle, Calculator } from "lucide-react"
import type { GradingScheme, TransmutationTable } from "@/lib/types"

type WorkbookScheme = Pick<GradingScheme, "name" | "subjectType" | "components" | "labComponents" | "lectureWeight" | "laboratoryWeight">

export function GradingWorkbookTab({
  classId,
  gradingScheme,
}: {
  classId: string
  gradingScheme: WorkbookScheme | null
}) {
  const [tables, setTables] = useState<TransmutationTable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId) return
    setLoading(true)
    fetch("/api/portal/transmutation-tables")
      .then((r) => r.json())
      .then((json) => { setTables(json.data ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [classId])

  const activeTable = tables.find(
    (t) => t.isActive && (t.subjectType === gradingScheme?.subjectType || t.subjectType === "All")
  )

  const formulaInfo = useMemo(() => {
    if (!gradingScheme) return null
    const csComp = gradingScheme.components.find((c) => !c.isExam)
    const examComp = gradingScheme.components.find((c) => c.isExam)
    const csWeight = csComp?.weight ?? 60
    const examWeight = examComp?.weight ?? 40
    const csLabel = csComp?.name ?? "Class Standing"
    const csCategories = csComp?.categories ?? []
    const examLabel = examComp?.name ?? "Exam"
    const isLab = !!(gradingScheme.labComponents && gradingScheme.labComponents.length > 0)
    const lw = gradingScheme.lectureWeight ?? 60
    const labW = gradingScheme.laboratoryWeight ?? 40
    const labCsComp = gradingScheme.labComponents?.find((c) => !c.isExam)
    const labCategories = labCsComp?.categories ?? []
    return { csWeight, examWeight, csLabel, csCategories, examLabel, isLab, lw, labW, labCategories }
  }, [gradingScheme])

  if (!gradingScheme) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
        <div className="text-center">
          <GraduationCap className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No grading scheme loaded for this subject.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grading Scheme section */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Table2 className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Grading Scheme
            </p>
            <p className="text-lg font-black tracking-tight">{gradingScheme.name}</p>
          </div>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            <BookOpen className="size-3.5" />
            {gradingScheme.subjectType}
          </span>
        </div>

        <div className="divide-y divide-border px-5 py-4">
          {gradingScheme.components.map((comp) => (
            <div key={comp.name} className="py-3 first:pt-0 last:pb-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{comp.name}</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {comp.weight}%
                </span>
                {comp.isExam && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    Exam
                  </span>
                )}
              </div>
              {comp.categories.length > 0 && (
                <div className="ml-4 space-y-1.5">
                  {comp.categories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground/60">{cat.weight}%</span>
                      {cat.isAttendance && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
                          Attendance
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {gradingScheme.labComponents && gradingScheme.labComponents.length > 0 && (
            <>
              <div className="py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                    Lecture {gradingScheme.lectureWeight}%
                  </span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    Laboratory {gradingScheme.laboratoryWeight}%
                  </span>
                </div>
              </div>
              {gradingScheme.labComponents.map((comp) => (
                <div key={comp.name} className="py-3 last:pb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{comp.name}</span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {comp.weight}%
                    </span>
                  </div>
                  {comp.categories.length > 0 && (
                    <div className="ml-4 space-y-1.5">
                      {comp.categories.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted-foreground/60">{cat.weight}%</span>
                          {cat.isAttendance && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/70">
                              Attendance
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Formula section */}
      {formulaInfo && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calculator className="size-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Grading Formula
              </p>
              <p className="text-lg font-black tracking-tight">Computation Breakdown</p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            {!formulaInfo.isLab ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Period Grade</p>
                <div className="space-y-1 font-mono text-sm">
                  <p className="text-foreground/80">
                    <span className="text-foreground">Grade</span> = {formulaInfo.csLabel} &times; {formulaInfo.csWeight}% + {formulaInfo.examLabel} &times; {formulaInfo.examWeight}%
                  </p>
                  <div className="ml-4 space-y-1 text-xs">
                    <p className="text-muted-foreground">
                      <span className="text-foreground">{formulaInfo.csLabel}</span> =
                      {formulaInfo.csCategories.map((c, i) => (
                        <span key={c.name}>
                          {i > 0 && <span className="text-muted-foreground/50"> + </span>}
                          {c.name} &times; {c.weight}%
                        </span>
                      ))}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="text-foreground">{formulaInfo.examLabel}</span> = (Score &divide; MaxScore) &times; 100
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture Component</p>
                  <div className="space-y-1 font-mono text-sm">
                    <p className="text-foreground/80">
                      <span className="text-foreground">LectureGrade</span> = {formulaInfo.csLabel} &times; {formulaInfo.csWeight}% + {formulaInfo.examLabel} &times; {formulaInfo.examWeight}%
                    </p>
                    <div className="ml-4 space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        <span className="text-foreground">{formulaInfo.csLabel}</span> =
                        {formulaInfo.csCategories.map((c, i) => (
                          <span key={c.name}>
                            {i > 0 && <span className="text-muted-foreground/50"> + </span>}
                            {c.name} &times; {c.weight}%
                          </span>
                        ))}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-foreground">{formulaInfo.examLabel}</span> = (Score &divide; MaxScore) &times; 100
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laboratory Component</p>
                  <div className="space-y-1 font-mono text-sm">
                    <p className="text-foreground/80">
                      <span className="text-foreground">LabGrade</span> =
                      {formulaInfo.labCategories.map((c, i) => (
                        <span key={c.name}>
                          {i > 0 && <span className="text-muted-foreground/50"> + </span>}
                          {c.name} &times; {c.weight}%
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Combined Period Grade</p>
                  <div className="font-mono text-sm text-foreground/80">
                    <p>
                      <span className="text-foreground">PeriodGrade</span> = LectureGrade &times; {formulaInfo.lw}% + LabGrade &times; {formulaInfo.labW}%
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="border-t border-border pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final Grade</p>
              <div className="font-mono text-sm text-foreground/80">
                <p><span className="text-foreground">FinalGrade</span> = (MidtermGrade + FinalGrade) &divide; 2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transmutation Table section */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Variable className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Transmutation Table
            </p>
            <p className="text-lg font-black tracking-tight">
              {activeTable?.name ?? "Default Transmutation"}
            </p>
          </div>
          {activeTable && (
            <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {activeTable.subjectType}
            </span>
          )}
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading transmutation table...
            </div>
          ) : !activeTable && !loading ? (
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <AlertCircle className="size-4 shrink-0" />
              <span>Using default transmutation table (no active table configured).</span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Range (%)</th>
                    <th className="px-4 py-3">Equivalent Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(activeTable?.entries ?? [])
                    .sort((a, b) => b.max - a.max)
                    .map((entry, i) => (
                      <tr key={i} className="text-foreground/80 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">
                          {entry.min}% – {entry.max}%
                        </td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums">
                          {entry.equivalent.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
