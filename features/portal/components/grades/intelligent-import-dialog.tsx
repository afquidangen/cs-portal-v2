"use client"

import { useCallback, useState } from "react"
import {
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight,
  FileSpreadsheet, Loader2, Upload, Save, WandSparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type AutoCategory = "studentName" | "studentId" | "section" | "grade" | "skip" | "unknown"

type DetectedColumn = {
  name: string
  index: number
  type: "string" | "number" | "date" | "mixed"
  sampleValues: unknown[]
  isFormula: boolean
  autoCategory: AutoCategory
  maxScore: number
}

type MergedHeaderGroup = {
  startCol: number
  endCol: number
  label: string
}

type AutoMapping = {
  studentNameCol?: string
  studentIdCol?: string
  sectionCol?: string
  gradeCols: Array<{ sourceName: string; gradeCategory: string; maxScore: number }>
  skipCols: string[]
}

type SheetAnalysis = {
  sheetName: string
  headerRow: number
  totalRows: number
  totalDataRows: number
  columns: DetectedColumn[]
  previewRows: Record<string, unknown>[]
  hasMergedHeaders: boolean
  mergedHeaderGroups: MergedHeaderGroup[]
  confidence: number
  autoMapping: AutoMapping
}

type ColumnMapping = {
  sourceName: string
  targetRole: "studentName" | "studentId" | "section" | "grade"
  gradeCategory: string
  maxScore: number
  skip: boolean
}

const ROLE_OPTIONS: Array<{ value: ColumnMapping["targetRole"]; label: string }> = [
  { value: "studentName", label: "Student Name" },
  { value: "studentId", label: "Student ID" },
  { value: "section", label: "Section" },
  { value: "grade", label: "Grade Column" },
]

const CATEGORY_OPTIONS = [
  "Quizzes", "Performance", "Assignments", "Exam",
  "Exercises", "Work Attitude", "Project", "Attendance", "Custom", "Computed",
]

export function IntelligentImportDialog({
  open, onOpenChange, classId, subject,
  onImportComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  subject: string
  onImportComplete: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState("")
  const [sheetAnalysis, setSheetAnalysis] = useState<SheetAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mapping, setMapping] = useState<ColumnMapping[]>([])
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [result, setResult] = useState<{
    gradesUpdated: number; columnsCreated: number; errors: string[]
  } | null>(null)
  const [saveTemplateName, setSaveTemplateName] = useState("")
  const [showMapping, setShowMapping] = useState(false)

  function handleClose() {
    setFile(null)
    setFileBase64("")
    setSheetAnalysis(null)
    setLoading(false)
    setError("")
    setMapping([])
    setImporting(false)
    setImportDone(false)
    setResult(null)
    setSaveTemplateName("")
    setShowMapping(false)
    onOpenChange(false)
  }

  const readFileAsBase64 = useCallback((f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(",")[1] || result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(f)
    })
  }, [])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError("")
    setResult(null)
    setImportDone(false)
    setShowMapping(false)

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", f)

      const res = await fetch("/api/portal/grades/import/analyze", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Failed to analyze file.")
        return
      }
      const wbAnalysis = json.data as { sheets: SheetAnalysis[]; totalSheets: number }
      const sheet = wbAnalysis.sheets[0]
      if (!sheet) {
        setError("No sheets found in workbook.")
        return
      }

      setSheetAnalysis(sheet)

      const b64 = await readFileAsBase64(f)
      setFileBase64(b64)

      if (sheet.confidence >= 80 && sheet.autoMapping.gradeCols.length > 0 &&
          (sheet.autoMapping.studentNameCol || sheet.autoMapping.studentIdCol)) {
        await autoImport(b64, sheet.sheetName)
      } else {
        buildMappingFromAnalysis(sheet)
        setShowMapping(true)
      }
    } catch {
      setError("Failed to read file.")
    } finally {
      setLoading(false)
    }
  }

  function buildMappingFromAnalysis(sheet: SheetAnalysis) {
    const map: ColumnMapping[] = sheet.columns.map((col) => {
      if (col.autoCategory === "studentName") {
        return { sourceName: col.name, targetRole: "studentName", gradeCategory: "", maxScore: 100, skip: false }
      }
      if (col.autoCategory === "studentId") {
        return { sourceName: col.name, targetRole: "studentId", gradeCategory: "", maxScore: 100, skip: false }
      }
      if (col.autoCategory === "section") {
        return { sourceName: col.name, targetRole: "section", gradeCategory: "", maxScore: 100, skip: false }
      }
      if (col.autoCategory === "skip") {
        return { sourceName: col.name, targetRole: "grade", gradeCategory: "Custom", maxScore: 100, skip: true }
      }
      return {
        sourceName: col.name,
        targetRole: "grade" as const,
        gradeCategory: inferGradeCategory(col.name),
        maxScore: col.maxScore,
        skip: false,
      }
    })
    setMapping(map)
  }

  async function autoImport(b64: string, name: string) {
    setImporting(true)
    try {
      const res = await fetch("/api/portal/grades/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: b64,
          sheetName: name,
          classId,
          subject,
          subjectCode: subject.split(" - ")[0]?.trim() ?? subject,
          autoImport: true,
          saveAsTemplate: saveTemplateName ? { name: saveTemplateName } : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Import failed."); return }
      setResult(json.data as { gradesUpdated: number; columnsCreated: number; errors: string[] })
      setImportDone(true)
      onImportComplete()
      toast.success(`Imported ${json.data?.gradesUpdated ?? 0} records successfully.`)
    } catch {
      setError("Import failed.")
    } finally {
      setImporting(false)
    }
  }

  async function handleImport() {
    if (!fileBase64 || !sheetAnalysis) return
    setImporting(true)
    setError("")

    try {
      const res = await fetch("/api/portal/grades/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          sheetName: sheetAnalysis.sheetName,
          classId,
          subject,
          subjectCode: subject.split(" - ")[0]?.trim() ?? subject,
          columnMapping: mapping,
          saveAsTemplate: saveTemplateName ? { name: saveTemplateName } : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Import failed."); return }
      setResult(json.data as { gradesUpdated: number; columnsCreated: number; errors: string[] })
      setImportDone(true)
      onImportComplete()
      toast.success(`Imported ${json.data?.gradesUpdated ?? 0} records.`)
    } catch {
      setError("Import failed due to network error.")
    } finally {
      setImporting(false)
    }
  }

  function updateMapping(index: number, updates: Partial<ColumnMapping>) {
    setMapping((prev) => prev.map((m, i) => (i === index ? { ...m, ...updates } : m)))
  }

  function inferGradeCategory(name: string): string {
    const lower = name.toLowerCase().trim()
    const patterns: Array<{ pattern: RegExp; cat: string }> = [
      { pattern: /\b(lab quiz|lab quizzes|exercise|exercises)\b/i, cat: "Exercises" },
      { pattern: /\b(work attitude|attitude|lab activity|lab activities)\b/i, cat: "Work Attitude" },
      { pattern: /\b(project|proj|pro|mco)\b/i, cat: "Project" },
      { pattern: /\b(quiz|quizzes|q\d)\b/i, cat: "Quizzes" },
      { pattern: /\b(exam|midterm|final|prelim)\b/i, cat: "Exam" },
      { pattern: /\b(assignment|assign|hw|homework|task)\b/i, cat: "Assignments" },
      { pattern: /\b(performance|recitation|recit|seatwork|sw)\b/i, cat: "Performance" },
      { pattern: /\b(activity|activities|act)\b/i, cat: "Assignments" },
      { pattern: /\b(attendance|attend|atten|att|participation)\b/i, cat: "Attendance" },
      { pattern: /\b(lab|laboratory|practical)\b/i, cat: "Exercises" },
      { pattern: /\b(grade|score|total|average|percentage)\b/i, cat: "Computed" },
    ]
    for (const { pattern, cat } of patterns) {
      if (pattern.test(lower)) return cat
    }
    return "Custom"
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Excel</DialogTitle>
          <DialogDescription>
            Upload an .xlsx file &mdash; the system auto-detects columns and imports immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-center gap-3">
            <Input type="file" accept=".xlsx,.xls" onChange={handleFileSelect}
              className="rounded-lg" disabled={importing} />
            <Button type="button" variant="outline"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="rounded-lg shrink-0" disabled={importing}>
              <Upload className="size-4" /> Browse
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              <Loader2 className="size-5 animate-spin" />
              <div>
                <p className="font-medium">Analyzing spreadsheet...</p>
                <p className="text-xs mt-0.5">Detecting columns, headers, and data types</p>
              </div>
            </div>
          )}

          {importing && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              <Loader2 className="size-5 animate-spin" />
              <div>
                <p className="font-medium">Importing grades...</p>
                <p className="text-xs mt-0.5">Creating columns and saving grade data</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {sheetAnalysis && !importDone && !loading && !importing && (
            <>
              {sheetAnalysis.confidence >= 80 ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                  <WandSparkles className="size-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Auto-detected &mdash; ready to import
                    </p>
                    <p className="text-sm text-emerald-600">
                      Sheet: <strong>{sheetAnalysis.sheetName}</strong> &middot;
                      {sheetAnalysis.totalDataRows} data rows &middot;
                      {sheetAnalysis.autoMapping.gradeCols.length} grade columns &middot;
                      Confidence: {sheetAnalysis.confidence}%
                    </p>
                    <button onClick={() => {
                      buildMappingFromAnalysis(sheetAnalysis)
                      setShowMapping(true)
                    }}
                    className="mt-1 text-xs text-emerald-600 underline hover:text-emerald-800">
                      Review mapping
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">
                      Could not auto-detect columns
                    </p>
                    <p className="text-sm text-amber-600">
                      Sheet: <strong>{sheetAnalysis.sheetName}</strong> &middot;
                      Confidence: {sheetAnalysis.confidence}%
                    </p>
                    <p className="text-xs text-amber-500 mt-1">
                      Please manually assign column roles below.
                    </p>
                  </div>
                </div>
              )}

              {showMapping && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">
                    Column Mapping &mdash; assign roles to each column:
                  </p>
                  <div className="max-h-60 overflow-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Column</th>
                          <th className="px-3 py-2 font-semibold">Type</th>
                          <th className="px-3 py-2 font-semibold">Role</th>
                          <th className="px-3 py-2 font-semibold">Category</th>
                          <th className="px-3 py-2 font-semibold w-16">Max</th>
                          <th className="px-3 py-2 font-semibold w-16">Skip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {mapping.map((m, i) => {
                          const col = sheetAnalysis.columns[i]
                          if (!col) return null
                          return (
                            <tr key={i} className={`hover:bg-muted/50 ${m.skip ? "opacity-50" : ""}`}>
                              <td className="px-3 py-2 font-medium max-w-[160px] truncate" title={col.name}>
                                {col.name}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium
                                  ${col.type === "number" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" :
                                    col.type === "string" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" :
                                    "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground"}`}>
                                  {col.type}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <select value={m.targetRole}
                                  onChange={(e) => updateMapping(i, { targetRole: e.target.value as ColumnMapping["targetRole"] })}
                                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs w-28">
                                  {ROLE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                {m.targetRole === "grade" ? (
                                  <select value={m.gradeCategory}
                                    onChange={(e) => updateMapping(i, { gradeCategory: e.target.value })}
                                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs w-24">
                                    {CATEGORY_OPTIONS.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-3 py-2">
                                {m.targetRole === "grade" ? (
                                  <input type="number" min="1" value={m.maxScore}
                                    onChange={(e) => updateMapping(i, { maxScore: Number(e.target.value) || 100 })}
                                    className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-xs" />
                                ) : "—"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input type="checkbox" checked={m.skip}
                                  onChange={(e) => updateMapping(i, { skip: e.target.checked })}
                                  className="rounded border-border" />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Save className="size-4 text-muted-foreground" />
                      Save as reusable template (optional)
                    </label>
                    <Input value={saveTemplateName}
                      onChange={(e) => setSaveTemplateName(e.target.value)}
                      placeholder="e.g., Quiz & Exam Template"
                      className="mt-2 rounded-lg" />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" onClick={handleImport} disabled={importing} className="rounded-lg">
                      {importing ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                      {importing ? "Importing..." : "Import Grades"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {importDone && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                <CheckCircle2 className="size-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Import Complete</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {result.gradesUpdated} grade records imported &middot; {result.columnsCreated} new columns created
                    {result.errors.length > 0 && ` &middot; ${result.errors.length} warning(s)`}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    The data is now editable in the grid below.
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">Warnings:</p>
                  <ul className="list-inside list-disc text-xs text-amber-600">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {result.errors.length > 5 && <li>... and {result.errors.length - 5} more</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg">
              {importDone ? "Done" : "Cancel"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
