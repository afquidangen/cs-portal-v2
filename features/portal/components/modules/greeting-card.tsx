"use client"

import { Binary, Braces, Cpu, Orbit } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function GreetingCard({
  name,
  roleLabel,
  subtitle,
  className,
}: {
  name: string
  roleLabel: string
  subtitle: string
  className?: string
}) {
  const firstName = name.split(" ")[0] || name
  const hour = new Date().getHours()

  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[34px] border border-[#1b4975] bg-[linear-gradient(135deg,#103a69_0%,#0c2f57_52%,#082645_100%)] text-white shadow-[0_20px_60px_rgba(9,44,86,0.18)] dark:border-[rgba(169,203,224,0.18)] dark:bg-[linear-gradient(135deg,#0b2342_0%,#081a31_52%,#061220_100%)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.32)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(169,203,224,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(169,203,224,0.07)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(169,203,224,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(102,140,169,0.16),transparent_30%)]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12" />

      <div className="pointer-events-none absolute left-[10%] top-[18%] text-[#d9edf8]/14">
        <Binary className="size-8" />
      </div>
      <div className="pointer-events-none absolute right-[10%] top-[18%] text-[#d9edf8]/14">
        <Braces className="size-8" />
      </div>
      <div className="pointer-events-none absolute bottom-[18%] left-[13%] text-[#d9edf8]/12">
        <Cpu className="size-8" />
      </div>
      <div className="pointer-events-none absolute bottom-[18%] right-[13%] text-[#d9edf8]/12">
        <Orbit className="size-8" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d7edf7]/75 shadow-[0_0_34px_rgba(169,203,224,0.45)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(169,203,224,0.12)] blur-3xl" />

      <CardContent className="relative flex min-h-[220px] flex-col items-center justify-center px-6 py-8 text-center sm:px-8 lg:px-10">
        <div className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-700">
          <p className="text-sm font-medium text-[#d7e9f4] sm:text-base">
            {timeGreeting},
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {firstName}
          </h1>

          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#cde6f4] sm:text-sm">
            {roleLabel}
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#d7e9f4] sm:text-base">
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}