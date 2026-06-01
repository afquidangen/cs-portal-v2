"use client"

import { Bell, Radio } from "lucide-react"

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
        "relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.06),transparent_28%),radial-gradient(circle_at_bottom_left,hsl(var(--foreground)/0.03),transparent_28%)]" />

      <CardContent className="relative p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="edu-glacier edu-ring-glacier flex size-11 items-center justify-center rounded-2xl border shadow-sm">
              <Bell className="size-5" strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Live announcements
              </p>
              <p className="text-sm font-medium text-foreground">
                {announcement.date}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="rounded-full border-border bg-background text-muted-foreground"
          >
            <Radio className="mr-1 size-3.5" />
            {announcement.audience}
          </Badge>
        </div>

        <div
          key={index}
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
        >
          <h3 className="text-lg font-semibold tracking-tight text-[#092C56] dark:text-white sm:text-xl">
            {announcement.title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {announcement.content}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}