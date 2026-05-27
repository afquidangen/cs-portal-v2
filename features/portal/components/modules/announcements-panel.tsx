"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AnnouncementsPanel({ model }: PortalModuleProps) {
  const { announcements, role, selectModule } = model

  return (
    <Panel
      title="Announcements and CS Updates"
      eyebrow="Department notices"
      actions={
        role === "admin" ? (
          <Button size="sm" onClick={() => selectModule("announcements")}>
            <Plus className="size-4" />
            Add Notice
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        {announcements.map((announcement) => (
          <article
            key={announcement.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="font-semibold text-slate-950">
                  {announcement.title}
                </h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {announcement.content}
                </p>
              </div>
              <StatusBadge value={announcement.priority} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {announcement.date} - {announcement.audience}
            </p>
          </article>
        ))}
      </div>
    </Panel>
  )
}
