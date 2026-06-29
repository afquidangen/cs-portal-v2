# Fix Undo/Redo/Rename — Revised

## Root Causes

### Rename/Delete
`lastFocusedColRef` (set via `onCellFocused`) is unreliable with `singleClickEdit=true`. When the user clicks a cell, AG Grid enters edit mode and focus goes to the inner `<input>`. When they move to the toolbar button, cell focus is lost and `lastFocusedColRef.current` can be `null` or stale.

**Fix:** Remove the focus-dependent approach entirely. Replace with a `<select>` dropdown inside `RenameColumnDialog` and `DeleteColumnDialog` listing all score columns (filtered by grading period). User picks the column from the list.

### Undo/Redo
`autoSave.schedule()` is called **inside** `setGrades(prev => {...})` — a side-effect in a React state updater. React's StrictMode calls updaters twice, and the impure updater may cause React to bail out of the re-render.

**Fix:** Build restored grades from `gradeMap` (current prop), call `setGrades(restored)` without a function updater, then call `autoSave.schedule()` separately.

## Changes

### File: `features/portal/components/grades/spreadsheet-grid.tsx`

#### a) Remove `lastFocusedColRef` and `gridDataRef` (lines 412-414)

Remove:
```typescript
const gridDataRef = useRef(gridData)
gridDataRef.current = gridData
const lastFocusedColRef = useRef<string | null>(null)
```

#### b) Remove `onCellFocused` handler and its import

Remove `CellFocusedEvent` from imports (line 8).
Remove the `onCellFocused` function (lines 638-646).
Remove `onCellFocused={onCellFocused}` from `<AgGridReact>` (line 1678).

#### c) Fix rename/delete actions (lines 846-861)

Replace rename action:
```typescript
case "renameColumn": {
  setRenameOpen(true)
  break
}
```

Replace delete action:
```typescript
case "deleteColumn": {
  setDeleteColOpen(true)
  break
}
```

No longer set `selectedColName` here — the dialog dropdown determines which column.

#### d) Fix undo action (lines 862-878)

Replace with:
```typescript
case "undo": {
  const snapshot = undoManager.current.undo()
  if (snapshot) {
    const currentSnapshot = buildSnapshot(gridData as unknown as Record<string, unknown>[], [])
    undoManager.current.pushForRedo(currentSnapshot)
    const restored = Array.from(gradeMap.values()).map((g) => {
      const oldRow = snapshot.rowData.find((r) => r.studentId === g.studentId)
      return oldRow
        ? { ...g, scores: (oldRow.scores ?? {}) as Record<string, number>, updatedAt: new Date().toISOString() }
        : g
    })
    setGrades(restored)
    autoSave.schedule({ grades: restored, cid: classId })
  }
  break
}
```

Note: uses `gridData` (the prop directly) instead of `gridDataRef.current`.

#### e) Fix redo action (lines 880-896)

Replace with:
```typescript
case "redo": {
  const snapshot = undoManager.current.redo()
  if (snapshot) {
    const currentSnapshot = buildSnapshot(gridData as unknown as Record<string, unknown>[], [])
    undoManager.current.pushToUndo(currentSnapshot)
    const restored = Array.from(gradeMap.values()).map((g) => {
      const nextRow = snapshot.rowData.find((r) => r.studentId === g.studentId)
      return nextRow
        ? { ...g, scores: (nextRow.scores ?? {}) as Record<string, number>, updatedAt: new Date().toISOString() }
        : g
    })
    setGrades(restored)
    autoSave.schedule({ grades: restored, cid: classId })
  }
  break
}
```

#### f) Pass `columns` prop to dialogs

For `RenameColumnDialog` (around line 1757):
```tsx
<RenameColumnDialog open={renameOpen} onOpenChange={setRenameOpen}
  currentName={selectedColumnLabel} onConfirm={handleRenameColumn}
  columns={filteredColumns} />
```

For `DeleteColumnDialog` (around line 1759):
```tsx
<DeleteColumnDialog open={deleteColOpen} onOpenChange={setDeleteColOpen}
  columnName={selectedColumnLabel} onConfirm={handleDeleteColumn}
  columns={filteredColumns} />
```

### File: `features/portal/components/grades/rename-column-dialog.tsx`

Replace entire file:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GradeColumn } from "@/lib/types"

export function RenameColumnDialog({
  open, onOpenChange, currentName, onConfirm, columns,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onConfirm: (newName: string) => void
  columns: GradeColumn[]
}) {
  const [selectedCol, setSelectedCol] = useState("")
  const [name, setName] = useState("")

  useEffect(() => {
    if (!open) return
    const first = columns[0]
    if (first) {
      setSelectedCol(first.id)
      setName(first.displayName || first.name)
    } else {
      setSelectedCol("")
      setName("")
    }
  }, [open, columns])

  const selectedDisplayName = columns.find((c) => c.id === selectedCol)?.displayName || columns.find((c) => c.id === selectedCol)?.name || ""

  function handleConfirm() {
    if (!name.trim() || !selectedCol) return
    onConfirm(name.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
          <DialogDescription>Select a column and enter a new name.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Column</label>
            <Select value={selectedCol} onValueChange={(v) => {
              setSelectedCol(v)
              const col = columns.find((c) => c.id === v)
              setName(col?.displayName || col?.name || "")
            }}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.displayName || col.name} ({col.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">New name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Column name" className="rounded-lg" autoFocus />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!name.trim() || !selectedCol} className="rounded-lg">
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### File: `features/portal/components/grades/delete-column-dialog.tsx`

Replace entire file — same `<Select>` dropdown for column selection:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GradeColumn } from "@/lib/types"

export function DeleteColumnDialog({
  open, onOpenChange, columnName, onConfirm, columns,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnName: string
  onConfirm: () => void
  columns: GradeColumn[]
}) {
  const [selectedCol, setSelectedCol] = useState("")

  useEffect(() => {
    if (!open) return
    const first = columns[0]
    setSelectedCol(first?.id ?? "")
  }, [open, columns])

  const selectedLabel = columns.find((c) => c.id === selectedCol)?.displayName || columns.find((c) => c.id === selectedCol)?.name || ""

  async function handleDelete() {
    if (!selectedCol) return
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Column</DialogTitle>
          <DialogDescription>
            Select a column to delete. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedCol} onValueChange={setSelectedCol}>
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.displayName || col.name} ({col.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={!selectedCol} className="rounded-lg">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Adjust `handleRenameColumn` and `handleDeleteColumn`

`handleRenameColumn(newName)` currently uses `selectedColName` to find the column. With the dropdown approach, the dialog should pass back BOTH the column ID AND the new name. The simplest approach: change the `onConfirm` callbacks.

For rename, the dialog already has the selected column ID. We need to change the flow so the dialog passes `{ colId: string, newName: string }` instead of just `newName: string`.

Better approach: keep the dialog's `onConfirm` as `(newName: string) => void`, but use `selectedCol` state from the dialog to determine which column is being renamed. Actually, we need to change the contract.

New approach: change `onConfirm` to `(colId: string, newName: string) => void`.

- `RenameColumnDialog`: on confirm, call `onConfirm(selectedCol, name.trim())`
- `DeleteColumnDialog`: on confirm, call `onConfirm(selectedCol)`

Then update `handleRenameColumn(colId, newName)` and `handleDeleteColumn(colId)` to use the passed colId directly instead of looking up by `selectedColName`.

### Slight revision — use colId directly

Change `RenameColumnDialog.onConfirm` to `(colId: string, newName: string) => void`.
Change `DeleteColumnDialog.onConfirm` to `(colId: string) => void`.

Then in `spreadsheet-grid.tsx`:
- `handleRenameColumn(newName)` → `handleRenameColumn(colId, newName)`
- `handleDeleteColumn()` → `handleDeleteColumn(colId)`

This is cleaner and avoids the `selectedColName` state entirely for rename/delete.
