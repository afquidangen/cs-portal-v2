"use client"

import { useMemo, useState } from "react"
import { BookOpen, CheckCircle2, Clock, DoorOpen, Mail, RefreshCw, ShieldCheck, Trash2, UserRoundCheck, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Panel } from "../shared/dashboard-ui"
import type { AvailabilityStatus, FacultyRecord } from "../../data/portal-data"
import type { PortalModuleProps } from "./types"

const STATUS_COLORS: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  Available: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  "In Class": {
    icon: Clock,
    className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200",
  },
  "Consultation Only": {
    icon: Users,
    className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200",
  },
  "Out of Office": {
    icon: DoorOpen,
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
  },
}

const STATUS_FILTERS: { label: string; value: AvailabilityStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Available", value: "Available" },
  { label: "In Class", value: "In Class" },
  { label: "Consultation", value: "Consultation Only" },
  { label: "Out of Office", value: "Out of Office" },
]

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function InstructorsModule({ model }: PortalModuleProps) {
  const { faculty, users, visibleSchedules, deleteFacultyMember, syncFacultyFromUsers, role } = model

  const [enrollmentFilter, setEnrollmentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | "All">("All")

  const myInstructorNames = useMemo(() => {
    if (role !== "student") return new Set<string>()
    return new Set(visibleSchedules.map((s) => s.instructor))
  }, [visibleSchedules, role])

  const userByEmail = useMemo(() => {
    const map = new Map<string, (typeof users)[number]>()
    for (const u of users) {
      if (u.role === "faculty" && !u.deletedAt) {
        map.set(u.email.toLowerCase().trim(), u)
      }
    }
    return map
  }, [users])

  const mergedFaculty = useMemo(() => {
    const activeEmails = new Set(userByEmail.keys())
    const seen = new Map<string, FacultyRecord>()
    for (const fr of faculty) {
      const email = fr.email?.toLowerCase().trim() ?? ""
      if (!activeEmails.has(email)) continue
      const key = fr.name.toLowerCase().trim()
      seen.set(key, fr)
    }
    return Array.from(seen.values()).map((fr) => {
      const user = userByEmail.get(fr.email?.toLowerCase().trim() ?? "")
      return {
        id: fr.id,
        name: user?.name ?? fr.name,
        position: fr.position,
        email: user?.email ?? fr.email,
        education: fr.education,
        status: fr.status,
        statusUpdatedAt: fr.statusUpdatedAt,
        notes: fr.notes,
        schedule: fr.schedule,
        photoUrl: user?.photoUrl,
      }
    })
  }, [faculty, userByEmail])

  const enrollmentFilterOptions = useMemo(() => {
    if (role !== "student") return ["All"]
    return ["All", "My Instructors"]
  }, [role])

  const visibleFaculty = useMemo(() => {
    let filtered = mergedFaculty
    if (enrollmentFilter === "My Instructors" && role === "student") {
      filtered = filtered.filter((m) => myInstructorNames.has(m.name))
    }
    if (statusFilter !== "All") {
      filtered = filtered.filter((m) => m.status === statusFilter)
    }
    return filtered
  }, [mergedFaculty, enrollmentFilter, statusFilter, myInstructorNames, role])

  function handleDelete(id: string, name: string) {
    model.setPendingConfirm({
      title: "Delete Faculty",
      description: `Delete faculty account "${name}"? This will permanently remove it from the database.`,
      variant: "destructive",
      onConfirm: () => {
        deleteFacultyMember(id)
      },
    })
  }

  return (
    <Panel
      title="Instructor Information"
      className="[&>div:first-child]:hidden"
    >
      <div className="space-y-4 pb-6 pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Instructor Information</h1>
            <p className="mt-2 text-sm text-slate-600">Find faculty profiles, contact details, and current availability.</p>
          </div>
          {role === "admin" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={syncFacultyFromUsers}
              className="h-10 rounded-md border-slate-200"
            >
              <RefreshCw className="size-4" />
              Sync from Users
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {role === "student" ? (
            <div className="flex flex-wrap gap-1.5">
              {enrollmentFilterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setEnrollmentFilter(opt)}
                  className={
                    opt === enrollmentFilter
                      ? "rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                      : "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  }
                >
                  {opt === "All" ? "All Instructors" : "My Instructors"}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleFaculty.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-slate-200 bg-white py-10 text-center">
            <UserRoundCheck className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No faculty accounts found.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Instructor profiles will appear here once faculty accounts are available.
            </p>
          </div>
        ) : (
          visibleFaculty.map((member) => {
            const statusColor = STATUS_COLORS[member.status] ?? STATUS_COLORS["Out of Office"]
            const StatusIcon = statusColor.icon
            return (
            <article
              key={member.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex gap-4">
                <Avatar className="mt-1 size-16 shrink-0 ring-2 ring-border">
                  <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-semibold tracking-tight text-slate-950">
                        {member.name}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                        <ShieldCheck className="size-4" />
                        {member.position}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold", statusColor.className)}>
                        <StatusIcon className="size-3.5" />
                        {member.status}
                      </span>
                      {member.statusUpdatedAt ? (
                        <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                          Updated {timeAgo(member.statusUpdatedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-foreground/80">
                    <p className="flex items-start gap-2">
                      <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">{member.education}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">{member.email}</span>
                    </p>
                  </div>

                  {member.notes && (
                    <p className="border-l-2 border-muted-foreground/20 pl-3 text-sm leading-6 text-foreground/60">
                      {member.notes}
                    </p>
                  )}
                </div>

                {role === "admin" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(member.id, member.name)}
                    className="shrink-0 text-destructive hover:text-destructive"
                    title="Delete faculty account"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </article>
          )})
        )}
      </div>
      </div>
    </Panel>
  )
}
