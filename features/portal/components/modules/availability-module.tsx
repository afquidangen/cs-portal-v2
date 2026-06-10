"use client"

import { CheckCircle2, Clock, DoorOpen, Save, Users } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  availabilityOptions,
  type AvailabilityStatus,
} from "../../data/portal-data"
import {
  Panel,
  SearchBox,
  Select,
  StatusBadge,
  Textarea,
  Metric,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

const STATUS_TABS: { label: string; value: AvailabilityStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Available", value: "Available" },
  { label: "In Class", value: "In Class" },
  { label: "Consultation", value: "Consultation Only" },
  { label: "Out of Office", value: "Out of Office" },
]

function StatusSummary({ faculty }: { faculty: PortalModuleProps["model"]["faculty"] }) {
  const counts = {
    Available: faculty.filter((f) => f.status === "Available").length,
    "In Class": faculty.filter((f) => f.status === "In Class").length,
    "Consultation Only": faculty.filter((f) => f.status === "Consultation Only").length,
    "Out of Office": faculty.filter((f) => f.status === "Out of Office").length,
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric
        label="Available"
        value={String(counts.Available)}
        icon={CheckCircle2}
        tone="abyss"
      />
      <Metric
        label="In Class"
        value={String(counts["In Class"])}
        icon={Clock}
        tone="slate"
      />
      <Metric
        label="Consultation"
        value={String(counts["Consultation Only"])}
        icon={Users}
        tone="lapis"
      />
      <Metric
        label="Out of Office"
        value={String(counts["Out of Office"])}
        icon={DoorOpen}
        tone="glacier"
      />
    </div>
  )
}

function FacultyCard({
  member,
  showSchedule = true,
}: {
  member: PortalModuleProps["model"]["faculty"][number]
  showSchedule?: boolean
}) {
  return (
    <div className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm transition-colors hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="edu-lapis flex size-10 items-center justify-center rounded-xl text-xs font-semibold shadow-sm">
              {member.name
                .split(" ")
            .map((p: string) => p[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{member.name}</h4>
              <p className="text-sm text-foreground/70">
                {member.position} &middot; {member.role}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-foreground/80">{member.notes}</p>
        </div>
        <StatusBadge value={member.status} />
      </div>

      {showSchedule && member.schedule.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
          {member.schedule.map((slot) => (
            <span
              key={slot}
              className="rounded-xl border border-border bg-muted px-2.5 py-1"
            >
              {slot}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminStatusEditor({ model }: PortalModuleProps) {
  const { faculty } = model

  return (
    <Panel title="Manage Faculty Status" eyebrow="Admin control panel">
      <div className="space-y-3">
        {faculty.map((member) => (
          <div
            key={member.id}
            className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm transition-colors hover:shadow-md"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-foreground">{member.name}</h4>
                <p className="text-sm text-foreground/70">
                  {member.position} &middot; {member.role}
                </p>
                <p className="mt-1 text-xs text-foreground/50">{member.email}</p>
                <p className="mt-2 text-sm text-foreground/80">{member.notes}</p>

                {member.schedule.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground/70">
                    {member.schedule.map((slot) => (
                      <span
                        key={slot}
                        className="rounded-xl border border-border bg-muted px-2.5 py-1"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 lg:flex-col">
                <StatusBadge value={member.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
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
      <StatusSummary faculty={faculty} />

      <Panel
        title="Faculty Directory"
        eyebrow="Search and filter instructors"
        actions={
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search faculty"
          />
        }
      >
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-black hover:bg-slate-100 dark:bg-[#0f1b2b] dark:text-white dark:hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleFaculty.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No instructors match the current filter.
            </p>
          ) : (
            visibleFaculty.map((member) => (
              <FacultyCard key={member.id} member={member} />
            ))
          )}
        </div>
      </Panel>
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

  return (
    <Panel title="Quick Status Control" eyebrow="My availability">
      <div className="edu-bg-soft-glacier mb-4 flex items-center gap-3 rounded-xl border border-[var(--edu-border-glacier)] p-3">
        <div className="edu-lapis flex size-10 items-center justify-center rounded-xl text-sm font-semibold shadow-sm">
          {profile.name
            .split(" ")
            .map((p: string) => p[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {profile.name}
          </p>
          <p className="text-xs text-foreground/60">{profile.title}</p>
        </div>
      </div>

      <form onSubmit={handleFacultySelfStatus} className="space-y-3">
        <Select
          value={myFacultyStatus}
          onChange={(value) => setMyFacultyStatus(value as AvailabilityStatus)}
          options={availabilityOptions}
          label="Status"
        />

        <Textarea
          value={myFacultyNotes}
          onChange={setMyFacultyNotes}
          placeholder="Daily note"
          rows={3}
        />

        <Button type="submit" className="rounded-lg">
          <Save className="size-4" />
          Save Status
        </Button>
      </form>
    </Panel>
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
    <Panel
      title="Live Faculty Directory"
      eyebrow="Status and profiles"
      actions={
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search faculty"
        />
      }
    >
      {showFilter && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-black hover:bg-slate-100 dark:bg-[#0f1b2b] dark:text-white dark:hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visibleFaculty.map((member) => (
          <FacultyCard key={member.id} member={member} />
        ))}
      </div>
    </Panel>
  )
}
