"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { Announcement } from "../../data/portal-data"
import { Select, Textarea } from "../shared/dashboard-ui"
import { AnnouncementsPanel } from "./announcements-panel"
import type { PortalModuleProps } from "./types"

export function AnnouncementManagerModule({ model }: PortalModuleProps) {
  const {
    announcementDraft,
    handleCreateAnnouncement,
    setAnnouncementDraft,
    showAnnouncementForm,
    setShowAnnouncementForm,
  } = model

  return (
    <div className="space-y-5">
      <AnnouncementsPanel model={model} />

      <Dialog open={showAnnouncementForm} onOpenChange={setShowAnnouncementForm}>
        <DialogContent className="edu-sidebar-shell max-w-xl rounded-[28px] border border-sidebar-border text-sidebar-foreground shadow-2xl">
          <form onSubmit={handleCreateAnnouncement}>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Create Announcement</DialogTitle>
              <DialogDescription className="pt-1 text-white/70">
                Publish a new announcement visible to all users
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Input
                value={announcementDraft.title}
                onChange={(event) =>
                  setAnnouncementDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Announcement title"
                className="h-10 rounded-2xl border-sidebar-border bg-white/5 text-white placeholder:text-white/40"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Audience</label>
                  <Select
                    value={announcementDraft.audience}
                    onChange={(value) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        audience: value,
                      }))
                    }
                    options={["All Users", "Students", "Faculty"]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Priority</label>
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
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80">Content</label>
                <Textarea
                  value={announcementDraft.content}
                  onChange={(value) =>
                    setAnnouncementDraft((current) => ({
                      ...current,
                      content: value,
                    }))
                  }
                  placeholder="Announcement details"
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl border border-sidebar-border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <X className="mr-1.5 size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-sky-200">
                <Plus className="mr-1.5 size-4" /> Publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
