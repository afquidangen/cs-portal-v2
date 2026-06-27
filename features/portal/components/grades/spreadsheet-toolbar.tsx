"use client"

import {
  Columns, Columns3, Download, Redo2, RotateCcw, Save,
  Trash2, Undo2, Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type ToolbarAction =
  | "addColumn"
  | "deleteColumn"
  | "renameColumn"
  | "undo"
  | "redo"
  | "import"
  | "export"
  | "save"
  | "refresh"

export function SpreadsheetToolbar({
  onAction,
  canUndo,
  canRedo,
  columnCount,
}: {
  onAction: (action: ToolbarAction) => void
  canUndo: boolean
  canRedo: boolean
  columnCount: number
  saveStatus: string
}) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
        <Button size="sm" variant="ghost" onClick={() => onAction("undo")}
          disabled={!canUndo} className="h-8 rounded-md px-2" title="Undo (Ctrl+Z)">
          <Undo2 className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("redo")}
          disabled={!canRedo} className="h-8 rounded-md px-2" title="Redo (Ctrl+Y)">
          <Redo2 className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("save")}
          className="h-8 rounded-md px-2" title="Save">
          <Save className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("refresh")}
          className="h-8 rounded-md px-2" title="Refresh grade data">
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r border-slate-200 pr-2 max-sm:border-r-0">
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

      <div className="flex items-center gap-1 border-r border-slate-200 pr-2 max-md:border-r-0">
        <Button size="sm" variant="ghost" onClick={() => onAction("import")}
          className="h-8 rounded-md px-2" title="Import Excel">
          <Upload className="size-4" />
          <span className="ms-1.5 hidden text-xs md:inline">Import</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("export")}
          className="h-8 rounded-md px-2" title="Export Excel">
          <Download className="size-4" />
          <span className="ms-1.5 hidden text-xs md:inline">Export</span>
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium">{columnCount} cols</span>
      </div>
    </div>
  )
}
