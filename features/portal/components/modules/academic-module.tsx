"use client"

import { useEffect, useState } from "react"
import { BookOpen, CalendarRange, FileSpreadsheet, GraduationCap, Layers3, Plus, Settings2 } from "lucide-react"

import { Panel } from "../shared/dashboard-ui"
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
      <Panel title="Lecture-Only Subject Workbook" eyebrow="Format for non-lab courses">
        {lectureScheme ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <p className="font-medium text-foreground">{lectureScheme.name as string}</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
                Active
              </span>
            </div>
            {renderFormula(lectureScheme)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active Lecture scheme configured. Go to Grading Rules to set one up.</p>
        )}
      </Panel>

      <Panel title="Lecture with Lab Subject Workbook" eyebrow="Format for courses with laboratory component">
        {labScheme ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <p className="font-medium text-foreground">{labScheme.name as string}</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
                Active
              </span>
            </div>
            {renderFormula(labScheme)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active Lecture with Lab scheme configured. Go to Grading Rules to set one up.</p>
        )}
      </Panel>
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
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <Settings2 className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <CalendarRange className="size-4" />
              Academic Configuration
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Academic Setup
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure semesters, active terms, and curriculum records used across classes, grading, and enrollment workflows.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tab bar ── */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Configured Semesters", value: String(semesters.length), note: "School-year records", icon: CalendarRange },
          { label: "Active Terms", value: String(activeSemesterCount), note: "Open for portal workflows", icon: Layers3 },
          { label: "Current View", value: selectedAcademicSection, note: "Setup workspace", icon: BookOpen },
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

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = selectedAcademicSection === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedAcademicSection(tab.key)}
              className={
                active
                  ? "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm"
                  : "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 transition hover:bg-muted hover:text-foreground"
              }
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

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
