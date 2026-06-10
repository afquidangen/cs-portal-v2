"use client"

import { BellRing, CalendarDays, ChevronLeft, ChevronRight, Megaphone, Radio } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Announcement } from "../../data/portal-data"

export function LiveAnnouncementCard({
  announcement,
  index,
  className,
}: {
  announcement: Announcement
  index: number
  className?: string
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <CardContent className="relative p-0">
        <div className="edu-bg-soft-glacier flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="edu-lapis edu-ring-lapis flex size-8 items-center justify-center rounded-lg border shadow-sm">
              <BellRing className="size-4" strokeWidth={2.2} />
            </div>

            <div>
              <p className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                Live Announcements
                <Radio className="size-3.5 text-primary" />
              </p>
              <p className="text-xs text-muted-foreground">
                Stay synced with our latest CS updates.
              </p>
            </div>
          </div>

          <button type="button" className="rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10">
            View All
          </button>
        </div>

        <div
          key={index}
          className="grid min-h-[184px] grid-cols-[minmax(0,1fr)] items-center gap-3 px-4 py-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:grid-cols-[32px_minmax(0,1fr)_32px] sm:px-5"
        >
          <button type="button" className="hidden size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground sm:flex">
            <ChevronLeft className="size-4" />
          </button>

          <div className="grid gap-4 sm:grid-cols-[52px_minmax(0,1fr)] sm:items-center">
            <div className="edu-bg-soft-lapis edu-ring-lapis flex size-11 items-center justify-center rounded-lg border text-primary shadow-inner">
              <Megaphone className="size-5" strokeWidth={2.1} />
            </div>

            <div className="min-w-0">
              <Badge variant="outline" className="mb-3 rounded border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {announcement.audience}
              </Badge>
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {announcement.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/78">
                {announcement.content}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-4" />
                {announcement.date}
              </p>
            </div>
          </div>

          <button type="button" className="hidden size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground sm:flex">
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={cn(
                "h-1.5 rounded-full bg-muted",
                dot === index % 4 ? "w-5 bg-primary" : "w-1.5"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
