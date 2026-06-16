"use client"

import {
  Columns, Columns3, Download, FileSpreadsheet, Plus, Redo2, Save,
  Table2, Trash2, Undo2, Upload, UserPlus, UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type ToolbarAction =
  | "addColumn"
  | "deleteColumn"
  | "renameColumn"
  | "addRow"
  | "deleteRow"
  | "undo"
  | "redo"
  | "import"
  | "export"
  | "save"
  | "reorderColumns"

export function SpreadsheetToolbar({
  onAction,
  canUndo,
  canRedo,
  selectedRowCount,
  columnCount,
  saveStatus,
}: {
  onAction: (action: ToolbarAction) => void
  canUndo: boolean
  canRedo: boolean
  selectedRowCount: number
  columnCount: number
  saveStatus: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-2 shadow-sm">
      <div className="flex items-center gap-1 pe-2 border-e border-border">
        <Button size="sm" variant="ghost" onClick={() => onAction("undo")}
          disabled={!canUndo} className="h-8 px-2" title="Undo (Ctrl+Z)">
          <Undo2 className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("redo")}
          disabled={!canRedo} className="h-8 px-2" title="Redo (Ctrl+Y)">
          <Redo2 className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("save")}
          className="h-8 px-2" title="Save">
          <Save className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 pe-2 border-e border-border">
        <Button size="sm" variant="ghost" onClick={() => onAction("addColumn")}
          className="h-8 px-2" title="Add Column">
          <Columns className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Add Column</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("renameColumn")}
          className="h-8 px-2" title="Rename Column">
          <Columns3 className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Rename</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("deleteColumn")}
          className="h-8 px-2" title="Delete Column">
          <Trash2 className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Delete Col</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("reorderColumns")}
          className="h-8 px-2" title="Reorder Columns">
          <Table2 className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Reorder</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 pe-2 border-e border-border">
        <Button size="sm" variant="ghost" onClick={() => onAction("addRow")}
          className="h-8 px-2" title="Add Row">
          <UserPlus className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Add Row</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("deleteRow")}
          disabled={selectedRowCount === 0}
          className="h-8 px-2" title="Delete Selected Row(s)">
          <UserX className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">
            Delete{selectedRowCount > 0 ? ` (${selectedRowCount})` : ""}
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => onAction("import")}
          className="h-8 px-2" title="Import Excel">
          <Upload className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Import</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onAction("export")}
          className="h-8 px-2" title="Export Excel">
          <Download className="size-4" />
          <span className="ms-1.5 text-xs hidden md:inline">Export</span>
        </Button>
      </div>

      <div className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span>{columnCount} cols</span>
        {selectedRowCount > 0 && <span>&middot; {selectedRowCount} selected</span>}
      </div>
    </div>
  )
}
