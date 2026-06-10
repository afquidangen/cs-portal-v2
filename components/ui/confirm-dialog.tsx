"use client"

import { AlertTriangle } from "lucide-react"
import type * as React from "react"

import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  icon?: boolean
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {icon ? (
              <div
                className={
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border " +
                  (variant === "destructive"
                    ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800/40 dark:bg-red-950/50 dark:text-red-400"
                    : "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800/40 dark:bg-blue-950/50 dark:text-blue-400")
                }
              >
                <AlertTriangle className="size-4" />
              </div>
            ) : null}
            <div className="space-y-1">
              <DialogTitle className="text-xl text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-2 gap-2">
          <DialogClose asChild>
            <Button variant="ghost">{cancelLabel}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
