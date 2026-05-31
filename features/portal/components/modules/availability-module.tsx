"use client"

import { Panel, SearchBox, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AvailabilityModule({ model }: PortalModuleProps) {
  const { role, filteredFaculty, query, setQuery } = model

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
      <Panel
        title="Teacher Status Overview"
        eyebrow="View only - statuses are managed by faculty"
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
              className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-semibold text-abyss dark:text-quartz">
                    {member.firstName} {member.lastName}
                  </h4>
                  <p className="text-sm text-slate-blue dark:text-glacier">
                    {member.position}
                  </p>
                  <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                    {member.notes}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge value={member.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-blue dark:text-glacier">
                {member.schedule.map((slot) => (
                  <span key={slot} className="rounded-md bg-glacier/50 px-2 py-1 dark:bg-lapis/50">
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
        <select
          value={myFacultyStatus}
          onChange={(e) => setMyFacultyStatus(e.target.value as any)}
          className="h-9 w-full rounded-lg border border-glacier bg-white px-3 text-sm dark:border-lapis dark:bg-abyss/50 dark:text-quartz"
        >
          <option value="Available">Available</option>
          <option value="Consultation Only">Consultation Only</option>
          <option value="In Class">In Class</option>
          <option value="Out of Office">Out of Office</option>
        </select>
        <textarea
          value={myFacultyNotes}
          onChange={(e) => setMyFacultyNotes(e.target.value)}
          placeholder="Daily note"
          rows={3}
          className="w-full resize-none rounded-lg border border-glacier bg-white px-3 py-2 text-sm dark:border-lapis dark:bg-abyss/50 dark:text-quartz"
        />
        <button
          type="submit"
          className="rounded-lg bg-abyss px-4 py-2 text-sm font-medium text-quartz hover:bg-lapis dark:bg-quartz dark:text-abyss dark:hover:bg-glacier"
        >
          Save Status
        </button>
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
            className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="font-semibold text-abyss dark:text-quartz">
                  {member.firstName} {member.lastName}
                </h4>
                <p className="text-sm text-slate-blue dark:text-glacier">
                  {member.position} - {member.role}
                </p>
                <p className="mt-2 text-sm text-slate-blue dark:text-glacier">{member.notes}</p>
              </div>
              <StatusBadge value={member.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-blue dark:text-glacier">
              {member.schedule.map((slot) => (
                <span key={slot} className="rounded-md bg-glacier/50 px-2 py-1 dark:bg-lapis/50">
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
