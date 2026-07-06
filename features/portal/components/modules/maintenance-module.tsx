"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, ShieldOff, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"

type MaintenanceStatus = {
  maintenanceMode: boolean
  message: string
}

export default function MaintenanceModule() {
  const [status, setStatus] = useState<MaintenanceStatus>({
    maintenanceMode: false,
    message: "",
  })
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingValue, setPendingValue] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/maintenance/status")
      const data = await res.json()
      setStatus(data)
      setMessage(data.message)
    } catch {
      toast.error("Failed to fetch maintenance status")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  async function handleToggle() {
    const newValue = !status.maintenanceMode
    if (newValue) {
      setPendingValue(true)
      setShowConfirm(true)
    } else {
      await save(false)
    }
  }

  async function save(mode: boolean) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenanceMode: mode,
          message: message || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Failed to update")
        return
      }

      const data = await res.json()
      setStatus(data)
      toast.success(mode ? "Maintenance mode enabled" : "Maintenance mode disabled")
    } catch {
      toast.error("Failed to update maintenance setting")
    } finally {
      setSaving(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Mode</h1>
        <p className="text-muted-foreground text-sm">
          Control system-wide access. When enabled, only administrators can access the portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Access</CardTitle>
              <CardDescription>
                Toggle maintenance mode on or off
              </CardDescription>
            </div>
            <Badge
              variant={status.maintenanceMode ? "destructive" : "secondary"}
              className="gap-1.5 text-sm"
            >
              {status.maintenanceMode ? (
                <><ShieldOff className="size-3.5" /> Active</>
              ) : (
                <><ShieldCheck className="size-3.5" /> Inactive</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={status.maintenanceMode ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={saving || loading}
              className="gap-2"
            >
              {status.maintenanceMode ? (
                <><ShieldOff className="size-4" /> Disable Maintenance</>
              ) : (
                <><ShieldCheck className="size-4" /> Enable Maintenance</>
              )}
            </Button>
            {saving && <span className="text-muted-foreground text-sm">Saving...</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Maintenance Message</Label>
            <textarea
              id="message"
              placeholder="Optional message displayed to users..."
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              rows={3}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-muted-foreground text-xs">
              This message will be shown on the maintenance page to all blocked users.
            </p>
          </div>

          {status.maintenanceMode && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Maintenance mode is currently <strong>active</strong>. All non-admin users are
                blocked from accessing the system. Only you (admin) can access the portal.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Enable Maintenance Mode"
        description="This will block all students, faculty, and CSSO officers from accessing the system. Only administrators will be able to log in. Are you sure?"
        confirmLabel="Enable"
        onConfirm={() => save(true)}
      />
    </div>
  )
}
