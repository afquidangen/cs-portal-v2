"use client"

import { useEffect, useState } from "react"
import { Wrench } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

type MaintenanceData = {
  maintenanceMode: boolean
  maintenanceTitle: string
  maintenanceDescription: string
  maintenanceNoticeTitle: string
  maintenanceNoticeMessage: string
}

export default function MaintenancePage() {
  const [data, setData] = useState<MaintenanceData>({
    maintenanceMode: true,
    maintenanceTitle: "We're currently performing scheduled maintenance.",
    maintenanceDescription:
      "We're currently performing scheduled maintenance to improve your experience. Please check back again later.",
    maintenanceNoticeTitle: "Thank you for your patience!",
    maintenanceNoticeMessage:
      "Our team is working to restore the service as quickly as possible. We appreciate your understanding.",
  })

  useEffect(() => {
    fetch("/api/maintenance/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setData(json)
      })
      .catch(() => {})
  }, [])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-blue-100/60 blur-3xl dark:bg-blue-950/30" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-blue-50/60 blur-3xl dark:bg-blue-950/20" />
        <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/40 blur-2xl dark:bg-blue-950/20" />
      </div>

      <div className="flex w-full max-w-lg flex-col items-center gap-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          ComScite
        </h1>

        <Card className="w-full">
          <CardHeader className="items-center pb-2 text-center">
            <div className="mb-2 flex size-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
              <Wrench className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-wide">
              UNDER MAINTENANCE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-muted-foreground leading-relaxed">
              {data.maintenanceDescription}
            </p>

            <Alert variant="info">
              <AlertTitle className="text-base font-semibold">
                {data.maintenanceNoticeTitle}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {data.maintenanceNoticeMessage}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ComScite. All rights reserved.
        </p>
      </div>
    </main>
  )
}
