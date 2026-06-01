"use client"

import { CheckCircle2, ChevronLeft, ChevronRight, Layers3 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { curriculumSeed } from "../../data/portal-data"
import { EmptyState, Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function CurriculumModule({ model }: Partial<PortalModuleProps>) {
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)

  if (!model) {
    return (
      <Panel title="Current Curriculum" eyebrow="Plan and guide">
        <div className="grid gap-4 lg:grid-cols-2">
          {curriculumSeed.map((term) => (
            <article
              key={`${term.year}-${term.term}`}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
            >
              <h4 className="font-semibold text-foreground">
                {term.year} - {term.term}
              </h4>
              <ul className="mt-3 space-y-2">
                {term.subjects.map((subject) => (
                  <li
                    key={subject}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-white">
                      <CheckCircle2 className="size-4" />
                    </div>
                    {subject}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Panel>
    )
  }

  const {
    curricula,
    curriculumFilter,
    selectedCurriculumId,
    setCurriculumFilter,
    setSelectedCurriculumId,
  } = model

  const majors = ["All", ...Array.from(new Set(curricula.map((item) => item.major)))]

  const visibleCurricula =
    curriculumFilter === "All"
      ? curricula
      : curricula.filter((item) => item.major === curriculumFilter)

  const selectedCurriculum =
    curricula.find((item) => item.id === selectedCurriculumId) ??
    visibleCurricula[0]

  const selectedTotalSubjects =
    selectedCurriculum?.terms.reduce(
      (total, term) => total + term.subjects.length,
      0
    ) ?? 0

  const groupedYears = useMemo(() => {
    if (!selectedCurriculum) return []

    const grouped = selectedCurriculum.terms.reduce<
      Record<
        string,
        {
          year: string
          terms: typeof selectedCurriculum.terms
          totalUnits: number
          totalSubjects: number
        }
      >
    >((acc, term) => {
      if (!acc[term.year]) {
        acc[term.year] = {
          year: term.year,
          terms: [],
          totalUnits: 0,
          totalSubjects: 0,
        }
      }

      acc[term.year].terms.push(term)
      acc[term.year].totalUnits += term.subjects.reduce(
        (sum, subject) => sum + subject.total,
        0
      )
      acc[term.year].totalSubjects += term.subjects.length

      return acc
    }, {})

    return Object.values(grouped)
  }, [selectedCurriculum])

  useEffect(() => {
    setSelectedYearIndex(0)
  }, [selectedCurriculum?.id])

  const activeYearGroup = groupedYears[selectedYearIndex]

  return (
    <div className="space-y-5">
      <Panel
        title="Curriculum Table"
        eyebrow="Filter by curriculum and major"
        actions={
          <Select
            value={curriculumFilter}
            onChange={setCurriculumFilter}
            options={majors}
          />
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Curr ID
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Curriculum
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Major
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Units
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visibleCurricula.map((curriculum) => (
                <tr
                  key={curriculum.id}
                  className={
                    curriculum.id === selectedCurriculum?.id
                      ? "cursor-pointer bg-muted transition-colors"
                      : "cursor-pointer transition-colors hover:bg-muted/50"
                  }
                  onClick={() => setSelectedCurriculumId(curriculum.id)}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {curriculum.id}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {curriculum.name}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {curriculum.major}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {curriculum.totalUnits}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={curriculum.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!visibleCurricula.length ? (
          <div className="mt-4">
            <EmptyState text="No curriculum matches the selected filter." />
          </div>
        ) : null}
      </Panel>

      {selectedCurriculum ? (
        <Panel
          title={`${selectedCurriculum.name}`}
          eyebrow={`${selectedCurriculum.major} • ${selectedTotalSubjects} total subjects`}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-foreground/70">Curriculum ID</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {selectedCurriculum.id}
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-foreground/70">Major</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {selectedCurriculum.major}
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-foreground/70">Total Units</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {selectedCurriculum.totalUnits}
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm text-foreground/70">Status</p>
                <div className="mt-2">
                  <StatusBadge value={selectedCurriculum.status} />
                </div>
              </article>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Layers3 className="size-4 text-foreground/70" />
                <h4 className="font-semibold text-foreground">
                  Curriculum Overview
                </h4>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {groupedYears.map((yearGroup, index) => (
                  <button
                    key={yearGroup.year}
                    type="button"
                    onClick={() => setSelectedYearIndex(index)}
                    className={
                      index === selectedYearIndex
                        ? "rounded-2xl border border-primary bg-card p-4 text-left shadow-sm ring-1 ring-primary/20 transition-all"
                        : "rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-muted/40"
                    }
                  >
                    <p className="text-sm text-foreground/70">{yearGroup.year}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {yearGroup.totalSubjects} subjects
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      {yearGroup.totalUnits} units
                    </p>
                    <p className="mt-1 text-xs text-foreground/60">
                      {yearGroup.terms.length} term
                      {yearGroup.terms.length > 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {activeYearGroup ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      {activeYearGroup.year}
                    </h4>
                    <p className="text-sm text-foreground/70">
                      {activeYearGroup.totalSubjects} subjects •{" "}
                      {activeYearGroup.totalUnits} units
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedYearIndex((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={selectedYearIndex === 0}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedYearIndex((prev) =>
                          Math.min(prev + 1, groupedYears.length - 1)
                        )
                      }
                      disabled={selectedYearIndex === groupedYears.length - 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeYearGroup.terms.map((term) => (
                    <div
                      key={`${selectedCurriculum.id}-${term.year}-${term.semester}`}
                      className="rounded-2xl border border-border bg-card shadow-sm"
                    >
                      <div className="border-b border-border px-4 py-3">
                        <h5 className="font-semibold text-foreground">
                          {term.semester}
                        </h5>
                        <p className="text-sm text-foreground/70">
                          {term.subjects.length} subjects •{" "}
                          {term.subjects.reduce(
                            (sum, subject) => sum + subject.total,
                            0
                          )}{" "}
                          units
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-muted text-foreground">
                            <tr className="border-b border-border">
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                Subject Code
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                Subject Name
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                Lec
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                Lab
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                                Units
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-card">
                            {term.subjects.map((subject) => (
                              <tr
                                key={`${term.year}-${term.semester}-${subject.code}-${subject.name}`}
                                className="transition-colors hover:bg-muted/40"
                              >
                                <td className="px-4 py-3 font-medium text-foreground">
                                  {subject.code}
                                </td>
                                <td className="px-4 py-3 text-foreground/80">
                                  {subject.name}
                                </td>
                                <td className="px-4 py-3 text-foreground/80">
                                  {subject.lec}
                                </td>
                                <td className="px-4 py-3 text-foreground/80">
                                  {subject.lab}
                                </td>
                                <td className="px-4 py-3 text-foreground/80">
                                  {subject.total}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState text="No year level data available for this curriculum." />
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  )
}