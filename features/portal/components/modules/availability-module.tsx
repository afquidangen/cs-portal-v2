"use client"

import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  type AvailabilityStatus,
  availabilityOptions,
} from "../../data/portal-data"
import {
  Panel,
  SearchBox,
  Select,
  StatusBadge,
  Textarea,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AvailabilityModule({ model }: PortalModuleProps) {
  const { faculty, role, updateFacultyStatus } = model

  if (role === "faculty") {
    return (
      <div className="space-y-5">
        <FacultyAvailabilityPanel model={model} />
        <FacultyDirectoryPanel model={model} />
      </div>
    )
  }

  if (role === "admin") {
    return (
      <Panel title="Admin Override Panel" eyebrow="Teacher availability">
        <div className="space-y-3">
          {faculty.map((member) => (
            <div
              key={member.id}
              className="grid gap-3 rounded-lg border border-slate-200 p-4 lg:grid-cols-[1fr_auto_auto]"
            >
              <div>
                <h4 className="font-semibold text-slate-950">
                  {member.name}
                </h4>
                <p className="text-sm text-slate-500">{member.notes}</p>
              </div>
              <Select
                value={member.status}
                onChange={(value) =>
                  updateFacultyStatus(member.id, value as AvailabilityStatus)
                }
                options={availabilityOptions}
              />
              <StatusBadge value={member.status} />
            </div>
          ))}
        </div>
      </Panel>
    )
  }

  return <FacultyDirectoryPanel model={model} />
}

export function FacultyAvailabilityPanel({ model }: PortalModuleProps) {
  const {
    handleFacultySelfStatus,
    myFacultyNotes,
    myFacultyStatus,
    setMyFacultyNotes,
    setMyFacultyStatus,
  } = model

  return (
    <Panel title="Quick Status Control" eyebrow="My availability">
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
        <Button type="submit">
          <Save className="size-4" />
          Save Status
        </Button>
      </form>
    </Panel>
  )
}

export function FacultyDirectoryPanel({ model }: PortalModuleProps) {
  const { filteredFaculty, query, setQuery } = model

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
      <div className="space-y-3">
        {filteredFaculty.map((member) => (
          <div
            key={member.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="font-semibold text-slate-950">
                  {member.name}
                </h4>
                <p className="text-sm text-slate-500">
                  {member.position} - {member.role}
                </p>
                <p className="mt-2 text-sm text-slate-600">{member.notes}</p>
              </div>
              <StatusBadge value={member.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {member.schedule.map((slot) => (
                <span key={slot} className="rounded-md bg-slate-100 px-2 py-1">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
