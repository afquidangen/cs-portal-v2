"use client"

import { Trash2, RefreshCw } from "lucide-react"

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
      eyebrow="Faculty profiles"
      actions={role === "admin" ? (
        <Button size="sm" variant="outline" onClick={syncFacultyFromUsers} className="rounded-2xl">
          <RefreshCw className="size-4" />
          Sync from Users
        </Button>
      ) : undefined}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {activeFaculty.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">No faculty accounts found.</p>
        ) : (
          activeFaculty.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {member.name}
                    <StatusBadge value={member.status} className="ml-2" />
                  </h4>
                  <p className="text-sm text-foreground/70">{member.position}</p>
                  <p className="mt-2 text-sm text-foreground/80">
                    {member.education}
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">
                    {member.email}
                  </p>
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
    </Panel>
  )
}
