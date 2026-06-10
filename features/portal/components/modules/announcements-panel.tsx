"use client"

import { useState } from "react"
import { Edit, Plus, Trash2, X } from "lucide-react"

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
import { Panel, Select, StatusBadge, Textarea } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AnnouncementsPanel({ model }: PortalModuleProps) {
  const {
    announcements,
    handleDeleteAnnouncement,
    handleUpdateAnnouncement,
    role,
    setShowAnnouncementForm,
  } = model

  const filtered = role === "admin"
    ? announcements
    : announcements.filter((a) => {
        if (role === "student") return a.audience === "All Users" || a.audience === "Students"
        return a.audience === "All Users" || a.audience === "Faculty"
      })

  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null)
  const [deletingAnnId, setDeletingAnnId] = useState<string | null>(null)

  return (
    <>
      <Panel
        title="Announcements and CS Updates"
        eyebrow="Department notices"
        actions={
          role === "admin" ? (
            <Button
              size="sm"
              onClick={() => setShowAnnouncementForm((current) => !current)}
              className="rounded-lg"
            >
              <Plus className="size-4" />
              ADD ANNOUNCEMENT
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No announcements yet.
            </p>
          ) : (
            filtered.map((announcement, index) => (
              <div
                key={announcement.id}
                className={
                  index === 0
                    ? "edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] p-5 shadow-sm transition-colors"
                    : "rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/25 hover:shadow-md"
                }
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-bold tracking-tight text-foreground">
                      {announcement.title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-foreground/80">
                      {announcement.content}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge value={announcement.priority} />
                    {role === "admin" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setEditingAnn(announcement)}
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-red-500 hover:text-red-600"
                          onClick={() => setDeletingAnnId(announcement.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-xs text-foreground/70">
                  {announcement.date} &middot; {announcement.audience}
                </p>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingAnn} onOpenChange={(o) => { if (!o) setEditingAnn(null) }}>
        <DialogContent className="max-w-xl">
          {editingAnn ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!editingAnn.title.trim() || !editingAnn.content.trim()) return
                handleUpdateAnnouncement(editingAnn)
                setEditingAnn(null)
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground">Edit Announcement</DialogTitle>
                <DialogDescription className="pt-1 text-muted-foreground">
                  Update announcement details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  value={editingAnn.title}
                  onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                  placeholder="Announcement title"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Audience</label>
                    <Select
                      value={editingAnn.audience}
                      onChange={(value) => setEditingAnn({ ...editingAnn, audience: value })}
                      options={["All Users", "Students", "Faculty"]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Priority</label>
                    <Select
                      value={editingAnn.priority}
                      onChange={(value) => setEditingAnn({ ...editingAnn, priority: value as Announcement["priority"] })}
                      options={["High", "Medium", "Low"]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Content</label>
                  <Textarea
                    value={editingAnn.content}
                    onChange={(value) => setEditingAnn({ ...editingAnn, content: value })}
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
                  <Edit className="mr-1.5 size-4" /> Save Changes
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={!!deletingAnnId} onOpenChange={(o) => { if (!o) setDeletingAnnId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Announcement</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deletingAnnId) handleDeleteAnnouncement(deletingAnnId)
                setDeletingAnnId(null)
              }}
            >
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
