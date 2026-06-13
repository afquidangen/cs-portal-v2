"use client"

import { useMemo } from "react"
import { BookOpen, CheckCircle2, Clock, DoorOpen, GraduationCap, Mail, RefreshCw, ShieldCheck, Trash2, UserRoundCheck, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Panel } from "../shared/dashboard-ui"
import type { FacultyRecord } from "../../data/portal-data"
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function InstructorsModule({ model }: PortalModuleProps) {
  const { faculty, users, deleteFacultyMember, syncFacultyFromUsers, role } = model

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
        notes: fr.notes,
        schedule: fr.schedule,
        photoUrl: user?.photoUrl,
      }
    })
  }, [faculty, userByEmail])

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
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
          <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
              <GraduationCap className="size-8" />
            </div>
            <div>
              <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <Users className="size-4" />
                Faculty Profiles
              </p>
              <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
                Instructor Information
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Faculty directory with current teaching status, academic background, and contact details.
              </p>
            </div>
          </div>
          {role === "admin" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={syncFacultyFromUsers}
              className="relative mt-4 rounded-lg bg-card/80 sm:absolute sm:right-4 sm:top-4 sm:mt-0"
            >
              <RefreshCw className="size-4" />
              Sync from Users
            </Button>
          ) : null}
        </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {mergedFaculty.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <UserRoundCheck className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No faculty accounts found.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Instructor profiles will appear here once faculty accounts are available.
            </p>
          </div>
        ) : (
          mergedFaculty.map((member) => {
            const statusColor = STATUS_COLORS[member.status] ?? STATUS_COLORS["Out of Office"]
            const StatusIcon = statusColor.icon
            return (
            <article
              key={member.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
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
                      <h4 className="truncate text-xl font-black tracking-tight text-foreground">
                        {member.name}
                      </h4>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <ShieldCheck className="size-4" />
                        {member.position}
                      </p>
                    </div>
                    <span className={cn("shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold", statusColor.className)}>
                      <StatusIcon className="size-3.5" />
                      {member.status}
                    </span>
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
