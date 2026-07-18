"use client"

import { Award, EyeOff, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { YEAR_LEVELS, type YearLevel } from "@/features/portal/lib/year-level"

type RankingsEntry = {
  id: string
  studentId: string
  studentName: string
  gwa: number | null
  totalUnits: number
  yearLevel: string
  rank: number | null
  isQualified: boolean
  manualOverride: "none" | "include" | "exclude"
  isPrivate?: boolean
  semester: string
  schoolYearStart: number
  schoolYearEnd: number
}

import type { UserRecord } from "../../data/portal-data"

type Props = {
  semesterId?: string
  facultyView?: boolean
  refreshTrigger?: number
  users?: UserRecord[]
}

export function DeansListRankingsCard({ semesterId, facultyView, refreshTrigger, users }: Props) {
  const [entries, setEntries] = useState<RankingsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [activeYearLevel, setActiveYearLevel] = useState<"all" | YearLevel>("all")

  const activeStudentIds = useMemo(() => {
    if (!users) return null
    return new Set(
      users
        .filter(u => u.role === "student" && !u.deletedAt)
        .map(u => u.id)
    )
  }, [users])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (semesterId) {
      params.set("semesterId", semesterId)
    } else {
      params.set("latest", "true")
    }
    fetch(`/api/portal/deans-list/rankings?${params}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json?.data ?? []
        const filtered = activeStudentIds
          ? data.filter((entry: RankingsEntry) => activeStudentIds.has(entry.studentId))
          : data
        setEntries(filtered)
      })
      .catch(() => {
        setEntries([])
      })
      .finally(() => setLoading(false))
  }, [semesterId, refreshTrigger, activeStudentIds])

  const grouped = facultyView
    ? entries.reduce<Record<string, RankingsEntry[]>>((acc, e) => {
        const yl = e.yearLevel || "First Year"
        if (!acc[yl]) acc[yl] = []
        acc[yl].push(e)
        return acc
      }, {})
    : {}

  const displayed = facultyView
    ? activeYearLevel === "all"
      ? entries
      : grouped[activeYearLevel] ?? []
    : entries

  const latestSemesterLabel = entries.length > 0
    ? `${entries[0].semester}, A.Y. ${entries[0].schoolYearStart}-${entries[0].schoolYearEnd}`
    : undefined

  return (
    <Card className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-950">
              <Award className="size-5 text-amber-500" />
              Dean&apos;s List Rankings
            </CardTitle>
            {latestSemesterLabel && (
              <p className="mt-1 text-sm text-slate-500">{latestSemesterLabel}</p>
            )}
          </div>
          {loading && <Loader2 className="size-4 animate-spin text-slate-400" />}
        </div>

        {facultyView && Object.keys(grouped).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveYearLevel("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                activeYearLevel === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              All Year Levels
            </button>
            {YEAR_LEVELS.filter((yl) => grouped[yl]?.length > 0).map((yl) => (
              <button
                key={yl}
                type="button"
                onClick={() => setActiveYearLevel(yl)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeYearLevel === yl
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {yl} ({grouped[yl].length})
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-slate-300" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="mb-3 size-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No rankings available</p>
            <p className="mt-1 text-xs text-slate-400">
              {facultyView
                ? "Dean's List has not been published yet."
                : "Rankings will appear here once published."}
            </p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-xs font-semibold text-slate-500">
                  <th className="w-12 px-4 py-3 text-center">#</th>
                  {facultyView && activeYearLevel === "all" && (
                    <th className="px-4 py-3">Year Level</th>
                  )}
                  <th className="px-4 py-3">Student</th>
                  <th className="w-20 px-4 py-3 text-right">GWA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-center font-mono text-sm font-bold text-slate-700">
                      {e.rank ?? "—"}
                    </td>
                    {facultyView && activeYearLevel === "all" && (
                      <td className="px-4 py-3 text-xs text-slate-500">{e.yearLevel}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm",
                          e.isPrivate ? "text-slate-400 italic" : "font-medium text-slate-900"
                        )}>
                          {e.isPrivate ? "Private Student" : e.studentName}
                        </span>
                        {e.isPrivate && <EyeOff className="size-3.5 text-slate-300" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-slate-700">
                      {e.gwa != null ? e.gwa.toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
