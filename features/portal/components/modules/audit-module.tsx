"use client"

import { Activity, ArrowDownAZ, ArrowUpAZ, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, FileClock, Filter, RefreshCw, Search, ShieldCheck, User, Users, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { StatusBadge, Tooltip } from "../shared/dashboard-ui"
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

const CATEGORIES = [
  { value: "All", label: "All Categories" },
  { value: "User Management", label: "User Management", keywords: ["account", "user", "role"] },
  { value: "Faculty", label: "Faculty", keywords: ["faculty"] },
  { value: "Enrollment / Grades", label: "Enrollment / Grades", keywords: ["student", "grade", "enrolled", "roster", "unenrolled", "auto-enrolled", "correction"] },
  { value: "Tickets / Feedback", label: "Tickets / Feedback", keywords: ["ticket", "feedback"] },
  { value: "Schedules", label: "Schedules", keywords: ["schedule", "class section"] },
  { value: "Semesters", label: "Semesters", keywords: ["semester"] },
  { value: "Subjects", label: "Subjects", keywords: ["subject"] },
  { value: "Curriculum", label: "Curriculum", keywords: ["curriculum", "term"] },
  { value: "Theses", label: "Theses", keywords: ["thesis"] },
  { value: "Announcements", label: "Announcements", keywords: ["announcement"] },
  { value: "Quick Links / Downloads", label: "Quick Links / Downloads", keywords: ["quick link", "manual", "downloadable"] },
  { value: "CSO / Gallery", label: "CSO / Gallery", keywords: ["cso", "gallery", "event"] },
]

function getCategory(action: string): string {
  const lower = action.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.value === "All") continue
    if (cat.keywords?.some((kw) => lower.includes(kw))) return cat.value
  }
  return "Other"
}

function getLogDateStr(log: { createdAt?: string; time: string }): string | null {
  if (log.createdAt) {
    const d = new Date(log.createdAt)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  const d = new Date(log.time)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  const m = log.time.match(/^(\w+\s+\d+,\s+\d{4})/)
  if (m) {
    const d2 = new Date(m[1])
    if (!isNaN(d2.getTime())) return d2.toISOString().slice(0, 10)
  }
  return null
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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [actorSearch, setActorSearch] = useState("")
  const [actorDropdownOpen, setActorDropdownOpen] = useState(false)
  const actorDropdownRef = useRef<HTMLDivElement>(null)

  const todayStr = useMemo(() => toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()), [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actorDropdownRef.current && !actorDropdownRef.current.contains(e.target as Node)) {
        setActorDropdownOpen(false)
      }
    }
    if (actorDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [actorDropdownOpen])

  const actors = Array.from(new Set(auditLogs.map((log: { actor: string }) => log.actor)))

  const filtered = auditLogs.filter((log: { actor: string; action: string; time: string; createdAt?: string }) => {
    if (actorFilter !== "All" && log.actor !== actorFilter) return false
    if (categoryFilter !== "All" && getCategory(log.action) !== categoryFilter) return false
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false
    if (dateFrom || dateTo) {
      const logDateStr = getLogDateStr(log)
      if (logDateStr) {
        if (dateFrom && logDateStr < dateFrom) return false
        if (dateTo && logDateStr > dateTo) return false
      }
    }
    return true
  })

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = getLogDateStr(a)
      const db = getLogDateStr(b)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return sortOrder === "newest" ? db.localeCompare(da) : da.localeCompare(db)
    })
  }, [filtered, sortOrder])

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
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Audit Logs</h1>
        <p className="mt-2 text-sm text-slate-600">
          Monitor account activity, portal changes, and administrative actions across the system.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Total Entries", value: String(auditLogs.length), icon: FileClock },
          { label: "Visible Results", value: String(filtered.length), icon: Activity },
          { label: "Actors", value: String(actors.length), icon: Users },
        ].map((item) => {
          const Icon = item.icon

          return (
          <Card key={item.label} className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative" ref={actorDropdownRef}>
          <button
            type="button"
            onClick={() => { setActorDropdownOpen((o) => !o); if (!actorDropdownOpen) setActorSearch("") }}
            className="flex h-8 w-44 items-center justify-between rounded-xl border border-border bg-white px-3 text-xs text-black shadow-sm transition-colors hover:bg-slate-50 dark:bg-[#0f1b2b] dark:text-white dark:hover:bg-secondary"
          >
            <span className={cn("truncate", actorFilter !== "All" ? "font-medium text-black dark:text-white" : "text-muted-foreground")}>
              {actorFilter !== "All" ? actorFilter : "All Actors"}
            </span>
            <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-70" />
          </button>
          {actorDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-white text-black shadow-2xl shadow-blue-950/10 dark:bg-[#0f1b2b] dark:text-white dark:shadow-black/40 overflow-hidden">
              <div className="p-1.5">
                <Input
                  placeholder="Search actors..."
                  value={actorSearch}
                  onChange={(e) => setActorSearch(e.target.value)}
                  className="h-7 text-xs"
                  autoFocus
                />
              </div>
              <ScrollArea className="max-h-48">
                <div className="p-1 pt-0">
                  {actors
                    .filter((a) => a.toLowerCase().includes(actorSearch.toLowerCase()))
                    .map((actor) => (
                      <button
                        key={actor}
                        type="button"
                        onClick={() => { setActorFilter(actor); setActorDropdownOpen(false); setActorSearch("") }}
                        className="flex w-full items-center rounded-md px-2 py-1.5 text-xs text-black hover:bg-slate-100 dark:text-white dark:hover:bg-[#123768]"
                      >
                        <Check className={cn("mr-2 size-3 shrink-0", actorFilter === actor ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{actor}</span>
                      </button>
                    ))}
                  {actors.filter((a) => a.toLowerCase().includes(actorSearch.toLowerCase())).length === 0 && (
                    <p className="px-2 py-4 text-center text-xs text-muted-foreground">No actors found</p>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-border p-1">
                <button
                  type="button"
                  onClick={() => { setActorFilter("All"); setActorDropdownOpen(false); setActorSearch("") }}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-xs text-black hover:bg-slate-100 dark:text-white dark:hover:bg-[#123768]"
                >
                  <Check className={cn("mr-2 size-3 shrink-0", actorFilter === "All" ? "opacity-100" : "opacity-0")} />
                  All Actors
                </button>
              </div>
            </div>
          )}
        </div>
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
          <Tooltip content="Clear date filter">
            <button
              type="button"
              onClick={clearDates}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </Tooltip>
        )}
        <Tooltip content={sortOrder === "newest" ? "Newest first" : "Oldest first"}>
          <button
            type="button"
            onClick={() => setSortOrder((o) => o === "newest" ? "oldest" : "newest")}
            className="flex h-8 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            {sortOrder === "newest" ? <ArrowDownAZ className="size-3.5" /> : <ArrowUpAZ className="size-3.5" />}
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </Tooltip>
      </div>

      <Dialog open={showCalendar} onOpenChange={(open) => { if (!open) setShowCalendar(false) }}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Select {pickerTarget === "from" ? "Start" : "End"} Date</DialogTitle>
          </DialogHeader>
          <div className="p-1">
            <div className="mb-3 flex items-center justify-between">
              <Tooltip content="Previous month">
                <button type="button" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={handlePrevMonth}>
                  <ChevronLeft className="size-4" />
                </button>
              </Tooltip>
              <span className="text-sm font-semibold text-foreground">{monthNames[calMonth]} {calYear}</span>
              <Tooltip content="Next month">
                <button type="button" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={handleNextMonth}>
                  <ChevronRight className="size-4" />
                </button>
              </Tooltip>
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
              {search || actorFilter !== "All" || categoryFilter !== "All" || dateFrom || dateTo
                ? "Try adjusting your filters."
                : "Activity will appear here as actions are performed."}
            </p>
          </div>
        ) : (
          sorted.map((log: { id: string; actor: string; action: string; time: string }, index: number) => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md",
                index === 0 && "ring-1 ring-blue-500/10"
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-sm">
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
    </div>
  )
}
