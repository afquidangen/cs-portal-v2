"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Save, ShieldCheck, ShieldOff } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type MaintenanceData = {
  maintenanceMode: boolean
  maintenanceTitle: string
  maintenanceDescription: string
  maintenanceNoticeTitle: string
  maintenanceNoticeMessage: string
}

const DEFAULTS: MaintenanceData = {
  maintenanceMode: false,
  maintenanceTitle: "We're currently performing scheduled maintenance.",
  maintenanceDescription:
    "We're currently performing scheduled maintenance to improve your experience. Please check back again later.",
  maintenanceNoticeTitle: "Thank you for your patience!",
  maintenanceNoticeMessage:
    "Our team is working to restore the service as quickly as possible. We appreciate your understanding.",
}

export default function MaintenanceModule() {
  const [data, setData] = useState<MaintenanceData>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingMode, setPendingMode] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/maintenance/status")
      const json = await res.json()
      setData({ ...DEFAULTS, ...json })
    } catch {
      toast.error("Failed to fetch maintenance settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  function handleToggle() {
    const newValue = !data.maintenanceMode
    if (newValue) {
      setPendingMode(true)
      setShowConfirm(true)
    } else {
      save({ ...data, maintenanceMode: false })
    }
  }

  async function save(payload: MaintenanceData) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Failed to save")
        return
      }

      const json = await res.json()
      setData({ ...DEFAULTS, ...json })
      toast.success(
        payload.maintenanceMode
          ? "Maintenance mode enabled"
          : "Maintenance mode disabled"
      )
    } catch {
      toast.error("Failed to save maintenance settings")
    } finally {
      setSaving(false)
      setShowConfirm(false)
    }
  }

  function handleSave() {
    save(data)
  }

  const hasChanges =
    data.maintenanceMode !== DEFAULTS.maintenanceMode ||
    (data.maintenanceMode &&
      (data.maintenanceTitle !== DEFAULTS.maintenanceTitle ||
        data.maintenanceDescription !== DEFAULTS.maintenanceDescription ||
        data.maintenanceNoticeTitle !== DEFAULTS.maintenanceNoticeTitle ||
        data.maintenanceNoticeMessage !== DEFAULTS.maintenanceNoticeMessage))

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Mode</h1>
          <p className="text-muted-foreground text-sm">
            Control system-wide access and customize the maintenance page content.
          </p>
        </div>
        <Badge
          variant={data.maintenanceMode ? "destructive" : "secondary"}
          className="gap-1.5 text-sm"
        >
          {data.maintenanceMode ? (
            <><ShieldOff className="size-3.5" /> Active</>
          ) : (
            <><ShieldCheck className="size-3.5" /> Inactive</>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Access</CardTitle>
          <CardDescription>Toggle maintenance mode on or off</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={data.maintenanceMode ? "destructive" : "default"}
              onClick={handleToggle}
              disabled={saving || loading}
              className="gap-2"
            >
              {data.maintenanceMode ? (
                <><ShieldOff className="size-4" /> Disable Maintenance</>
              ) : (
                <><ShieldCheck className="size-4" /> Enable Maintenance</>
              )}
            </Button>
            {saving && (
              <span className="text-muted-foreground text-sm">Saving...</span>
            )}
          </div>

          {data.maintenanceMode && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Maintenance mode is currently <strong>active</strong>. All
                non-admin users are blocked from accessing the system. Only you
                (admin) can access the portal.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>
            Customize the text displayed on the maintenance page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="maintenanceTitle">Maintenance Title</Label>
            <Input
              id="maintenanceTitle"
              value={data.maintenanceTitle}
              onChange={(e) =>
                setData({ ...data, maintenanceTitle: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceDescription">
              Maintenance Description
            </Label>
            <textarea
              id="maintenanceDescription"
              value={data.maintenanceDescription}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>
              ) => setData({ ...data, maintenanceDescription: e.target.value })}
              rows={3}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maintenanceNoticeTitle">Notice Title</Label>
            <Input
              id="maintenanceNoticeTitle"
              value={data.maintenanceNoticeTitle}
              onChange={(e) =>
                setData({ ...data, maintenanceNoticeTitle: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceNoticeMessage">Notice Message</Label>
            <textarea
              id="maintenanceNoticeMessage"
              value={data.maintenanceNoticeMessage}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>
              ) => setData({ ...data, maintenanceNoticeMessage: e.target.value })}
              rows={3}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2"
          >
            <Save className="size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Enable Maintenance Mode"
        description="This will block all students, faculty, and CSSO officers from accessing the system. Only administrators will be able to log in. Are you sure?"
        confirmLabel="Enable"
        onConfirm={() => save({ ...data, maintenanceMode: true })}
      />
    </div>
  )
}
