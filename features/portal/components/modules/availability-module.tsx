"use client"

import { CalendarCheck, CheckCircle2, Clock, DoorOpen, Mail, MessageSquareText, Save, SearchX, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

import {
  availabilityOptions,
  type AvailabilityStatus,
} from "../../data/portal-data"
import {
  Textarea,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

const STATUS_TABS: { label: string; value: AvailabilityStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Available", value: "Available" },
  { label: "In Class", value: "In Class" },
  { label: "Consultation", value: "Consultation Only" },
  { label: "Out of Office", value: "Out of Office" },
]

const STATUS_CONTROL_UI: Record<AvailabilityStatus, { icon: typeof CheckCircle2; helper: string; className: string }> = {
  Available: {
    icon: CheckCircle2,
    helper: "Ready for walk-ins and student concerns.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-200",
  },
  "In Class": {
    icon: Clock,
    helper: "Currently teaching or handling a class.",
    className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/15 dark:text-sky-200",
  },
  "Consultation Only": {
    icon: Users,
    helper: "Available for scheduled consultation.",
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-200",
  },
  "Out of Office": {
    icon: DoorOpen,
    helper: "Away from office or unavailable.",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/15 dark:text-amber-100",
  },
}

function StatusSummary({ faculty }: { faculty: PortalModuleProps["model"]["faculty"] }) {
  const counts = {
    Available: faculty.filter((f) => f.status === "Available").length,
    "In Class": faculty.filter((f) => f.status === "In Class").length,
    "Consultation Only": faculty.filter((f) => f.status === "Consultation Only").length,
    "Out of Office": faculty.filter((f) => f.status === "Out of Office").length,
  }

  const stats = [
    { label: "Available", value: counts.Available, status: "Available" as AvailabilityStatus },
    { label: "In Class", value: counts["In Class"], status: "In Class" as AvailabilityStatus },
    { label: "Consultation", value: counts["Consultation Only"], status: "Consultation Only" as AvailabilityStatus },
    { label: "Out of Office", value: counts["Out of Office"], status: "Out of Office" as AvailabilityStatus },
  ]

  return (
    <div className="grid gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
      {stats.map((stat) => {
        const statusUi = STATUS_CONTROL_UI[stat.status]
        const Icon = statusUi.icon
        return (
          <Card key={stat.label} className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg border shadow-sm", statusUi.className)}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function FacultyCard({
  member,
  showSchedule = true,
}: {
  member: PortalModuleProps["model"]["faculty"][number]
  showSchedule?: boolean
}) {
  const statusUi = STATUS_CONTROL_UI[member.status]
  const StatusIcon = statusUi.icon

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar className="size-11 shrink-0 ring-1 ring-border">
              <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-blue-50 text-xs font-semibold text-blue-600 ring-1 ring-blue-100">
                {member.name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold tracking-tight text-foreground">{member.name}</h4>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {member.position}
              </p>
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground/70">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{member.email}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={cn("rounded-lg px-2.5 py-1.5 text-xs font-bold", statusUi.className)}>
              <StatusIcon className="mr-1 inline-block size-3.5" />
              {member.status}
            </span>
            {member.statusUpdatedAt ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400 whitespace-nowrap">
                <Clock className="size-3" />
                {timeAgo(member.statusUpdatedAt)}
              </span>
            ) : null}
          </div>
        </div>
        {member.notes ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-foreground/70">{member.notes}</p>
        ) : null}
        {showSchedule && member.schedule.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {member.schedule.map((slot) => (
              <span
                key={slot}
                className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground/60"
              >
                {slot}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function AdminStatusEditor({ model }: PortalModuleProps) {
  const { faculty, setFaculty, users } = model

  const userByEmail = useMemo(() => {
    const map = new Map<string, (typeof users)[number]>()
    for (const u of users) {
      if (u.role === "faculty" && !u.deletedAt) {
        map.set(u.email.toLowerCase().trim(), u)
      }
    }
    return map
  }, [users])

  const visibleFaculty = useMemo(() => {
    const activeEmails = new Set(userByEmail.keys())
    return faculty
      .filter((fr) => activeEmails.has(fr.email.toLowerCase().trim()))
      .map((fr) => {
        const user = userByEmail.get(fr.email.toLowerCase().trim())
        return {
          ...fr,
          name: user?.name ?? fr.name,
          email: user?.email ?? fr.email,
        }
      })
  }, [faculty, userByEmail])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/portal/faculty")
        if (res.ok) {
          const data = await res.json()
          setFaculty(data.data ?? data ?? [])
        }
      } catch {
        // silent
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [setFaculty])

  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <CardTitle className="text-base font-semibold text-slate-950">Faculty Status</CardTitle>
        <p className="text-xs font-medium text-blue-600">Admin control panel</p>
      </CardHeader>
      <CardContent className="p-5">
      <div className="space-y-2">
        {visibleFaculty.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No faculty members found.
          </p>
        ) : (
          visibleFaculty.map((member) => {
            const statusUi = STATUS_CONTROL_UI[member.status]
            const StatusIcon = statusUi.icon
            return (
              <div
                key={member.id}
                className="flex items-stretch gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <div className={cn("flex w-10 shrink-0 items-center justify-center", statusUi.className.replace(/border-\S+/g, "").trim())}>
                  <StatusIcon className="size-4" />
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">{member.name}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {member.position} &middot; {member.email}
                    </p>
                    {member.notes ? (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-1">{member.notes}</p>
                    ) : null}
                    {member.schedule.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {member.schedule.map((slot) => (
                          <span
                            key={slot}
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold", statusUi.className)}>
                    <StatusIcon className="mr-1.5 inline-block size-3.5" />
                    {member.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
      </CardContent>
    </Card>
  )
}

export function AvailabilityModule({ model }: PortalModuleProps) {
  const { faculty, role } = model

  if (role === "faculty") {
    return (
      <div className="space-y-5">
        <FacultyAvailabilityPanel model={model} />
        <FacultyDirectoryPanel model={model} showFilter={false} />
      </div>
    )
  }

  if (role === "admin") {
    return (
      <div className="space-y-5">
        <div className="pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Teacher Status</h1>
          <p className="mt-2 text-sm text-slate-600">Track faculty availability, class presence, consultation status, and office updates in one dashboard.</p>
        </div>
        <StatusSummary faculty={faculty} />
        <AdminStatusEditor model={model} />
      </div>
    )
  }

  return <StudentAvailabilityView model={model} />
}

function StudentAvailabilityView({ model }: PortalModuleProps) {
  const { faculty, filteredFaculty, query, setQuery } = model
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | "All">("All")

  const visibleFaculty =
    statusFilter === "All"
      ? filteredFaculty
      : filteredFaculty.filter((m) => m.status === statusFilter)

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Teacher Status</h1>
        <p className="mt-2 text-sm text-slate-600">Check which instructors are available, in class, open for consultation, or out of office.</p>
      </div>
      <StatusSummary faculty={faculty} />

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
          <CardTitle className="text-base font-semibold text-slate-950">Faculty Directory</CardTitle>
          <p className="text-xs font-medium text-blue-600">Search and filter instructors</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search faculty"
                className="h-11 rounded-lg border border-slate-200 bg-white pl-10 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleFaculty.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No instructors match the current filter.
            </p>
          ) : (
            visibleFaculty.map((member) => (
              <FacultyCard key={member.id} member={member} />
            ))
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function FacultyAvailabilityPanel({ model }: PortalModuleProps) {
  const {
    handleFacultySelfStatus,
    myFacultyNotes,
    myFacultyStatus,
    setMyFacultyNotes,
    setMyFacultyStatus,
    profile,
  } = model

  const currentStatusUi = STATUS_CONTROL_UI[myFacultyStatus]
  const CurrentStatusIcon = currentStatusUi.icon

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <CalendarCheck className="size-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">My Status</h2>
          <p className="text-sm text-slate-600">Update your availability and daily note.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 ring-1 ring-blue-100">
                {profile.name
                  .split(" ")
                  .map((p: string) => p[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-950">
                  {profile.name}
                </p>
                <p className="text-sm text-slate-500">{profile.title}</p>
              </div>
            </div>
            <div className={`mt-4 rounded-xl border p-4 ${currentStatusUi.className}`}>
              <div className="flex items-start gap-3">
                <CurrentStatusIcon className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Current status</p>
                  <p className="mt-1 text-2xl font-black leading-tight">{myFacultyStatus}</p>
                  <p className="mt-2 text-sm leading-6 opacity-85">{currentStatusUi.helper}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleFacultySelfStatus}>
          <CardContent className="p-5">
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-950">Choose your availability</p>
              <p className="mt-1 text-xs text-slate-500">
                Select the status that best matches your current schedule.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {availabilityOptions.map((status) => {
                const statusUi = STATUS_CONTROL_UI[status]
                const StatusIcon = statusUi.icon
                const active = myFacultyStatus === status

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setMyFacultyStatus(status)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                      active ? statusUi.className : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <StatusIcon className="mt-0.5 size-5 shrink-0" />
                      <div>
                        <p className="font-bold">{status}</p>
                        <p className="mt-1 text-xs leading-5 opacity-80">{statusUi.helper}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4">
              <div className="space-y-1.5">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                  <MessageSquareText className="size-4 text-blue-600" />
                  Daily note
                </label>
                <Textarea
                  value={myFacultyNotes}
                  onChange={setMyFacultyNotes}
                  placeholder="Daily note"
                  rows={3}
                />
              </div>
            </div>

            <Button type="submit" className="mt-4 rounded-lg">
              <Save className="size-4" />
              Save Status
            </Button>
          </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}

export function FacultyDirectoryPanel({
  model,
  showFilter = true,
}: PortalModuleProps & { showFilter?: boolean }) {
  const { filteredFaculty, query, setQuery } = model
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | "All">("All")

  const visibleFaculty =
    !showFilter || statusFilter === "All"
      ? filteredFaculty
      : filteredFaculty.filter((m) => m.status === statusFilter)

  return (
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
        <CardTitle className="text-base font-semibold text-slate-950">Live Faculty Directory</CardTitle>
        <p className="text-xs font-medium text-blue-600">Status and profiles</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search faculty"
              className="h-11 rounded-lg border border-slate-200 bg-white pl-10 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
      {showFilter && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Faculty availability board</p>
              <p className="text-xs text-slate-500">
                Showing {visibleFaculty.length} of {filteredFaculty.length} faculty profiles
              </p>
            </div>
            <Users className="size-5 shrink-0 text-blue-600" />
          </div>
          <div className="grid gap-2 min-[420px]:grid-cols-2 lg:grid-cols-5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                statusFilter === tab.value
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>
      )}

      {visibleFaculty.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <SearchX className="mx-auto mb-3 size-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-900">No faculty matched the current view.</p>
          <p className="mt-1 text-xs text-slate-500">Try another status or search keyword.</p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visibleFaculty.map((member) => (
            <FacultyCard key={member.id} member={member} />
          ))}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
