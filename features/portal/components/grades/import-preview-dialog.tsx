"use client"

import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import type { ImportColumnDef } from "../../lib/import-template-engine"

type ImportPreviewData = {
  importToken: string
  gradeCount: number
  rosterSection: string
  rosterCount: number
  studentsInFile: number
  studentsMatched: number
  studentsSkipped: number
  scoreUpdates: number
  newColumns: ImportColumnDef[]
  warnings: string[]
  diagnostic?: {
    firstStudentName: string
    gradeCount: number
    firstGradeName: string
    fileKey: string
    firstGradeKey: string
    row5Labels: string[]
    row6Labels: string[]
    row7Labels: string[]
    row8Labels: string[]
    midScores: Array<{ colId: string; value: number }>
    finScores: Array<{ colId: string; value: number }>
    templateCats: Array<{ alias: string; itemCount: number }>
    periodColCounts: { midterm: number; final: number }
    midAbsences: number | null
    midLabAbsences: number | null
    finAbsences: number | null
    finLabAbsences: number | null
  }
}

export function ImportPreviewDialog({
  open,
  onOpenChange,
  preview,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: ImportPreviewData | null
  loading: boolean
  onConfirm: (token: string) => void
}) {
  if (!preview) return null

  const totalExpected = preview.studentsInFile - preview.studentsSkipped
  const hasIssues =
    preview.warnings.length > 0 || preview.newColumns.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-green-600" />
            Import Preview
          </DialogTitle>
          <DialogDescription>
            Review the data detected in the uploaded file before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {preview.studentsMatched}
              </p>
              <p className="text-xs text-muted-foreground">Students matched</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {preview.scoreUpdates}
              </p>
              <p className="text-xs text-muted-foreground">Score cells to update</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {preview.newColumns.length}
              </p>
              <p className="text-xs text-muted-foreground">New columns</p>
            </div>
          </div>

          {/* New columns */}
          {preview.newColumns.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-4" />
                Columns to be created
              </p>
              <div className="max-h-28 space-y-1 overflow-y-auto">
                {preview.newColumns.map((col, i) => (
                  <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
                    &bull; {col.name} ({col.category}, {col.gradingPeriod}, max {col.maxScore})
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/20">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-yellow-800 dark:text-yellow-300">
                <AlertTriangle className="size-4" />
                Warnings
              </p>
              <div className="max-h-28 space-y-0.5 overflow-y-auto">
                {preview.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                    &bull; {w}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* All good */}
          {!hasIssues && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle2 className="size-5 shrink-0" />
              All data looks good. No warnings or new columns detected.
            </div>
          )}

          
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="rounded-lg"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => onConfirm(preview.importToken)}
            disabled={loading}
            className="rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-1.5 size-4" />
                Confirm Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
