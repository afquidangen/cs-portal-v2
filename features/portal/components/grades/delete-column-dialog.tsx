"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GradeColumn } from "@/lib/types"

export function DeleteColumnDialog({
  open, onOpenChange, onConfirm, columns,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (colId: string) => void
  columns: GradeColumn[]
}) {
  const [selectedCol, setSelectedCol] = useState("")

  useEffect(() => {
    if (!open) return
    const first = columns[0]
    setSelectedCol(first?.id ?? "")
  }, [open, columns])

  const selectedLabel = columns.find((c) => c.id === selectedCol)?.displayName || columns.find((c) => c.id === selectedCol)?.name || ""

  function handleDelete() {
    if (!selectedCol) return
    onConfirm(selectedCol)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Delete Column
          </DialogTitle>
          <DialogDescription>
            Select a column to delete. All grades in this column will be lost. This action cannot be undone.
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
          {selectedLabel && (
            <p className="mt-3 text-sm text-muted-foreground">
              Delete <strong>&ldquo;{selectedLabel}&rdquo;</strong> and all its grades.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={!selectedCol} className="rounded-lg">
            Delete Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
