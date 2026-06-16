"use client"

import { CheckCircle2, Cloud, CloudOff, Loader2 } from "lucide-react"
import type { SaveStatus } from "../../lib/auto-save"

export function SaveStatusIndicator({
  status,
  lastSaved,
}: {
  status: SaveStatus
  lastSaved: string | null
}) {
  if (status === "idle") return null

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs shadow-sm">
      {status === "saving" ? (
        <>
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      ) : status === "saved" ? (
        <>
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">
            Saved{lastSaved ? ` at ${lastSaved}` : ""}
          </span>
        </>
      ) : (
        <>
          <CloudOff className="size-3.5 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Failed to Save</span>
        </>
      )}
    </div>
  )
}
