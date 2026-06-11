"use client"

import { Activity, CalendarDays, ShieldCheck, Users } from "lucide-react"
import { useMemo } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function GreetingCard({
  name,
  subtitle,
  className,
  stats,
}: {
  name: string
  subtitle: string
  className?: string
  stats?: {
    totalUsers: string
    activeSessions: string
    systemStatus: string
  }
}) {
  const firstName = name.split(" ")[0] || name
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }, [])
  const today = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    []
  )

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl border-0 bg-[linear-gradient(115deg,#1551b8_0%,#1f6fe5_58%,#35b8f4_100%)] text-white shadow-[0_18px_45px_rgb(31_111_229_/_0.24)] dark:bg-[linear-gradient(115deg,#071224_0%,#1551b8_58%,#1f6fe5_100%)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px] opacity-45" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(circle_at_top_right,rgba(151,224,255,0.58),transparent_46%)]" />

      <CardContent className="relative grid min-h-[265px] gap-6 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/86">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/16 bg-white/14 px-3 py-1 shadow-sm backdrop-blur">
              <CalendarDays className="size-3.5" />
              {today}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
            {timeGreeting}, {firstName}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/86">
            {subtitle}
          </p>
        </div>

        {stats ? (
          <div className="grid gap-3 text-sm text-white/88">
            <div className="flex flex-col gap-2 rounded-xl border border-white/16 bg-white/16 px-4 py-3 shadow-sm backdrop-blur min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <span className="inline-flex items-center gap-3">
                <Users className="size-5 text-white/82" />
                Total Users
              </span>
              <strong className="text-xl font-semibold text-white">{stats.totalUsers}</strong>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/16 bg-white/16 px-4 py-3 shadow-sm backdrop-blur min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <span className="inline-flex items-center gap-3">
                <Activity className="size-5 text-white/82" />
                Active Sessions
              </span>
              <strong className="text-xl font-semibold text-white">{stats.activeSessions}</strong>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/16 bg-white/16 px-4 py-3 shadow-sm backdrop-blur min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <span className="inline-flex items-center gap-3">
                <ShieldCheck className="size-5 text-white/82" />
                System Status
              </span>
              <strong className="text-sm font-semibold text-emerald-200">{stats.systemStatus}</strong>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
