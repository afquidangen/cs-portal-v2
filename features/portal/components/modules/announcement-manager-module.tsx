"use client"

import { BellPlus, Megaphone, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
    role,
    facultyClassSections,
  } = model

  return (
    <div className="space-y-5">
      <AnnouncementsPanel model={model} />

      <Dialog open={showAnnouncementForm} onOpenChange={setShowAnnouncementForm}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleCreateAnnouncement}>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/35 text-foreground">
                  <BellPlus className="size-5" />
                </span>
                <div>
              <DialogTitle className="text-xl text-foreground">Create Announcement</DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">
                {role === "faculty" ? "Send an announcement to your class section" : "Publish a new announcement visible to all users"}
              </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <Megaphone className="size-4" />
                Announcement Details
              </div>
              <Input
                value={announcementDraft.title}
                onChange={(event) =>
                  setAnnouncementDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Announcement title"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Audience</label>
                  {role === "faculty" ? (
                    <div className="space-y-2">
                      {facultyClassSections.map((section) => (
                        <label
                          key={section}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition hover:bg-muted/30"
                        >
                          <Checkbox
                            checked={announcementDraft.classSections.includes(section)}
                            onCheckedChange={() =>
                              setAnnouncementDraft((current) => {
                                const next = current.classSections.includes(section)
                                  ? current.classSections.filter((s) => s !== section)
                                  : [...current.classSections, section]
                                return {
                                  ...current,
                                  audience: next.length > 0 ? next.join(", ") : "All Users",
                                  classSections: next,
                                }
                              })
                            }
                          />
                          <span className="font-medium">{section}</span>
                        </label>
                      ))}
                      {facultyClassSections.length === 0 && (
                        <p className="text-sm text-muted-foreground">No class sections assigned.</p>
                      )}
                    </div>
                  ) : (
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
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Priority</label>
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
                <label className="text-sm font-medium text-foreground">Content</label>
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
                <Button type="button" variant="ghost">
                  <X className="mr-1.5 size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                <Plus className="mr-1.5 size-4" /> Publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
