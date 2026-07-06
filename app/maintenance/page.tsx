"use client"

import { useEffect, useState } from "react"
import { Settings } from "lucide-react"

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import PlugIllustration from "@/features/portal/components/maintenance/plug-illustration"

type MaintenanceData = {
  maintenanceMode: boolean
  logoText: string
  maintenanceHeading: string
  maintenanceSubheading: string
  maintenanceDescription: string
  maintenanceCardTitle: string
  maintenanceCardBody: string
  estimatedCompletionTime: string
  contactEmail: string
}

const DEFAULTS: MaintenanceData = {
  maintenanceMode: true,
  logoText: "ComScite",
  maintenanceHeading: "The site is currently\ndown for maintenance",
  maintenanceSubheading: "",
  maintenanceDescription: "We apologize for any inconvenience caused.\nWe've almost done.",
  maintenanceCardTitle: "Thank you for your patience!",
  maintenanceCardBody:
    "Our team is working hard to improve your experience.\nWe appreciate your understanding.",
  estimatedCompletionTime: "",
  contactEmail: "",
}

export default function MaintenancePage() {
  const [data, setData] = useState<MaintenanceData>(DEFAULTS)

  useEffect(() => {
    fetch("/api/maintenance/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setData({ ...DEFAULTS, ...json })
      })
      .catch(() => {})
  }, [])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6">
      {/* Subtle blue radial gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 size-[500px] rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-blue-50 blur-3xl" />
      </div>

      {/* Dotted pattern top-left */}
      <div
        className="pointer-events-none absolute left-10 top-10 -z-10 size-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, #0F5DFF 1.5px, transparent 1.5px)",
          backgroundSize: "12px 12px",
          opacity: 0.12,
        }}
        aria-hidden="true"
      />

      {/* Dotted pattern bottom-right */}
      <div
        className="pointer-events-none absolute bottom-10 right-10 -z-10 size-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, #0F5DFF 1.5px, transparent 1.5px)",
          backgroundSize: "12px 12px",
          opacity: 0.12,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        {/* Logo */}
        <h1
          className="bg-gradient-to-r from-[#0F5DFF] to-[#1E88FF] bg-clip-text text-5xl font-extrabold leading-none text-transparent sm:text-6xl"
        >
          {data.logoText}
        </h1>

        {/* Heading */}
        <h2 className="max-w-3xl text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-[#13254A] sm:text-[3.5rem]">
          {data.maintenanceHeading}
        </h2>

        {/* Divider */}
        <div className="h-[3px] w-[70px] shrink-0 rounded-full bg-[#2F80FF]" />

        {/* Description */}
        <p className="max-w-2xl whitespace-pre-line text-xl leading-relaxed text-[#55627A]">
          {data.maintenanceDescription}
        </p>

        {/* Plug Illustration */}
        <PlugIllustration />

        {/* Info Card */}
        <Card className="flex w-full max-w-[820px] flex-col items-start gap-6 rounded-3xl border border-border/50 bg-white p-8 shadow-sm sm:flex-row sm:items-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Settings className="size-7 text-[#0F5DFF]" />
          </div>
          <div className="space-y-1.5 text-left">
            <CardTitle className="text-2xl font-bold text-[#0F5DFF] sm:text-[1.75rem]">
              {data.maintenanceCardTitle}
            </CardTitle>
            <CardDescription className="whitespace-pre-line text-lg text-[#5F6B81]">
              {data.maintenanceCardBody}
            </CardDescription>
          </div>
        </Card>
      </div>
    </main>
  )
}
