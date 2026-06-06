"use client"

import { Check, Download, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function SeminarsModule({ model }: PortalModuleProps) {
  const {
    downloadAttendees,
    eventDraft,
    handleCreateEvent,
    handleEnlist,
    profile,
    role,
    seminars,
    setEventDraft,
  } = model

  return (
    <div className="space-y-5">
      {role === "admin" ? (
        <Panel title="Event Creator" eyebrow="Seminars and webinars">
          <form onSubmit={handleCreateEvent} className="grid gap-3 lg:grid-cols-5">
            <Input
              value={eventDraft.title}
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Event title"
              className="h-9 rounded-lg lg:col-span-2"
            />
            <Input
              value={eventDraft.speaker}
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  speaker: event.target.value,
                }))
              }
              placeholder="Speaker"
              className="h-9 rounded-lg"
            />
            <Input
              value={eventDraft.date}
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              placeholder="Date"
              className="h-9 rounded-lg"
            />
            <Input
              value={eventDraft.capacity}
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  capacity: event.target.value,
                }))
              }
              type="number"
              placeholder="Slots"
              className="h-9 rounded-lg"
            />
            <Input
              value={eventDraft.location}
              onChange={(event) =>
                setEventDraft((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              placeholder="Location"
              className="h-9 rounded-lg lg:col-span-4"
            />
            <Button type="submit">
              <Plus className="size-4" />
              Create
            </Button>
          </form>
        </Panel>
      ) : null}
      <Panel
        title={
          role === "faculty"
            ? "My Events and Attendee Tracker"
            : "Seminars and Webinars"
        }
        eyebrow="Participation and enlisting"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {seminars.map((event) => {
            const enlisted = event.enlistedStudentIds.includes(
              profile.id
            )
            const remaining = event.capacity - event.enlistedStudentIds.length
            const percent = Math.min(
              100,
              Math.round(
                (event.enlistedStudentIds.length / event.capacity) * 100
              )
            )
            const facultyOwnsEvent =
              role === "faculty" && event.host === profile.name
            return (
              <article
                key={event.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {event.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {event.date} - {event.location}
                    </p>
                  </div>
                  <StatusBadge value={event.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {event.description}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{remaining} seats remaining</span>
                    <span>
                      {event.enlistedStudentIds.length}/{event.capacity}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {role === "student" ? (
                    <Button
                      size="sm"
                      variant={enlisted ? "outline" : "default"}
                      onClick={() => handleEnlist(event.id)}
                      disabled={!enlisted && remaining <= 0}
                    >
                      {enlisted ? (
                        <>
                          <Check className="size-4" />
                          Enlisted
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" />
                          Enlist Now
                        </>
                      )}
                    </Button>
                  ) : null}
                  {role === "admin" || facultyOwnsEvent ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAttendees(event)}
                    >
                      <Download className="size-4" />
                      Export Attendees
                    </Button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
