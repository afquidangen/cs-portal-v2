"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export function RenameColumnDialog({
  open, onOpenChange, currentName, onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onConfirm: (newName: string) => void
}) {
  const [name, setName] = useState(currentName)

  function handleConfirm() {
    if (!name.trim()) return
    onConfirm(name.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Column</DialogTitle>
          <DialogDescription>Enter a new name for &ldquo;{currentName}&rdquo;.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Column name" className="rounded-lg" autoFocus />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!name.trim()} className="rounded-lg">
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
