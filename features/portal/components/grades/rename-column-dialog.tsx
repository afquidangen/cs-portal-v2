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
  open, onOpenChange, onConfirm, columns,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (colId: string, newName: string) => void
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

  function handleConfirm() {
    if (!name.trim() || !selectedCol) return
    onConfirm(selectedCol, name.trim())
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
