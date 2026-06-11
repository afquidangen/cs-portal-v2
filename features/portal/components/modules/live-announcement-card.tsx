"use client"

import { BellRing, CalendarDays, Megaphone, Radio } from "lucide-react"

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
        <div className="edu-bg-soft-glacier flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-1.5 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="edu-lapis edu-ring-lapis flex size-6 items-center justify-center rounded-lg border shadow-sm">
              <BellRing className="size-3" strokeWidth={2.2} />
            </div>

            <div>
              <p className="flex items-center gap-1 text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                Live Announcements
                <Radio className="size-2.5 text-primary sm:size-3" />
              </p>
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                Stay synced with our latest CS updates.
              </p>
            </div>
          </div>

          <button type="button" className="rounded px-1.5 py-0.5 text-[11px] font-medium text-primary transition hover:bg-primary/10">
            View All
          </button>
        </div>

        <div
          key={index}
          className="px-4 pb-8 pt-2.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 sm:px-5"
        >
          <div className="grid gap-2 sm:grid-cols-[40px_minmax(0,1fr)] sm:items-start">
            <div className="edu-bg-soft-lapis edu-ring-lapis hidden size-9 items-center justify-center rounded-lg border text-primary shadow-inner sm:flex">
              <Megaphone className="size-4" strokeWidth={2.1} />
            </div>
            <div className="min-w-0">
              <Badge variant="outline" className="mb-1.5 rounded border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {announcement.audience}
              </Badge>
              <h3 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                {announcement.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-foreground/78">
                {announcement.content}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CalendarDays className="size-3" />
                {announcement.date}
              </p>
            </div>
          </div>
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
