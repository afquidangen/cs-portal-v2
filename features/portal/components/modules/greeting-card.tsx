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
        "relative overflow-hidden rounded-xl border-0 bg-[linear-gradient(120deg,#18479f_0%,#1f6fe5_58%,#28a7f2_100%)] text-white shadow-[0_24px_70px_rgb(31_111_229_/_0.24)] dark:bg-[linear-gradient(120deg,#071224_0%,#18479f_58%,#1f6fe5_100%)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:36px_36px] opacity-35" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(234,245,255,0.48),transparent_48%)]" />

      <CardContent className="relative grid min-h-[250px] gap-8 px-7 py-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/12 px-2.5 py-1">
              <CalendarDays className="size-3.5" />
              {today}
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {timeGreeting}, {firstName}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/82">
            {subtitle}
          </p>
        </div>

        {stats ? (
          <div className="grid gap-3 text-sm text-white/82">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-white/14 bg-white/12 p-3 shadow-sm">
              <span className="inline-flex items-center gap-3">
                <Users className="size-5 text-white/80" />
                Total Users
              </span>
              <strong className="text-lg font-semibold text-white">{stats.totalUsers}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-white/14 bg-white/12 p-3 shadow-sm">
              <span className="inline-flex items-center gap-3">
                <Activity className="size-5 text-white/80" />
                Active Sessions
              </span>
              <strong className="text-lg font-semibold text-white">{stats.activeSessions}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-white/14 bg-white/12 p-3 shadow-sm">
              <span className="inline-flex items-center gap-3">
                <ShieldCheck className="size-5 text-white/80" />
                System Status
              </span>
              <strong className="text-sm font-semibold text-emerald-300">{stats.systemStatus}</strong>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
