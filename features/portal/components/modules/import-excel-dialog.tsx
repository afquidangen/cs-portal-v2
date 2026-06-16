"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PreviewRow = {
  row: number
  studentName: string
  studentId: string
  section: string
  scores: Record<string, number>
}

export function ImportExcelDialog({
  open,
  onOpenChange,
  classId,
  onImportComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  onImportComplete: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError("")
    setPreview(null)
    setImportResult(null)

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", f)
      formData.append("action", "preview")
      formData.append("classId", classId)

      const res = await fetch("/api/portal/grades/import", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Failed to parse file.")
        return
      }
      setPreview(json.data?.preview || [])
    } catch {
      setError("Failed to read file.")
    } finally {
      setLoading(false)
    }
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("classId", classId)

      const res = await fetch("/api/portal/grades/import", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Import failed.")
        return
      }
      setImportResult(`Successfully imported ${json.data?.imported ?? 0} grade records.`)
      onImportComplete()
    } catch {
      setError("Import failed due to network error.")
    } finally {
      setImporting(false)
    }
  }

  function handleClose() {
    setFile(null)
    setPreview(null)
    setLoading(false)
    setError("")
    setImporting(false)
    setImportResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Excel</DialogTitle>
          <DialogDescription>
            Upload an .xlsx file to import grades. Preview the data before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              className="rounded-lg"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="rounded-lg shrink-0"
            >
              <Upload className="size-4" />
              Browse
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Parsing file...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {preview && preview.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Preview ({preview.length} rows)
              </p>
              <div className="max-h-60 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Student</th>
                      <th className="px-3 py-2 font-semibold">Section</th>
                      <th className="px-3 py-2 font-semibold">Scores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.slice(0, 20).map((row) => (
                      <tr key={row.row} className="hover:bg-muted/50">
                        <td className="px-3 py-2 text-muted-foreground">{row.row}</td>
                        <td className="px-3 py-2 font-medium">{row.studentName}</td>
                        <td className="px-3 py-2">{row.section}</td>
                        <td className="px-3 py-2">
                          {Object.entries(row.scores).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="mr-2 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                              {k}: {v}
                            </span>
                          ))}
                          {Object.keys(row.scores).length > 3 && (
                            <span className="text-muted-foreground">
                              +{Object.keys(row.scores).length - 3} more
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <p className="p-2 text-xs text-muted-foreground text-center">
                    ... and {preview.length - 20} more rows
                  </p>
                )}
              </div>
            </div>
          )}

          {importResult && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="size-4" />
              {importResult}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">
              Close
            </Button>
          </DialogClose>
          {preview && preview.length > 0 && !importResult && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="rounded-lg"
            >
              {importing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}
              {importing ? "Importing..." : `Import ${preview.length} Records`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
