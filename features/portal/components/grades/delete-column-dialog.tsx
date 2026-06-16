"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export function DeleteColumnDialog({
  open, onOpenChange, columnName, onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnName: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Delete Column
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>&ldquo;{columnName}&rdquo;</strong>? All grades in this column will be lost. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={onConfirm} className="rounded-lg">
            Delete Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
