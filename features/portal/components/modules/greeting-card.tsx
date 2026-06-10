"use client"

import { Activity, ShieldCheck, Users } from "lucide-react"
import { useMemo } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function GreetingCard({
  name,
  roleLabel,
  subtitle,
  className,
  stats,
}: {
  name: string
  roleLabel: string
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
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  }, [])

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-lg border-0 bg-[linear-gradient(120deg,#2454bd_0%,#1d63d8_58%,#38a3ee_100%)] text-white shadow-sm",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-black/5" />

      <CardContent className="relative grid min-h-[250px] gap-8 px-7 py-8 sm:px-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            {roleLabel}
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {firstName}
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-white/80">
            {subtitle}
          </p>
        </div>

        {stats ? (
          <div className="grid gap-5 text-sm text-white/80">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-3">
                <Users className="size-5 text-white/80" />
                Total Users
              </span>
              <strong className="text-lg font-semibold text-white">{stats.totalUsers}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-3">
                <Activity className="size-5 text-white/80" />
                Active Sessions
              </span>
              <strong className="text-lg font-semibold text-white">{stats.activeSessions}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-3">
                <ShieldCheck className="size-5 text-white/80" />
                System Status
              </span>
              <strong className="text-sm font-semibold text-emerald-300">{stats.systemStatus}</strong>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-white/80 lg:text-right">
            {timeGreeting}, {firstName}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
