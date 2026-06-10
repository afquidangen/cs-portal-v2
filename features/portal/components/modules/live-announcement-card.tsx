"use client"

import { Bell, CalendarDays, ChevronLeft, ChevronRight, Megaphone } from "lucide-react"

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
        "relative overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        className
      )}
    >
      <CardContent className="relative p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Bell className="size-5" strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-base font-semibold tracking-tight text-foreground">
                Live Announcements
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-rotate every 5 seconds
              </p>
            </div>
          </div>

          <button type="button" className="text-xs font-medium text-foreground">
            View All
          </button>
        </div>

        <div
          key={index}
          className="grid min-h-[184px] grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-3 px-5 py-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        >
          <button type="button" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <ChevronLeft className="size-4" />
          </button>

          <div className="grid gap-5 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center">
            <div className="flex size-24 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <Megaphone className="size-11" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <Badge variant="outline" className="mb-3 rounded border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
                {announcement.audience}
              </Badge>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {announcement.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {announcement.content}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-4" />
                {announcement.date}
              </p>
            </div>
          </div>

          <button type="button" className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={cn(
                "h-1.5 rounded-full bg-slate-200",
                dot === index % 4 ? "w-5 bg-blue-600" : "w-1.5"
              )}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
