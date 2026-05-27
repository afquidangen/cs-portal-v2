"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { Announcement } from "../../data/portal-data"
import { Panel, Select, Textarea } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import type { PortalModuleProps } from "./types"

export function AnnouncementManagerModule({ model }: PortalModuleProps) {
  const {
    announcementDraft,
    handleCreateAnnouncement,
    role,
    setAnnouncementDraft,
  } = model

  return (
    <div className="space-y-5">
      {role === "admin" ? (
        <Panel title="Create Announcement" eyebrow="CS updates">
          <form
            onSubmit={handleCreateAnnouncement}
            className="grid gap-3 lg:grid-cols-4"
          >
            <Input
              value={announcementDraft.title}
              onChange={(event) =>
                setAnnouncementDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Title"
              className="h-9 rounded-lg lg:col-span-2"
            />
            <Select
              value={announcementDraft.audience}
              onChange={(value) =>
                setAnnouncementDraft((current) => ({
                  ...current,
                  audience: value,
                }))
              }
              options={["All Users", "Students", "Faculty", "BSCS 3rd Year"]}
            />
            <Select
              value={announcementDraft.priority}
              onChange={(value) =>
                setAnnouncementDraft((current) => ({
                  ...current,
                  priority: value as Announcement["priority"],
                }))
              }
              options={["High", "Medium", "Low"]}
            />
            <div className="lg:col-span-4">
              <Textarea
                value={announcementDraft.content}
                onChange={(value) =>
                  setAnnouncementDraft((current) => ({
                    ...current,
                    content: value,
                  }))
                }
                placeholder="Announcement details"
              />
            </div>
            <Button type="submit">
              <Plus className="size-4" />
              Publish
            </Button>
          </form>
        </Panel>
      ) : null}
      <AnnouncementsPanel model={model} />
    </div>
  )
}
