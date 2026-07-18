"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Award,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Trophy,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import { YEAR_LEVELS } from "@/features/portal/lib/year-level"
import type { PortalModuleProps } from "./types"
import type { SemesterRecord } from "@/lib/types"

type DeansListEntry = {
  id: string
  studentId: string
  studentName: string
  semesterId: string
  semester: string
  schoolYearStart: number
  schoolYearEnd: number
  gwa: number | null
  totalUnits: number
  yearLevel: string
  isQualified: boolean
  disqualificationReasons: string[]
  manualOverride: "none" | "include" | "exclude"
  rank: number | null
  published: boolean
  publishedAt: string | null
  needsRecalculation: boolean
}

export function DeansListModule({ model }: PortalModuleProps) {
  const { users, semesters } = model
  const semestersList = semesters as SemesterRecord[]
  const allSemesters = useMemo(
    () =>
      [...semesters]
        .filter((s) => s.status === "Archived" || s.status === "Active")
        .sort(
          (a, b) =>
            b.schoolYearStart - a.schoolYearStart ||
            b.schoolYearEnd - a.schoolYearEnd
        ),
    [semesters]
  )

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("")
  const [entries, setEntries] = useState<DeansListEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [computing, setComputing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const activeStudentIds = useMemo(() => {
    return new Set(
      users
        .filter(u => u.role === "student" && !u.deletedAt)
        .map(u => u.id)
    )
  }, [users])

  const selectedSemester = allSemesters.find(
    (s) => s.id === selectedSemesterId
  )

  const loadEntries = useCallback(async () => {
    if (!selectedSemesterId) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/portal/deans-list?semesterId=${selectedSemesterId}`
      )
      const json = await res.json()
      if (res.ok) {
        const filteredEntries = (json.data ?? []).filter(
          (entry: DeansListEntry) => activeStudentIds.has(entry.studentId)
        )
        setEntries(filteredEntries)
      } else {
        toast.error(json.error || "Failed to load entries.")
      }
    } catch {
      toast.error("Failed to load Dean's List entries.")
    } finally {
      setLoading(false)
    }
  }, [selectedSemesterId, activeStudentIds])

  useEffect(() => {
    setEntries([])
    loadEntries()
  }, [loadEntries])

  const handleCompute = useCallback(async () => {
    if (!selectedSemesterId) return
    setComputing(true)
    try {
      const res = await fetch("/api/portal/deans-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semesterId: selectedSemesterId }),
      })
      const json = await res.json()
      if (res.ok) {
        const filteredEntries = (json.data ?? []).filter(
          (entry: DeansListEntry) => activeStudentIds.has(entry.studentId)
        )
        setEntries(filteredEntries)
        toast.success("Dean's List recomputed.")
      } else {
        toast.error(json.error || "Failed to compute.")
      }
    } catch {
      toast.error("Failed to compute Dean's List.")
    } finally {
      setComputing(false)
    }
  }, [selectedSemesterId, activeStudentIds])

  const handlePublish = useCallback(async () => {
    if (!selectedSemesterId) return
    setPublishing(true)
    try {
      const res = await fetch("/api/portal/deans-list/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semesterId: selectedSemesterId }),
      })
      const json = await res.json()
      if (res.ok) {
        const filteredEntries = (json.data ?? []).filter(
          (entry: DeansListEntry) => activeStudentIds.has(entry.studentId)
        )
        setEntries(filteredEntries)
        toast.success("Dean's List published.")
      } else {
        toast.error(json.error || "Failed to publish.")
      }
    } catch {
      toast.error("Failed to publish Dean's List.")
    } finally {
      setPublishing(false)
    }
  }, [selectedSemesterId, activeStudentIds])

  const handleOverride = useCallback(
    async (entryId: string, override: "none" | "include" | "exclude") => {
      try {
        const res = await fetch(`/api/portal/deans-list/${entryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manualOverride: override }),
        })
        const json = await res.json()
        if (res.ok) {
          setEntries((prev) =>
            prev.map((e) =>
              e.id === entryId
                ? {
                    ...e,
                    manualOverride: override,
                    isQualified:
                      override === "include"
                        ? true
                        : override === "exclude"
                        ? false
                        : e.isQualified,
                  }
                : e
            )
          )
          toast.success("Override saved.")
        } else {
          toast.error(json.error || "Failed to update override.")
        }
      } catch {
        toast.error("Failed to update override.")
      }
    },
    []
  )

  const filteredEntries = useMemo(() => {
    let list = entries
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) => e.studentName.toLowerCase().includes(q))
    }
    if (filterStatus === "qualified") {
      list = list.filter((e) => {
        if (e.manualOverride === "include") return true
        if (e.manualOverride === "exclude") return false
        return e.isQualified
      })
    } else if (filterStatus === "not-qualified") {
      list = list.filter((e) => {
        if (e.manualOverride === "include") return false
        if (e.manualOverride === "exclude") return true
        return !e.isQualified
      })
    }
    return list
  }, [entries, search, filterStatus])

  const groupedByYearLevel = useMemo(() => {
    const groups: Record<string, DeansListEntry[]> = {}
    for (const e of filteredEntries) {
      const yl = e.yearLevel || "Unknown"
      if (!groups[yl]) groups[yl] = []
      groups[yl].push(e)
    }
    return groups
  }, [filteredEntries])

  const yearLevelOrder = useMemo(
    () => [...YEAR_LEVELS, "Unknown"].filter((yl) => groupedByYearLevel[yl]),
    [groupedByYearLevel]
  )

  const qualifiedCount = useMemo(
    () =>
      entries.filter((e) => {
        if (e.manualOverride === "include") return true
        if (e.manualOverride === "exclude") return false
        return e.isQualified
      }).length,
    [entries]
  )

  const notQualifiedCount = entries.length - qualifiedCount

  const semesterOptions = allSemesters.map(
    (s) => `${s.semester} A.Y. ${s.schoolYearStart}-${s.schoolYearEnd} (${s.id})`
  )

  return (
    <Panel title="Dean's List" className="[&>div:first-child]:hidden">
      <div className="space-y-5">
        <div className="pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dean's List Management
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Evaluate, override, and publish Dean's List qualifications per
            semester.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[280px]">
            <Select
              value={
                selectedSemesterId
                  ? `${selectedSemester?.semester} A.Y. ${selectedSemester?.schoolYearStart}-${selectedSemester?.schoolYearEnd} (${selectedSemesterId})`
                  : ""
              }
              onChange={(val) => {
                const id = val.match(/\(([^)]+)\)$/)?.[1] ?? ""
                setSelectedSemesterId(id)
              }}
              options={semesterOptions}
              label="Select Semester"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleCompute}
            disabled={!selectedSemesterId || computing}
          >
            {computing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            {computing ? "Computing..." : "Recompute"}
          </Button>

          <Button
            onClick={handlePublish}
            disabled={
              !selectedSemesterId || publishing || entries.length === 0
            }
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {publishing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>

        {selectedSemesterId && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Card className="rounded-lg border border-border bg-card shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Award className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Students
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {entries.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-border bg-card shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Qualified
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {qualifiedCount}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-border bg-card shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <XCircle className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Not Qualified
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {notQualifiedCount}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border border-border bg-card shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    entries[0]?.needsRecalculation ? "bg-red-100 text-red-600" : entries[0]?.published ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                  )}>
                    <Trophy className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Status
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {entries.length > 0 && entries.some((e) => e.needsRecalculation)
                        ? "Outdated — Needs Re-publishing"
                        : entries[0]?.published
                        ? "Published"
                        : "Not Published"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                options={["all", "qualified", "not-qualified"]}
                className="min-w-[160px]"
              />
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card py-14 text-center text-sm text-muted-foreground">
                {entries.length === 0
                  ? 'Click "Recompute" to evaluate students for this semester.'
                  : "No entries match the current filters."}
              </div>
            ) : (
              <div className="space-y-6">
                {yearLevelOrder.map((yearLevel) => {
                  const group = groupedByYearLevel[yearLevel]
                  return (
                    <div key={yearLevel}>
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        {yearLevel} ({group.length})
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/80 text-foreground">
                            <tr className="border-b border-border">
                              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                                Rank
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                                Student
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                                GWA
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                                Units
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                                Status
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                                Reasons
                              </th>
                              <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                                Override
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {group.map((entry) => {
                              const effectiveStatus =
                                entry.manualOverride === "include"
                                  ? true
                                  : entry.manualOverride === "exclude"
                                  ? false
                                  : entry.isQualified

                              const overrideLabel =
                                entry.manualOverride === "none"
                                  ? "None"
                                  : entry.manualOverride === "include"
                                  ? "Included"
                                  : "Excluded"

                              return (
                                <tr
                                  key={entry.id}
                                  className="transition-colors hover:bg-muted/50"
                                >
                                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-foreground">
                                    {entry.published && entry.rank
                                      ? `#${entry.rank}`
                                      : "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                                    {entry.studentName}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                    {entry.gwa !== null
                                      ? entry.gwa.toFixed(2)
                                      : "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-foreground">
                                    {entry.totalUnits}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {entry.needsRecalculation && (
                                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                                          Outdated
                                        </span>
                                      )}
                                      {entry.manualOverride !== "none" ? (
                                        <span
                                          className={cn(
                                            "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                            entry.manualOverride === "include"
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-orange-100 text-orange-700"
                                          )}
                                        >
                                          Override: {overrideLabel}
                                        </span>
                                      ) : entry.isQualified ? (
                                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                          Qualified
                                        </span>
                                      ) : (
                                        <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                                          Not Qualified
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="max-w-[200px] px-4 py-3 text-xs text-muted-foreground">
                                    {entry.disqualificationReasons.length > 0
                                      ? entry.disqualificationReasons.map((r, i) => (
                                          <span key={i} className="block">
                                            • {r}
                                          </span>
                                        ))
                                      : entry.isQualified
                                      ? "—"
                                      : "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-center">
                                    <select
                                      value={entry.manualOverride}
                                      onChange={(e) =>
                                        handleOverride(
                                          entry.id,
                                          e.target.value as
                                            | "none"
                                            | "include"
                                            | "exclude"
                                        )
                                      }
                                      className="h-8 rounded-md border border-border bg-white px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                                    >
                                      <option value="none">None</option>
                                      <option value="include">Include</option>
                                      <option value="exclude">Exclude</option>
                                    </select>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}
