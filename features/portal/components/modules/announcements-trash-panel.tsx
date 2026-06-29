"use client"

import { useState } from "react"
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

type AnnouncementsTrashPanelProps = {
  model: PortalModuleProps["model"]
  onBack: () => void
}

export function AnnouncementsTrashPanel({ model, onBack }: AnnouncementsTrashPanelProps) {
  const {
    trashedAnnouncements,
    handleRestoreAnnouncement,
    handlePermanentDeleteAnnouncement,
    role,
  } = model

  const [restoreId, setRestoreId] = useState<string | null>(null)
  const [permDeleteId, setPermDeleteId] = useState<string | null>(null)

  if (role === "student") return null

  return (
    <>
      <Panel
        title="Trash Bin"
        eyebrow="Deleted announcements"
        className="[&>div:first-child]:hidden"
      >
        <div className="mb-4 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            onClick={onBack}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Announcements
          </Button>
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {trashedAnnouncements.length} trashed
          </span>
        </div>

        {trashedAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Trash bin is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Title</th>
                  <th className="hidden md:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Author</th>
                  <th className="hidden md:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Date Created</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Deleted By</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Deleted Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {trashedAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <p className="truncate font-medium text-foreground max-w-[200px]">{announcement.title}</p>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-foreground/80">{announcement.createdBy || "\u2014"}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-foreground/60">
                      {announcement.date ? new Date(announcement.date).toLocaleDateString() : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{announcement.deletedBy || "\u2014"}</td>
                    <td className="px-4 py-3 text-xs text-foreground/60">
                      {announcement.deletedAt ? new Date(announcement.deletedAt).toLocaleString() : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                          onClick={() => setRestoreId(announcement.id)}
                          title="Restore announcement"
                        >
                          <RotateCcw className="size-3.5" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-red-500/30 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          onClick={() => setPermDeleteId(announcement.id)}
                          title="Permanently delete"
                        >
                          <Trash2 className="size-3.5" />
                          Delete Forever
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Restore Confirm */}
      <Dialog open={!!restoreId} onOpenChange={(o) => { if (!o) setRestoreId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Restore Announcement</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              This announcement will be restored and visible to all authorized users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="default"
              onClick={() => {
                if (restoreId) handleRestoreAnnouncement(restoreId)
                setRestoreId(null)
              }}
            >
              <RotateCcw className="mr-1.5 size-4" /> Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirm */}
      <Dialog open={!!permDeleteId} onOpenChange={(o) => { if (!o) setPermDeleteId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Permanently Delete</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              This action cannot be undone. The announcement will be permanently removed from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (permDeleteId) handlePermanentDeleteAnnouncement(permDeleteId)
                setPermDeleteId(null)
              }}
            >
              <Trash2 className="mr-1.5 size-4" /> Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
