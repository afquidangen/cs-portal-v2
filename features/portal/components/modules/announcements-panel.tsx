"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AnnouncementsPanel({ model }: PortalModuleProps) {
  const { announcements, role, setShowAnnouncementForm } = model

  return (
    <Panel
      title="Announcements and CS Updates"
      eyebrow="Department notices"
      actions={
        role === "admin" ? (
          <Button
            size="sm"
            onClick={() => setShowAnnouncementForm((current) => !current)}
            className="rounded-2xl"
          >
            <Plus className="size-4" />
            Add Notice
          </Button>
        ) : null
      }
    >
      <div className="space-y-3">
        {announcements.map((announcement, index) => (
          <article
            key={announcement.id}
            className={
              index === 0
                ? "rounded-2xl border border-border bg-muted p-5 shadow-sm transition-colors"
                : "rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
            }
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="font-semibold text-foreground">
                  {announcement.title}
                </h4>
                <p className="mt-1 text-sm leading-6 text-foreground/80">
                  {announcement.content}
                </p>
              </div>
              <StatusBadge value={announcement.priority} />
            </div>
            <p className="mt-3 text-xs text-foreground/70">
              {announcement.date} - {announcement.audience}
            </p>
          </article>
        ))}
      </div>
    </Panel>
  )
}