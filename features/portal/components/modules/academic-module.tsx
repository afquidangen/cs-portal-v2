"use client"

import { useEffect, useState } from "react"
import { BookOpen, CalendarRange, FileSpreadsheet, GraduationCap, Layers3, Plus } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CurriculumModule } from "./curriculum-module"
import type { PortalModuleProps } from "./types"

const TABS = [
  { key: "Curriculum", label: "Curriculum", icon: Plus },
  { key: "Grading Workbooks", label: "Grading Workbooks", icon: FileSpreadsheet },
] as const

function GradingWorkbooksSection() {
  const [lectureScheme, setLectureScheme] = useState<Record<string, unknown> | null>(null)
  const [labScheme, setLabScheme] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/portal/grading-schemes")
      .then((r) => r.json())
      .then((json) => {
        const schemes: Array<Record<string, unknown>> = json.data ?? []
        const lecture = schemes.find((s) => s.subjectType === "Lecture" && s.isActive)
        const lab = schemes.find((s) => s.subjectType === "Lecture with Lab" && s.isActive)
        setLectureScheme(lecture ?? null)
        setLabScheme(lab ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function renderFormula(scheme: Record<string, unknown>) {
    const components = (scheme.components ?? []) as Array<Record<string, unknown>>
    const labComps = (scheme.labComponents ?? []) as Array<Record<string, unknown>>

    return (
      <div className="space-y-3 text-sm">
        {components.map((comp) => {
          const categories = (comp.categories ?? []) as Array<Record<string, unknown>>
          return (
            <div key={comp.name as string} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="font-semibold text-foreground">{comp.name as string} <span className="font-bold text-primary">({comp.weight as number}%)</span></p>
              {categories.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-4 text-muted-foreground">
                  {categories.map((cat) => (
                    <li key={cat.name as string}>
                      {cat.name as string} = {cat.weight as number}%
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs">
                Formula: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  {categories.map((c) => `${c.name} × ${(c.weight as number) / 100}`).join(" + ")}
                </code>
              </p>
            </div>
          )
        })}
        {scheme.subjectType === "Lecture with Lab" && labComps.length > 0 && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laboratory Component</p>
            {labComps.map((comp) => {
              const categories = (comp.categories ?? []) as Array<Record<string, unknown>>
              return (
                <div key={comp.name as string} className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-semibold text-foreground">{comp.name as string} <span className="font-bold text-primary">({comp.weight as number}%)</span></p>
                  {categories.length > 0 && (
                    <ul className="mt-1 space-y-0.5 pl-4 text-muted-foreground">
                      {categories.map((cat) => (
                        <li key={cat.name as string}>
                          {cat.name as string} = {cat.weight as number}%
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-xs">
                    Formula: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                      {categories.map((c) => `${c.name} × ${(c.weight as number) / 100}`).join(" + ")}
                    </code>
                  </p>
                </div>
              )
            })}
          </>
        )}
        {scheme.subjectType === "Lecture with Lab" && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="font-semibold text-foreground">Period Grade Formula</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                 Lecture Grade × {(scheme.lectureWeight as number ?? 40) / 100} + Laboratory Grade × {(scheme.laboratoryWeight as number ?? 60) / 100}
              </code>
            </p>
          </div>
        )}
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="font-semibold text-foreground">Final Grade Formula</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              (Midterm Grade + Tentative Final Grade) / 2
            </code>
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading grading workbooks...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-950">Lecture-Only Subject Workbook</CardTitle>
          <p className="text-xs font-medium text-blue-600">Format for non-lab courses</p>
        </CardHeader>
        <CardContent className="p-5">
        {lectureScheme ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-blue-600" />
              <p className="font-medium text-slate-900">{lectureScheme.name as string}</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                Active
              </span>
            </div>
            {renderFormula(lectureScheme)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No active Lecture scheme configured. Go to Grading Rules to set one up.</p>
        )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-950">Lecture with Lab Subject Workbook</CardTitle>
          <p className="text-xs font-medium text-blue-600">Format for courses with laboratory component</p>
        </CardHeader>
        <CardContent className="p-5">
        {labScheme ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-blue-600" />
              <p className="font-medium text-slate-900">{labScheme.name as string}</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                Active
              </span>
            </div>
            {renderFormula(labScheme)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No active Lecture with Lab scheme configured. Go to Grading Rules to set one up.</p>
        )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AcademicModule({ model }: PortalModuleProps) {
  const {
    selectedAcademicSection, semesters,
    setSelectedAcademicSection,
  } = model

  const activeSemesterCount = semesters.filter((semester) => semester.status === "Active").length

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Academic Setup</h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure semesters, active terms, curriculum records, and grading workbook formats.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Configured Semesters", value: String(semesters.length), note: "School-year records", icon: CalendarRange },
          { label: "Active Terms", value: String(activeSemesterCount), note: "Open for portal workflows", icon: Layers3 },
          { label: "Current View", value: selectedAcademicSection, note: "Setup workspace", icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon

          return (
          <Card key={item.label} className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.note}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Icon className="size-5" />
              </span>
            </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-wrap gap-2 p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = selectedAcademicSection === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedAcademicSection(tab.key)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition",
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
        </CardContent>
      </Card>

      {/* ───── Curriculum Tab ───── */}
      {selectedAcademicSection === "Curriculum" ? (
        <CurriculumModule model={model} />
      ) : null}

      {/* ───── Grading Workbooks Tab ───── */}
      {selectedAcademicSection === "Grading Workbooks" ? (
        <GradingWorkbooksSection />
      ) : null}

    </div>
  )
}
