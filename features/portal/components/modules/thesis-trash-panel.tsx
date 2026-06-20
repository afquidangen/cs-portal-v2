"use client"

import { useState } from "react"
import { ArrowLeft, RotateCcw, Trash2, LibraryBig, Calendar, Users, User, Tag } from "lucide-react"

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

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

type ThesisTrashPanelProps = {
  model: PortalModuleProps["model"]
  onBack: () => void
}

export function ThesisTrashPanel({ model, onBack }: ThesisTrashPanelProps) {
  const {
    trashedTheses,
    handleRestoreThesis,
    handlePermanentDeleteThesis,
    role,
  } = model

  const [restoreId, setRestoreId] = useState<string | null>(null)
  const [permDeleteId, setPermDeleteId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (role !== "admin") return null

  return (
    <>
      <Panel
        title="Trash Bin"
        eyebrow="Deleted theses"
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
            Back to Thesis Library
          </Button>
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {trashedTheses.length} trashed
          </span>
        </div>

        {trashedTheses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Trash bin is empty</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {trashedTheses.map((thesis) => (
              <article
                key={thesis.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <LibraryBig className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge value={thesis.category} />
                    </div>
                    <h4 className="mt-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground">
                      {thesis.title}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-foreground/70">
                    <Users className="size-3.5 shrink-0" />
                    <span className="truncate">{thesis.authors}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <User className="size-3.5 shrink-0" />
                    <span className="truncate">{thesis.adviser}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <Calendar className="size-3.5 shrink-0" />
                    <span>{thesis.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <Tag className="size-3.5 shrink-0" />
                    <span className="truncate">{thesis.category}</span>
                  </div>
                </div>

                {thesis.deletedAt ? (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Deleted {new Date(thesis.deletedAt).toLocaleString()}
                    {thesis.deletedBy ? ` by ${thesis.deletedBy}` : ""}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                    onClick={() => setRestoreId(thesis.id)}
                    disabled={restoringId === thesis.id}
                    title="Restore thesis"
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-red-500/30 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => setPermDeleteId(thesis.id)}
                    disabled={deletingId === thesis.id}
                    title="Permanently delete"
                  >
                    <Trash2 className="size-3.5" />
                    Delete Forever
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {/* Restore Confirm */}
      <Dialog open={!!restoreId} onOpenChange={(o) => { if (!o) setRestoreId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Restore Thesis</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Are you sure you want to restore this thesis?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">No</Button>
            </DialogClose>
            <Button
              type="button"
              variant="default"
              disabled={!!restoringId}
              onClick={async () => {
                if (restoreId) {
                  setRestoringId(restoreId)
                  await handleRestoreThesis(restoreId)
                  setRestoringId(null)
                }
                setRestoreId(null)
              }}
            >
              <RotateCcw className="mr-1.5 size-4" /> Yes
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
              Are you sure you want to permanently delete this thesis? This action cannot be undone. The associated PDF will also be deleted from Cloudinary.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">No</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={!!deletingId}
              onClick={async () => {
                if (permDeleteId) {
                  setDeletingId(permDeleteId)
                  await handlePermanentDeleteThesis(permDeleteId)
                  setDeletingId(null)
                }
                setPermDeleteId(null)
              }}
            >
              <Trash2 className="mr-1.5 size-4" /> Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
