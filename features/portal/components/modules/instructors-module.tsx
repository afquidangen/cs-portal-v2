"use client"

import { BookOpen, GraduationCap, Mail, RefreshCw, ShieldCheck, Trash2, UserRoundCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function InstructorsModule({ model }: PortalModuleProps) {
  const { faculty, users, deleteFacultyMember, syncFacultyFromUsers, role } = model
  const facultyUserNames = new Set(
    users.filter((u) => u.role === "faculty").map((u) => u.name.toLowerCase().trim())
  )
  const activeFaculty = faculty.filter((m) =>
    facultyUserNames.has(m.name.toLowerCase().trim())
  )

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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-center sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 sm:flex-row sm:justify-center sm:text-left">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
              <GraduationCap className="size-8" />
            </div>
            <div>
              <p className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground sm:justify-start">
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
        {activeFaculty.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <UserRoundCheck className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No faculty accounts found.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Instructor profiles will appear here once faculty accounts are available.
            </p>
          </div>
        ) : (
          activeFaculty.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="edu-lapis flex size-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold shadow-sm">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-bold tracking-tight text-foreground">
                        {member.name}
                      </h4>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <ShieldCheck className="size-4" />
                        {member.position}
                      </p>
                    </div>
                    <StatusBadge value={member.status} className="shrink-0" />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-foreground/80">
                    <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                      <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="min-w-0">{member.education}</span>
                    </p>
                    <p className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                      <Mail className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0 truncate">{member.email}</span>
                    </p>
                  </div>

                  {member.notes && (
                    <p className="mt-2 text-sm italic text-foreground/60">
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
          ))
        )}
      </div>
      </div>
    </Panel>
  )
}
