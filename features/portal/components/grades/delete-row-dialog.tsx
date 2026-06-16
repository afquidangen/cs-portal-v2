"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export function DeleteRowDialog({
  open, onOpenChange, rowCount, onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rowCount: number
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Delete {rowCount > 1 ? "Rows" : "Row"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{rowCount}</strong> selected {rowCount === 1 ? "row" : "rows"}? All grade data for these students will be removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm} className="rounded-lg">
            Delete {rowCount > 1 ? "Rows" : "Row"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
