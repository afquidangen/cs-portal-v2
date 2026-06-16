"use client"

import { useEffect, useState } from "react"
import {
  FileSpreadsheet, Loader2, Trash2, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type GradingTemplate = {
  id: string
  name: string
  classId: string
  columns: Array<{ name: string; category: string; maxScore: number }>
}

export function TemplateSelector({
  classId, open, onClose, onApplied,
}: {
  classId: string
  open: boolean
  onClose: () => void
  onApplied: () => void
}) {
  const [templates, setTemplates] = useState<GradingTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !classId) return
    setLoading(true)
    fetch(`/api/portal/grades/templates?classId=${classId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setTemplates(json.data as GradingTemplate[])
      })
      .catch(() => toast.error("Failed to load templates."))
      .finally(() => setLoading(false))
  }, [open, classId])

  async function handleApply(templateId: string) {
    setApplying(templateId)
    try {
      const res = await fetch("/api/portal/grades/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, templateId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Failed to apply template."); return }
      toast.success(`${json.data?.columnsCreated ?? 0} column(s) created from template.`)
      onApplied()
    } catch {
      toast.error("Failed to apply template.")
    } finally {
      setApplying(null)
    }
  }

  async function handleDelete(templateId: string) {
    try {
      const res = await fetch(`/api/portal/grades/templates/${templateId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete template."); return }
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      toast.success("Template deleted.")
    } catch {
      toast.error("Failed to delete template.")
    }
  }

  if (!open) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="size-4" />
          Saved Grading Templates
        </p>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-2 text-xs">
          Close
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground text-center">
          No saved templates yet. Import a spreadsheet and save it as a template.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-auto">
          {templates.map((tpl) => (
            <div key={tpl.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">{tpl.columns.length} column(s)</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => handleApply(tpl.id)}
                  disabled={applying === tpl.id}
                  className="h-7 px-2 text-xs" title="Apply template">
                  {applying === tpl.id
                    ? <Loader2 className="size-3 animate-spin" />
                    : <Check className="size-3" />}
                  Apply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(tpl.id)}
                  className="h-7 px-2 text-xs text-red-500 hover:text-red-600" title="Delete template">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
