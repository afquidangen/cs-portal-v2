"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Megaphone, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { Announcement } from "../../data/portal-data"

function AnnouncementModal({
  announcement,
  open,
  onClose,
}: {
  announcement: Announcement
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>
        {announcement.imageUrl ? (
          <div className="aspect-video w-full bg-muted">
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-abyss to-lapis dark:from-primary dark:to-glacier">
            <Megaphone className="size-12 text-white/60" />
          </div>
        )}
        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">{announcement.title}</h2>
            <StatusBadge value={announcement.priority} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{announcement.content}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{announcement.date}</span>
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            <span className="capitalize">{announcement.audience}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Slideshow({ children }: { children: React.ReactNode[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = children.length
  const prev = useCallback(() => setCurrent((c) => (c === 0 ? total - 1 : c - 1)), [total])
  const next = useCallback(() => setCurrent((c) => (c === total - 1 ? 0 : c + 1)), [total])

  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setInterval(next, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [total, next])

  if (total === 0) return null

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {children.map((child, i) => (
            <div key={i} className="min-w-0 shrink-0 basis-full">
              {child}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={prev}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Previous"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "rounded-full transition-all",
                i === current
                  ? "size-2 bg-abyss dark:bg-primary"
                  : "size-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Next"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function AnnouncementsPanel({ model }: PortalModuleProps) {
  const {
    announcements,
    role,
    selectModule,
    deleteAnnouncement,
    setEditingAnnouncement,
    setShowCreateAnnouncement,
    setAnnouncementDraft,
  } = model

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selected, setSelected] = useState<Announcement | null>(null)

  const cardContent = (announcement: Announcement) => (
    <>
      {announcement.imageUrl ? (
        <div className="aspect-[16/9] w-full bg-muted">
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted">
          <Megaphone className="size-6 text-muted-foreground" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            {announcement.title}
          </h4>
          <StatusBadge value={announcement.priority} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {announcement.content}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {announcement.date} - {announcement.audience}
          </p>
          {role === "admin" ? (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingAnnouncement(announcement)
                  setAnnouncementDraft({
                    title: announcement.title,
                    content: announcement.content,
                    audience: announcement.audience,
                    priority: announcement.priority,
                    imageUrl: announcement.imageUrl ?? "",
                  })
                  setShowCreateAnnouncement(true)
                  selectModule("announcements")
                }}
              >
                Edit
              </Button>
              {confirmDelete === announcement.id ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => {
                    deleteAnnouncement(announcement.id)
                    setConfirmDelete(null)
                  }}>
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => setConfirmDelete(announcement.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )

  const slideshowCards = announcements.map((announcement) => (
    <div key={announcement.id} className="mx-auto max-w-md">
      <button
        type="button"
        onClick={() => setSelected(announcement)}
        className="group w-full overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-md"
      >
        {cardContent(announcement)}
      </button>
    </div>
  ))

  const adminCards = announcements.map((announcement) => (
    <div key={announcement.id} className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {cardContent(announcement)}
      </div>
    </div>
  ))

  return (
    <>
      <AnnouncementModal
        announcement={selected!}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
      <Panel
        title="Announcements and CS Updates"
        eyebrow="Department notices"
        actions={
          role === "admin" ? (
            <Button size="sm" onClick={() => selectModule("announcements")}>
              <Plus className="size-4" />
              Announce
            </Button>
          ) : null
        }
      >
      {announcements.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No announcements yet.
        </div>
      ) : role === "admin" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminCards}
        </div>
      ) : (
        <Slideshow>{slideshowCards}</Slideshow>
      )}
      </Panel>
    </>
  )
}
