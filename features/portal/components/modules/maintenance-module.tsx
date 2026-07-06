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
  maintenanceMode: false,
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

export default function MaintenanceModule() {
  const [data, setData] = useState<MaintenanceData>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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
    if (!data.maintenanceMode) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Maintenance Mode
          </h1>
          <p className="text-muted-foreground text-sm">
            Control system-wide access and customize the maintenance page
            content.
          </p>
        </div>
        <Badge
          variant={data.maintenanceMode ? "destructive" : "secondary"}
          className="gap-1.5 text-sm"
        >
          {data.maintenanceMode ? (
            <>
              <ShieldOff className="size-3.5" /> Active
            </>
          ) : (
            <>
              <ShieldCheck className="size-3.5" /> Inactive
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Access</CardTitle>
          <CardDescription>
            Toggle maintenance mode on or off
          </CardDescription>
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
                <>
                  <ShieldOff className="size-4" /> Disable Maintenance
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Enable Maintenance
                </>
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
            Customize every piece of text displayed on the maintenance page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label htmlFor="logoText">Logo Text</Label>
            <Input
              id="logoText"
              value={data.logoText}
              onChange={(e) =>
                setData({ ...data, logoText: e.target.value })
              }
            />
          </div>

          <Separator />

          {/* Heading */}
          <div className="space-y-2">
            <Label htmlFor="maintenanceHeading">Main Heading</Label>
            <textarea
              id="maintenanceHeading"
              value={data.maintenanceHeading}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>
              ) => setData({ ...data, maintenanceHeading: e.target.value })}
              rows={2}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceSubheading">
              Subheading <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="maintenanceSubheading"
              value={data.maintenanceSubheading}
              onChange={(e) =>
                setData({ ...data, maintenanceSubheading: e.target.value })
              }
            />
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="maintenanceDescription">Description</Label>
            <textarea
              id="maintenanceDescription"
              value={data.maintenanceDescription}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>
              ) => setData({ ...data, maintenanceDescription: e.target.value })}
              rows={2}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Separator />

          {/* Notice Card */}
          <div className="space-y-2">
            <Label htmlFor="maintenanceCardTitle">Card Title</Label>
            <Input
              id="maintenanceCardTitle"
              value={data.maintenanceCardTitle}
              onChange={(e) =>
                setData({ ...data, maintenanceCardTitle: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceCardBody">Card Message</Label>
            <textarea
              id="maintenanceCardBody"
              value={data.maintenanceCardBody}
              onChange={(
                e: React.ChangeEvent<HTMLTextAreaElement>
              ) => setData({ ...data, maintenanceCardBody: e.target.value })}
              rows={2}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Separator />

          {/* Optional fields */}
          <div className="space-y-2">
            <Label htmlFor="estimatedCompletionTime">
              Estimated Completion{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="estimatedCompletionTime"
              placeholder="e.g. 2:00 PM"
              value={data.estimatedCompletionTime}
              onChange={(e) =>
                setData({
                  ...data,
                  estimatedCompletionTime: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">
              Contact Email{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="support@comscite.edu"
              value={data.contactEmail}
              onChange={(e) =>
                setData({ ...data, contactEmail: e.target.value })
              }
            />
          </div>

          <Button
            onClick={() => save(data)}
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
