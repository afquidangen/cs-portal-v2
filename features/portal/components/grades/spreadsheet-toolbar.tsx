"use client"

import { useRef, useState } from "react"
import {
  Columns, Columns3, Download, FileDown, Loader2, Maximize2, Minimize2,
  RotateCcw, Save, Trash2, Undo2, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export type ToolbarAction =
  | "addColumn"
  | "deleteColumn"
  | "renameColumn"
  | "export"
  | "import"
  | "undoImport"
  | "save"
  | "refresh"
  | "fullscreen"

export function SpreadsheetToolbar({
  onAction,
  columnCount,
  section,
  exporting,
  importing,
  isFullScreen,
  onImportFile,
  importUndoToken,
  subjectType,
}: {
  onAction: (action: ToolbarAction) => void
  columnCount: number
  saveStatus: string
  section: string | null
  exporting: boolean
  importing?: boolean
  isFullScreen: boolean
  onImportFile?: (file: File) => void
  importUndoToken?: string | null
  subjectType?: "Lecture" | "Lecture with Lab"
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  async function handleDownloadTemplate() {
    if (!subjectType) return
    setDownloadingTemplate(true)
    try {
      const res = await fetch(`/api/portal/import-template?subjectType=${encodeURIComponent(subjectType)}`)
      if (!res.ok) {
        toast.error("No template available. Contact your administrator.")
        return
      }
      const data = await res.json()
      if (data.data?.fileUrl) {
        const fileRes = await fetch(data.data.fileUrl)
        const blob = await fileRes.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = data.data.fileName || "template.xlsx"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        toast.error("No template available. Contact your administrator.")
      }
    } catch {
      toast.error("Failed to download template.")
    } finally {
      setDownloadingTemplate(false)
    }
  }
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-2 shadow-sm">
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <Button size="sm" variant="ghost" onClick={() => onAction("save")}
          className="h-8 rounded-md px-2" title="Save">
          <Save className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("refresh")}
          className="h-8 rounded-md px-2" title="Refresh grade data">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-border pr-2 max-sm:border-r-0">
        <Button size="sm" variant="ghost" onClick={() => onAction("addColumn")}
          className="h-8 rounded-md px-2" title="Add Column">
          <Columns className="size-4" />
          <span className="ms-1.5 hidden text-xs md:inline">Add Column</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("renameColumn")}
          className="h-8 rounded-md px-2" title="Rename Column">
          <Columns3 className="size-4" />
          <span className="ms-1.5 hidden text-xs md:inline">Rename</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("deleteColumn")}
          className="h-8 rounded-md px-2" title="Delete Column">
          <Trash2 className="size-4" />
          <span className="ms-1.5 hidden text-xs md:inline">Delete</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-border pr-2 max-md:border-r-0">
        <Button size="sm" variant="default" onClick={() => onAction("export")}
          disabled={!section || exporting}
          className="h-8 rounded-md bg-blue-600 px-3 text-white hover:bg-blue-700"
          title={!section ? "Select a section first" : exporting ? "Exporting..." : "Export to Excel"}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          <span className="ms-1.5 hidden text-xs md:inline">{exporting ? "Exporting..." : "Export"}</span>
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && onImportFile) onImportFile(f)
            e.target.value = ""
          }}
        />
        <Button size="sm" variant="default" onClick={() => fileInputRef.current?.click()}
          disabled={!section || importing}
          className="h-8 rounded-md bg-green-600 px-3 text-white hover:bg-green-700"
          title={!section ? "Select a section first" : importing ? "Importing..." : "Import from Excel"}>
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          <span className="ms-1.5 hidden text-xs md:inline">{importing ? "Importing..." : "Import"}</span>
        </Button>
        {importUndoToken && (
          <Button size="sm" variant="default" onClick={() => onAction("undoImport")}
            className="h-8 rounded-md bg-amber-600 px-3 text-white hover:bg-amber-700"
            title="Undo the last import">
            <Undo2 className="size-4" />
            <span className="ms-1.5 hidden text-xs md:inline">Undo Import</span>
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleDownloadTemplate}
          disabled={!section || downloadingTemplate}
          className="h-8 rounded-md px-3"
          title={!section ? "Select a section first" : "Download grade import template"}>
          {downloadingTemplate ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
          <span className="ms-1.5 hidden text-xs md:inline">Template</span>
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1 border-l border-border pl-2">
        <Button size="sm" variant="ghost" onClick={() => onAction("fullscreen")}
          className="h-8 rounded-md px-2" title={isFullScreen ? "Exit Full Screen (Esc)" : "Full Screen"}>
          {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          <span className="ms-1.5 hidden text-xs md:inline">{isFullScreen ? "Exit" : "Full Screen"}</span>
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted px-2 py-1 font-medium">{columnCount} cols</span>
      </div>
    </div>
  )
}
