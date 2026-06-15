"use client"

import { Activity, CalendarDays, ChevronLeft, ChevronRight, Clock, FileClock, Filter, RefreshCw, Search, ShieldCheck, User, Users, X } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type PickerTarget = "from" | "to"

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function buildCalendarGrid(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const grid: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function AuditModule({ model }: PortalModuleProps) {
  const { auditLogs } = model
  const [search, setSearch] = useState("")
  const [actorFilter, setActorFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("from")
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  const todayStr = useMemo(() => toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), [])

  const actors = Array.from(new Set(auditLogs.map((log: { actor: string }) => log.actor)))

  const filtered = auditLogs.filter((log: { actor: string; action: string; time: string }) => {
    if (actorFilter !== "All" && log.actor !== actorFilter) return false
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false
    if (dateFrom) {
      const logDate = log.time.slice(0, 10)
      if (logDate < dateFrom) return false
    }
    if (dateTo) {
      const logDate = log.time.slice(0, 10)
      if (logDate > dateTo) return false
    }
    return true
  })

  const calendarGrid = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth])

  const openCalendar = useCallback((target: PickerTarget) => {
    const currentDate = target === "from" ? dateFrom : dateTo
    if (currentDate) {
      const d = new Date(currentDate + "T00:00:00")
      setCalYear(d.getFullYear())
      setCalMonth(d.getMonth())
    } else {
      const d = new Date()
      setCalYear(d.getFullYear())
      setCalMonth(d.getMonth())
    }
    setPickerTarget(target)
    setShowCalendar(true)
  }, [dateFrom, dateTo])

  const handlePrevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const handleDateSelect = useCallback((day: number) => {
    const iso = toISODate(calYear, calMonth, day)
    if (pickerTarget === "from") setDateFrom(iso)
    else setDateTo(iso)
    setShowCalendar(false)
  }, [calYear, calMonth, pickerTarget])

  const clearDates = useCallback(() => {
    setDateFrom("")
    setDateTo("")
  }, [])

  const formatLabel = (iso: string) => {
    if (!iso) return ""
    const d = new Date(iso + "T00:00:00")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <Panel
      title="Audit Trail"
      className="[&>div:first-child]:hidden"
    >
      <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <FileClock className="size-8" />
        </div>
        <div>
          <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <ShieldCheck className="size-4" />
            System-wide Activity Log
          </p>
          <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            Audit Logs
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor account activity, portal changes, and administrative actions across the system.
          </p>
          <div className="mt-4 flex max-w-xl flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search actions..."
                className="h-9 w-52 rounded-xl bg-card pl-8 text-xs"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Clock className="size-3.5" />
              <span>{auditLogs.length} entries</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Total Entries", value: String(auditLogs.length), icon: FileClock },
          { label: "Visible Results", value: String(filtered.length), icon: Activity },
          { label: "Actors", value: String(actors.length), icon: Users },
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        {actors.length > 1 ? (
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Filter by actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Actors</SelectItem>
              {actors.map((actor: string) => (
                <SelectItem key={actor} value={actor}>{actor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="flex items-center gap-1">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <button
            type="button"
            onClick={() => openCalendar("from")}
            className={cn(
              "h-8 rounded-xl border border-border bg-card px-3 text-xs transition-colors hover:bg-muted",
              dateFrom ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {dateFrom ? formatLabel(dateFrom) : "From"}
          </button>
          <span className="text-xs text-muted-foreground">—</span>
          <button
            type="button"
            onClick={() => openCalendar("to")}
            className={cn(
              "h-8 rounded-xl border border-border bg-card px-3 text-xs transition-colors hover:bg-muted",
              dateTo ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {dateTo ? formatLabel(dateTo) : "To"}
          </button>
        </div>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={clearDates}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            title="Clear date filter"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Dialog open={showCalendar} onOpenChange={(open) => { if (!open) setShowCalendar(false) }}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Select {pickerTarget === "from" ? "Start" : "End"} Date</DialogTitle>
          </DialogHeader>
          <div className="p-1">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={handlePrevMonth}>
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">{monthNames[calMonth]} {calYear}</span>
              <button type="button" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={handleNextMonth}>
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {dayHeaders.map((d) => (<span key={d}>{d}</span>))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarGrid.map((day, i) => {
                if (day === null) return <div key={i} />
                const iso = toISODate(calYear, calMonth, day)
                const isToday = iso === todayStr
                const isSelected = iso === (pickerTarget === "from" ? dateFrom : dateTo)
                return (
                  <button
                    key={iso}
                    type="button"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-foreground hover:bg-muted"
                    )}
                    onClick={() => handleDateSelect(day)}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <RefreshCw className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No audit logs found.
            </p>
            <p className="text-xs text-muted-foreground/60">
              {search || actorFilter !== "All" || dateFrom || dateTo
                ? "Try adjusting your filters."
                : "Activity will appear here as actions are performed."}
            </p>
          </div>
        ) : (
          filtered.map((log: { id: string; actor: string; action: string; time: string }, index: number) => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm transition-all hover:shadow-md edu-bg-soft-lapis",
                index === 0 && "ring-1 ring-primary/10"
              )}
            >
              <div className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {log.action}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {log.actor}
                    </p>
                  </div>
                  <StatusBadge value={log.time} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}
