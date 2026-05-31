"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { Announcement } from "../../data/portal-data"
import { Panel, Select, Textarea } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import type { PortalModuleProps } from "./types"

export function AnnouncementManagerModule({ model }: PortalModuleProps) {
  const {
    announcementDraft,
    editingAnnouncement,
    handleCreateAnnouncement,
    role,
    setAnnouncementDraft,
    setEditingAnnouncement,
    setShowCreateAnnouncement,
    showCreateAnnouncement,
  } = model

  return (
    <div className="space-y-5">
      {role === "admin" ? (
        <>
          <div className="flex justify-end">
            <Button onClick={() => {
              setShowCreateAnnouncement(!showCreateAnnouncement)
              if (!showCreateAnnouncement) {
                setEditingAnnouncement(null)
                setAnnouncementDraft({
                  title: "",
                  content: "",
                  audience: "All Users",
                  priority: "Medium",
                  imageUrl: "",
                })
              }
            }}>
              <Plus className="size-4" />
              {showCreateAnnouncement ? "Cancel" : "New Announcement"}
            </Button>
          </div>
          {showCreateAnnouncement ? (
            <Panel title={editingAnnouncement ? "Edit Announcement" : "Create Announcement"} eyebrow="CS updates">
              <form
                onSubmit={handleCreateAnnouncement}
                className="space-y-4"
              >
                <div className="grid gap-3 lg:grid-cols-3">
                  <Input
                    value={announcementDraft.title}
                    onChange={(event) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Announcement Title"
                    className="h-9 rounded-lg lg:col-span-2"
                  />
                  <Select
                    value={announcementDraft.audience}
                    onChange={(value) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        audience: value as Announcement["audience"],
                      }))
                    }
                    options={["All Users", "Students", "Faculty"]}
                  />
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="h-9 rounded-lg"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            setAnnouncementDraft((current) => ({
                              ...current,
                              imageUrl: e.target?.result as string,
                            }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                    {announcementDraft.imageUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setAnnouncementDraft((current) => ({
                            ...current,
                            imageUrl: "",
                          }))
                        }
                        className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <Textarea
                  value={announcementDraft.content}
                  onChange={(value) =>
                    setAnnouncementDraft((current) => ({
                      ...current,
                      content: value,
                    }))
                  }
                  placeholder="Announcement details"
                  rows={5}
                />
                <Button type="submit">
                  <Plus className="size-4" />
                  {editingAnnouncement ? "Save Changes" : "Publish Announcement"}
                </Button>
              </form>
            </Panel>
          ) : null}
        </>
      ) : null}
      <AnnouncementsPanel model={model} />
    </div>
  )
}
