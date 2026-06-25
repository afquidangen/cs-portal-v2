"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle, ChevronDown, Search, Save, Megaphone, X,
} from "lucide-react"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ColGroupDef, CellValueChangedEvent, ColumnResizedEvent, GridReadyEvent, ColumnHeaderClickedEvent } from "ag-grid-community"
import { AllCommunityModule, ModuleRegistry, themeAlpine } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "../modules/types"
import type { GradeRecord, GradeWorkflowStatus, GradeColumn, GradingPeriod, Assessment, ReleaseHistoryEntry } from "@/lib/types"
import { useAutoSave, type SaveStatus } from "../../lib/auto-save"
import { computeLivePreview, gradeCategoryMatches, transmuteGrade } from "../../lib/grade-engine"
import { gradeRemarkOptions } from "../../lib/grades"
import { UndoRedoManager, buildSnapshot } from "../../lib/undo-redo"
import { SpreadsheetToolbar, type ToolbarAction } from "./spreadsheet-toolbar"
import { RenameColumnDialog } from "./rename-column-dialog"
import { DeleteColumnDialog } from "./delete-column-dialog"
import { AddColumnDialog } from "../modules/add-column-dialog"
import { IntelligentImportDialog } from "./intelligent-import-dialog"
import { SaveStatusIndicator } from "../modules/save-status-indicator"

ModuleRegistry.registerModules([AllCommunityModule])

function fmtNum(val: unknown) {
  const n = Number(val)
  return isNaN(n) ? "" : n.toFixed(2)
}

function scoreKey(col: { name: string; gradingPeriod: string }): string {
  return col.gradingPeriod === "both" ? col.name : `${col.gradingPeriod}_${col.name}`
}

function findGradeColumnBySelection(columns: GradeColumn[], selection: string): GradeColumn | undefined {
  return columns.find((col) => col.name === selection || scoreKey(col) === selection)
}

function gradeColumnLabel(col: GradeColumn | undefined, fallback: string) {
  return col?.displayName || col?.name || fallback
}

function findCategoryWeight(catName: string, catWeightMap: Map<string, number>): number | undefined {
  for (const [key, weight] of catWeightMap) {
    if (gradeCategoryMatches(key, catName)) return weight
  }
  return undefined
}

function catColDefsHas(catColDefs: Map<string, unknown>, catName: string): boolean {
  for (const key of catColDefs.keys()) {
    if (gradeCategoryMatches(catName, key)) return true
  }
  return false
}

function ReleaseDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (period: "midterm" | "final" | "both") => Promise<void>
}) {
  const [releaseMidterm, setReleaseMidterm] = useState(true)
  const [releaseFinal, setReleaseFinal] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setReleaseMidterm(true)
      setReleaseFinal(true)
      setLoading(false)
    }
  }, [open])

  async function handleConfirm() {
    const period = releaseMidterm && releaseFinal ? "both" : releaseMidterm ? "midterm" : "final"
    setLoading(true)
    await onConfirm(period)
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Release Grades</DialogTitle>
          <DialogDescription>
            Make grades visible to students. Select which periods to release.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/30">
            <input type="checkbox" checked={releaseMidterm} onChange={(e) => setReleaseMidterm(e.target.checked)} className="size-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Release Midterm Grade</span>
              <span className="text-xs text-muted-foreground">Midterm Semester</span>
            </div>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/30">
            <input type="checkbox" checked={releaseFinal} onChange={(e) => setReleaseFinal(e.target.checked)} className="size-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Release Final Grade</span>
              <span className="text-xs text-muted-foreground">Finals Semester</span>
            </div>
          </label>
          <p className="text-xs text-muted-foreground">
            Students will see released period grades immediately.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg" disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} className="rounded-lg" disabled={!releaseMidterm && !releaseFinal || loading}>
            {loading ? "Releasing..." : "Release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditMaxScoreDialog({
  open, onOpenChange, colName, currentMax, onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  colName: string
  currentMax: number
  onConfirm: (maxScore: number) => void
}) {
  const [val, setVal] = useState(String(currentMax))
  useEffect(() => { setVal(String(currentMax)) }, [currentMax])

  function handleSave() {
    const num = Number(val)
    if (!isNaN(num) && num >= 0) onConfirm(num)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit Max Score</DialogTitle>
          <DialogDescription>
            Set the maximum possible score for &ldquo;{colName}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          min={0}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
          className="rounded-lg"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">Cancel</Button>
          <Button onClick={handleSave} className="rounded-lg">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RemarksDropdownRenderer(params: { value: string; node: { setDataValue: (field: string, val: string) => void }; colDef: { colId?: string } }) {
  const val = params.value || ""
  const field = params.colDef?.colId || "remarks"
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    params.node.setDataValue(field, e.target.value)
  }

  return (
    <select
      value={val}
      onChange={onChange}
      style={{ colorScheme: isDark ? "dark" : "light", backgroundColor: isDark ? "#1e293b" : "#fff", color: isDark ? "#fff" : "#000" }}
      className="w-full rounded-md border px-2 py-1 text-xs"
    >
      <option value="">&mdash;</option>
      {gradeRemarkOptions.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

function ReleaseCellRenderer(params: { value: string; data: { studentName: string; studentId: string; midtermReleased?: boolean; finalReleased?: boolean }; colDef: { colId?: string } }) {
  const val = params.value
  const colId = params.colDef?.colId ?? ""
  const period = colId.startsWith("midtermRelease") ? "midterm" : "final"
  const released = period === "midterm" ? params.data.midtermReleased : params.data.finalReleased

  if (!released) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
        Unreleased
      </span>
    )
  }

  const isReReleased = val === "Re-released"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer ${
      isReReleased ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
    }`}>
      {val}
    </span>
  )
}

function UndoReleaseDialog({
  open, onOpenChange, studentName, period, studentId, alreadyReleased, onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  studentName: string
  period: "midterm" | "final"
  studentId: string
  alreadyReleased: boolean
  onConfirm: (studentId: string, period: "midterm" | "final", action: "release" | "unrelease", reason?: string) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) { setReason(""); setLoading(false) }
  }, [open])

  async function handleConfirm() {
    if (alreadyReleased && !reason.trim()) return
    setLoading(true)
    await onConfirm(studentId, period, alreadyReleased ? "unrelease" : "release", reason.trim() || undefined)
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {alreadyReleased ? `Undo Release – ${period === "midterm" ? "Midterm" : "Final"}` : `Re-release – ${period === "midterm" ? "Midterm" : "Final"}`}
          </DialogTitle>
          <DialogDescription>
            {alreadyReleased
              ? `Unrelease ${period} grades for ${studentName}. The student will no longer see these grades.`
              : `Re-release ${period} grades for ${studentName}. The student will see updated grades.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-sm font-medium">{studentName}</span>
          </div>
          {alreadyReleased && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason for undoing release *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Explain why you are undoing the release..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg" disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} className="rounded-lg" disabled={alreadyReleased && !reason.trim() || loading}>
            {loading ? "Processing..." : alreadyReleased ? "Undo Release" : "Re-release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type CategoryPreviewData = {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  percentageScore: number
  weightedScore: number
}

type LivePreviewEntry = {
  studentId: string
  classStanding: number
  examGrade: number
  lectureGrade: number
  laboratoryGrade?: number
  periodGrade: number
  categoryGrades: CategoryPreviewData[]
}

type StudentGradeRow = {
  no: number
  studentId: string
  studentName: string
  section: string
  gradeId?: string
  scores: Record<string, number>
  midtermGrade?: number
  midtermTransmuted?: number
  finalGrade?: number
  finalTransmuted?: number
  transmutedGrade?: number
  remarks?: string
  midtermRemarks?: string
  finalRemarks?: string
  workflowStatus: GradeWorkflowStatus
  midtermReleased?: boolean
  finalReleased?: boolean
  midtermReleaseHistory?: ReleaseHistoryEntry[]
  finalReleaseHistory?: ReleaseHistoryEntry[]
  liveClassStanding?: number
  liveExamGrade?: number
  livePeriodGrade?: number
}

type TabKey = "midterm" | "final" | "summary"

export function SpreadsheetGrid({
  model,
  selectedSubject,
  classId,
  gradeColumns,
  setGradeColumns,
  gridData,
  gradeMap,
  setGrades,
  roster,
  subjectRoster,
  studentQuery,
  setStudentQuery,
  computedOnce,
  setComputedOnce,
  darkMode,
  assessments,
  gradingScheme,
  activeTab,
  setActiveTab,
}: {
  model: PortalModuleProps["model"]
  selectedSubject: string
  classId: string
  gradeColumns: GradeColumn[]
  setGradeColumns: (cols: GradeColumn[]) => void
  gridData: StudentGradeRow[]
  gradeMap: Map<string, GradeRecord>
  setGrades: React.Dispatch<React.SetStateAction<GradeRecord[]>>
  roster: PortalModuleProps["model"]["roster"]
  subjectRoster: PortalModuleProps["model"]["roster"]
  studentQuery: string
  setStudentQuery: (q: string) => void
  computedOnce: boolean
  setComputedOnce: (v: boolean) => void
  darkMode: boolean
  assessments: Assessment[]
  gradingScheme?: { components: Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number; isAttendance?: boolean }>; isExam?: boolean }>; labComponents?: Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number; isAttendance?: boolean }>; isExam?: boolean }>; lectureWeight?: number; laboratoryWeight?: number; subjectType: "Lecture" | "Lecture with Lab" } | null
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
}) {
  const gridRef = useRef<AgGridReact>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const isEditable = model.role === "faculty" || model.role === "admin"
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [addColumnOpen, setAddColumnOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteColOpen, setDeleteColOpen] = useState(false)
  const [selectedColName, setSelectedColName] = useState("")
  const otherColsRef = useRef<Map<string, string[]>>(new Map())
  const [dismissedOther, setDismissedOther] = useState(false)
  const [maxScoreDialogOpen, setMaxScoreDialogOpen] = useState(false)
  const [maxScoreColName, setMaxScoreColName] = useState("")
  const [maxScoreCurrent, setMaxScoreCurrent] = useState(0)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [releaseMidterm, setReleaseMidterm] = useState(true)
  const [releaseFinal, setReleaseFinal] = useState(true)
  const [releasing, setReleasing] = useState(false)
  const [studentReleaseOpen, setStudentReleaseOpen] = useState(false)
  const [studentReleaseTarget, setStudentReleaseTarget] = useState<{ studentId: string; studentName: string; period: "midterm" | "final"; alreadyReleased: boolean } | null>(null)

  const undoManager = useRef(new UndoRedoManager())

  const gradeMapRef = useRef(gradeMap)
  gradeMapRef.current = gradeMap
  const [liveData, setLiveData] = useState<Map<string, LivePreviewEntry>>(new Map())
  const dataLoadedRef = useRef(false)

  const scheduleInfo = useMemo(() => {
    if (!classId || !model.visibleSchedules) return { instructor: "", section: "" }
    const schedule = (model.visibleSchedules as Array<{ id: string; instructor: string; section: string }>).find((s) => s.id === classId)
    return { instructor: schedule?.instructor ?? "", section: schedule?.section ?? "" }
  }, [classId, model.visibleSchedules])

  useEffect(() => {
    if (gradeMap.size > 0 && !dataLoadedRef.current) {
      dataLoadedRef.current = true
    }
  }, [gradeMap])

  const saveGradeData = useCallback(async (data: unknown) => {
    const { grades: gradeData, cid, showToast } = data as { grades: GradeRecord[]; cid: string; showToast?: boolean }
    if (!cid) {
      if (showToast) toast.error("No class selected.")
      throw new Error("No classId provided")
    }
    const res = await fetch(`/api/portal/grades/class/${cid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grades: gradeData }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[GradeSaveError]", res.status, text)
      if (showToast) toast.error("Failed to save grades.")
      throw new Error(`Failed to save: ${res.status} ${text}`)
    }
    const json = await res.json()
    if (json.data?.grades) {
      setGrades((prev) => {
        const serverMap = new Map((json.data.grades as GradeRecord[]).map((g: GradeRecord) => [g.studentId, g]))
        return prev.map((g) => {
          const s = serverMap.get(g.studentId)
          return s ? { ...g, ...s } : g
        })
      })
    }
    if (showToast) toast.success("Grades saved successfully.")
  }, [setGrades])

  const autoSave = useAutoSave(saveGradeData, 800)

  useEffect(() => {
    setSaveStatus(autoSave.status)
    setLastSaved(autoSave.lastSaved)
  }, [autoSave.status, autoSave.lastSaved])

  const filteredColumns = useMemo(() => {
    if (activeTab === "summary") return []
    const ignore = new Set(["invalid", "scores"])
    return gradeColumns.filter((col) => {
      if (col.gradingPeriod === "both") return true
      if (col.gradingPeriod !== activeTab) return false
      if (ignore.has(col.name.toLowerCase())) return false
      return true
    })
  }, [gradeColumns, activeTab])

  const filteredAssessments = useMemo(() => {
    if (activeTab === "summary") return []
    return assessments.filter((a) => {
      if (a.gradingPeriod === activeTab) return true
      return true
    })
  }, [assessments, activeTab])

  const periodAssessments = useMemo(() => {
    if (activeTab === "summary") return []
    return assessments.filter((a) => a.gradingPeriod === activeTab || a.gradingPeriod === "both")
  }, [assessments, activeTab])

  function ensureGradeRecord(studentId: string): GradeRecord | undefined {
    const existing = gradeMap.get(studentId)
    if (existing) return existing
    const student = roster.find((s) => s.id === studentId)
    if (!student) return undefined
    const newGrade: GradeRecord = {
      id: `GRD-${Date.now()}-${studentId}`,
      studentId,
      student: student.name,
      section: student.section,
      subject: selectedSubject,
      code: selectedSubject.split(" - ")[0]?.trim() ?? selectedSubject,
      units: 3,
      classId,
      subjectType: effectiveScheme?.subjectType ?? "Lecture",
      scores: {},
      categoryGrades: [],
      workflowStatus: "Draft",
      updatedAt: new Date().toISOString(),
    }
    setGrades((prev) => [newGrade, ...prev])
    return newGrade
  }

  function onCellValueChanged(event: CellValueChangedEvent) {
    const { data, colDef, newValue, oldValue } = event
    if (newValue === oldValue) return

    undoManager.current.push(buildSnapshot(gridData as unknown as Record<string, unknown>[], []))

    const row = data as StudentGradeRow
    const colId = colDef.colId

    if (colId?.startsWith("score_")) {
      const colName = colId.replace("score_", "")
      const grade = ensureGradeRecord(row.studentId)
      if (!grade) return
      const score = Number(newValue) || 0
      const updatedScores = { ...grade.scores, [colName]: score }

      setGrades((prev) =>
        prev.map((g) =>
          g.studentId === row.studentId
            ? { ...g, scores: updatedScores, updatedAt: new Date().toISOString() }
            : g
        )
      )

      autoSave.schedule({ grades: [{ ...grade, scores: updatedScores }], cid: classId })
    } else if (colId?.startsWith("absences_")) {
      const afterPrefix = colId.replace("absences_", "")
      const underscoreIdx = afterPrefix.indexOf("_")
      const period = underscoreIdx >= 0 ? afterPrefix.slice(0, underscoreIdx) : "midterm"
      const catName = underscoreIdx >= 0 ? afterPrefix.slice(underscoreIdx + 1) : afterPrefix
      const catKey = catName.toLowerCase().replace(/[^a-z0-9]/g, "")
      const scoresKey = `${period}_absences_${catKey}`
      const grade = ensureGradeRecord(row.studentId)
      if (!grade) return
      const absences = Number(newValue) || 0
      const updatedScores = { ...grade.scores, [scoresKey]: absences }

      setGrades((prev) =>
        prev.map((g) =>
          g.studentId === row.studentId
            ? { ...g, scores: updatedScores, updatedAt: new Date().toISOString() }
            : g
        )
      )

      autoSave.schedule({ grades: [{ ...grade, scores: updatedScores }], cid: classId })
    } else if (colId === "remarks" || colId === "midtermRemarks" || colId === "finalRemarks") {
      const grade = gradeMap.get(row.studentId)
      if (!grade) return
      const val = String(newValue)
      const updates: Record<string, unknown> = { [colId]: val, updatedAt: new Date().toISOString() }
      if (colId === "midtermRemarks" || colId === "finalRemarks") {
        const newFinal = colId === "finalRemarks" ? val : grade.finalRemarks
        const newMidterm = colId === "midtermRemarks" ? val : grade.midtermRemarks
        const special = ["INC", "FAILED", "DROPPED"]
        if (newFinal && special.includes(newFinal)) {
          updates.remarks = newFinal
        } else if (newMidterm && special.includes(newMidterm)) {
          updates.remarks = newMidterm
        }
      }
      setGrades((prev) =>
        prev.map((g) =>
          g.studentId === row.studentId
            ? { ...g, ...updates }
            : g
        )
      )
      autoSave.schedule({ grades: [{ ...grade, ...updates }], cid: classId })
    }
  }

  function onGridReady(event: GridReadyEvent) {
    undoManager.current.clear()
  }

  function onColumnResized(event: ColumnResizedEvent) {
    if (!event.finished) return
    const next: Record<string, number> = {}
    event.api.getColumnState().forEach((col) => {
      next[col.colId] = col.width ?? 0
    })
    setColumnWidths(next)
  }

  function onColumnHeaderClicked(event: ColumnHeaderClickedEvent) {
    const col = event.column as { isGroupColumn?: () => boolean; getChildren?: () => Array<{ getColDef: () => { colId?: string } }> }
    if (typeof col.isGroupColumn === "function" && col.isGroupColumn()) {
      const children = col.getChildren?.() ?? []
      for (const child of children) {
        const id = child.getColDef().colId
        if (id?.startsWith("score_")) {
          const colName = id.replace("score_", "")
          const colData = findGradeColumnBySelection(gradeColumns, colName)
          if (colData) {
            setMaxScoreColName(scoreKey(colData))
            setMaxScoreCurrent(colData.maxScore)
            setMaxScoreDialogOpen(true)
            return
          }
        }
      }
    }
  }

  async function handleComputeGrades(period: "midterm" | "final") {
    if (!classId) return
    try {
      const res = await fetch("/api/portal/grades/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, gradingPeriod: period }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Computation failed."); return }
      const computedGrades: GradeRecord[] = json.data?.grades || []
      setGrades((prev) => {
        const computedMap = new Map(computedGrades.map((g) => [g.studentId, g]))
        return prev.map((g) => {
          const c = computedMap.get(g.studentId)
          return c ? { ...g, ...c } : g
        })
      })
      setComputedOnce(true)
      toast.success(`Grades computed successfully (${period} period).`)
    } catch { toast.error("Failed to compute grades.") }
  }

  async function handleRelease(period: "midterm" | "final" | "both") {
    if (!classId) return
    try {
      const periods = period === "both" ? ["midterm", "final"] : [period]
      let allUpdated: GradeRecord[] = []
      for (const gradingPeriod of periods) {
        const res = await fetch("/api/portal/grades/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, gradingPeriod }),
        })
        const json = await res.json()
        if (!res.ok) { toast.error(json.error || `Failed to release ${gradingPeriod} grades.`); return }
        if (json.data?.grades) allUpdated = [...allUpdated, ...json.data.grades]
      }
      if (allUpdated.length > 0) {
        const updatedMap = new Map(allUpdated.map((g: GradeRecord) => [g.studentId, g]))
        setGrades((prev) => prev.map((g) => updatedMap.get(g.studentId) ?? g))
      }
      toast.success("Grades released successfully.")
    } catch {
      toast.error("Failed to release grades.")
    }
  }

  async function handleStudentRelease(studentId: string, period: "midterm" | "final", action: "release" | "unrelease", reason?: string) {
    if (!classId) return
    try {
      const res = await fetch("/api/portal/grades/student-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId, period, action, reason }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Failed to update release status."); return }
      if (json.data) {
        setGrades((prev) => prev.map((g) => g.studentId === studentId ? { ...g, ...json.data } : g))
      }
      toast.success(action === "unrelease" ? "Grades unreleased." : "Grades re-released.")
    } catch {
      toast.error("Failed to update release status.")
    }
  }

  async function handleExport() {
    if (!classId) return
    const res = await fetch(`/api/portal/grades/export?classId=${classId}`)
    if (!res.ok) { toast.error("Failed to export."); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `grades-${classId}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAddColumn(name: string, category: string, maxScore: number, gradingPeriod?: string) {
    const period = gradingPeriod || (activeTab === "summary" ? "midterm" : activeTab)
    try {
      const res = await fetch("/api/portal/grades/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name, category, maxScore, gradingPeriod: period }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Failed to add column."); return }
      setGradeColumns([...gradeColumns, json.data as GradeColumn])
      toast.success(`Column "${name}" added.`)
    } catch { toast.error("Failed to add column.") }
  }

  async function handleRenameColumn(newName: string) {
    if (!selectedColName) return
    const col = findGradeColumnBySelection(gradeColumns, selectedColName)
    if (!col) return
    try {
      const res = await fetch(`/api/portal/grades/columns/${col.id}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
      if (!res.ok) { toast.error("Failed to rename column."); return }
      setGradeColumns(gradeColumns.map((c) =>
        c.id === col.id ? { ...c, name: newName, displayName: newName } : c
      ))
      toast.success(`Column renamed to "${newName}".`)
    } catch { toast.error("Failed to rename column.") }
  }

  async function deleteGradeColumnById(colId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/portal/grades/columns/${colId}`, { method: "DELETE" })
      return res.ok
    } catch { return false }
  }

  async function handleDeleteColumn() {
    if (!selectedColName) return
    const col = findGradeColumnBySelection(gradeColumns, selectedColName)
    if (!col) return
    const ok = await deleteGradeColumnById(col.id)
    if (!ok) { toast.error("Failed to delete column."); return }
    setGradeColumns(gradeColumns.filter((c) => c.id !== col.id))
    const keysToRemove = new Set([col.name, scoreKey(col)])
    setGrades((prev) => prev.map((grade) => {
      const scores = { ...(grade.scores ?? {}) }
      for (const key of keysToRemove) delete scores[key]
      return { ...grade, scores, updatedAt: new Date().toISOString() }
    }))
    toast.success(`Column "${gradeColumnLabel(col, selectedColName)}" deleted.`)
    setDeleteColOpen(false)
  }

  async function handleDeleteOtherCategory(catName: string) {
    const ids = otherColsRef.current.get(catName)
    if (!ids?.length) return
    const colsToDelete = gradeColumns.filter((c) => ids.includes(c.id))
    let successCount = 0
    const deletedIds: string[] = []
    for (const col of colsToDelete) {
      if (await deleteGradeColumnById(col.id)) {
        successCount++
        deletedIds.push(col.id)
      }
    }
    setGradeColumns(gradeColumns.filter((c) => !deletedIds.includes(c.id)))
    const scoreKeysToRemove = new Set(colsToDelete.flatMap((col) => [col.name, scoreKey(col)]))
    setGrades((prev) => prev.map((grade) => {
      const scores = { ...(grade.scores ?? {}) }
      for (const key of scoreKeysToRemove) delete scores[key]
      return { ...grade, scores, updatedAt: new Date().toISOString() }
    }))
    if (successCount > 0) {
      toast.success(`${successCount} "${catName}" column(s) deleted.`)
    } else {
      toast.error("Failed to delete columns.")
    }
  }
  function handleImportComplete() {
    if (!classId) return
    fetch(`/api/portal/grades/class/${classId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.grades) setGrades(json.data.grades)
        if (json.data?.columns) setGradeColumns(json.data.columns)
      })
      .catch(() => {})
  }

  function handleToolbarAction(action: ToolbarAction) {
    switch (action) {
      case "addColumn": setAddColumnOpen(true); break
      case "renameColumn": {
        const focused = gridRef.current?.api.getFocusedCell()
        if (focused) {
          const colDef = focused.column.getColDef()
          if (colDef.colId?.startsWith("score_")) {
            setSelectedColName(colDef.colId.replace("score_", ""))
            setRenameOpen(true)
          } else { toast.info("Focus a grade column to rename.") }
        } else { toast.info("Click a grade column first, then rename.") }
        break
      }
      case "deleteColumn": {
        const focused = gridRef.current?.api.getFocusedCell()
        if (focused) {
          const colDef = focused.column.getColDef()
          if (colDef.colId?.startsWith("score_")) {
            setSelectedColName(colDef.colId.replace("score_", ""))
            setDeleteColOpen(true)
          } else { toast.info("Focus a grade column to delete.") }
        } else { toast.info("Click a grade column first, then delete.") }
        break
      }
      case "undo": {
        undoManager.current.undo()
        toast.info("Undo applied.")
        break
      }
      case "redo": {
        undoManager.current.redo()
        toast.info("Redo applied.")
        break
      }
      case "import": setImportOpen(true); break
      case "export": handleExport(); break
      case "refresh": handleRefresh(); break
      case "save": autoSave.saveNow({ grades: Array.from(gradeMap.values()), cid: classId, showToast: true }).then().catch(() => {}); break
    }
  }

  const effectiveScheme = gradingScheme

  useEffect(() => { setDismissedOther(false) }, [effectiveScheme])

  const catWeightMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!effectiveScheme) return map
    for (const comp of effectiveScheme.components) {
      for (const cat of comp.categories) map.set(cat.name.toLowerCase(), cat.weight)
    }
    for (const lab of effectiveScheme.labComponents ?? []) {
      for (const cat of lab.categories) map.set(cat.name.toLowerCase(), cat.weight)
    }
    return map
  }, [effectiveScheme])

  const compWeightMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!effectiveScheme) return map
    for (const comp of effectiveScheme.components) map.set(comp.name, comp.weight)
    for (const lab of effectiveScheme.labComponents ?? []) map.set(lab.name, lab.weight)
    return map
  }, [effectiveScheme])

  const handleUpdateMaxScore = useCallback(async (colName: string, newMaxScore: number) => {
    const col = findGradeColumnBySelection(gradeColumns, colName)
    if (!col || col.maxScore === newMaxScore) return
    try {
      const res = await fetch(`/api/portal/grades/columns/${col.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxScore: newMaxScore }),
      })
      if (!res.ok) { toast.error("Failed to update max score."); return }
      setGradeColumns(gradeColumns.map((c) =>
        c.id === col.id ? { ...c, maxScore: newMaxScore } : c
      ))
      toast.success(`Max score for "${col.displayName || col.name}" updated to ${newMaxScore}.`)
    } catch { toast.error("Failed to update max score.") }
  }, [gradeColumns])

  function handleRefresh() {
    if (!classId) return
    toast.info("Refreshing grade data…")
    fetch(`/api/portal/grades/class/${classId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.grades) setGrades(json.data.grades)
        if (json.data?.columns) setGradeColumns(json.data.columns)
        toast.success("Grade data refreshed.")
      })
      .catch(() => toast.error("Failed to refresh."))
  }

  const columnCategories = useMemo(() => {
    const cats = new Set<string>()
    if (effectiveScheme) {
      for (const comp of effectiveScheme.components) {
        for (const cat of comp.categories) cats.add(cat.name)
      }
      for (const lab of effectiveScheme.labComponents ?? []) {
        for (const cat of lab.categories) cats.add(cat.name)
      }
    }
    return Array.from(cats)
  }, [effectiveScheme])

  const livePreviewData = useMemo(() => {
    if (!effectiveScheme || activeTab === "summary") return null
    return gridData.map((row) => {
      const grade = gradeMap.get(row.studentId)
      const result = computeLivePreview({
        scores: row.scores,
        columns: filteredColumns,
        assessments: periodAssessments,
        studentId: row.studentId,
        components: effectiveScheme.components,
        labComponents: effectiveScheme.labComponents,
        subjectType: effectiveScheme.subjectType,
        lectureWeight: effectiveScheme.lectureWeight,
        laboratoryWeight: effectiveScheme.laboratoryWeight,
        midtermGrade: activeTab === "final" ? (grade?.midtermGrade ?? row.midtermGrade) : undefined,
        period: activeTab === "midterm" ? "midterm" : "final",
      })
      return {
        studentId: row.studentId,
        classStanding: result.classStanding,
        examGrade: result.examGrade,
        lectureGrade: result.lectureGrade,
        laboratoryGrade: result.laboratoryGrade,
        periodGrade: result.periodGrade,
        categoryGrades: result.categoryGrades.map((cg) => ({
          category: cg.category,
          totalStudentScore: cg.totalStudentScore,
          totalPossibleScore: cg.totalPossibleScore,
          percentageScore: cg.percentageScore,
          weightedScore: cg.weightedScore,
        })),
      }
    })
  }, [gridData, effectiveScheme, filteredColumns, periodAssessments, activeTab, gradeMap])

  useEffect(() => {
    const map = new Map(livePreviewData?.map((e) => [e.studentId, e]) ?? [])
    setLiveData(map)
  }, [livePreviewData])

  const colDefs = useMemo((): (ColDef | ColGroupDef)[] => {
    const saved = columnWidths

    if (activeTab === "summary") {
      return [
        { headerName: "No.", field: "no", width: saved["no"] ?? 60, sortable: true, filter: false, cellStyle: { textAlign: "center" }, pinned: "left" },
        { headerName: "Student Name", field: "studentName", width: saved["studentName"] ?? 220, sortable: true, filter: "agTextColumnFilter", pinned: "left" },
        { headerName: "Midterm Grade", field: "midtermGrade", width: 130, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 600 } },
        { headerName: "Mid. Remarks", field: "midtermRemarks", colId: "midtermRemarks", width: 150, sortable: true, filter: "agTextColumnFilter",
          cellRenderer: RemarksDropdownRenderer },
        { headerName: "Tentative Final", field: "finalGrade", width: 130, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => {
            const row = params.data as StudentGradeRow
            const grade = gradeMapRef.current.get(row.studentId)
            return fmtNum(grade?.tentativeFinalGrade)
          }, cellStyle: { fontWeight: 600 } },
        { headerName: "Fin. Remarks", field: "finalRemarks", colId: "finalRemarks", width: 150, sortable: true, filter: "agTextColumnFilter",
          cellRenderer: RemarksDropdownRenderer },
        { headerName: "Percentile", width: 120, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => {
            const row = params.data as StudentGradeRow
            const grade = gradeMapRef.current.get(row.studentId)
            return fmtNum(grade?.finalGrade ?? grade?.tentativeFinalGrade)
          }, cellStyle: { fontWeight: 700 } },
        { headerName: "Final Rating", width: 120, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => {
            const row = params.data as StudentGradeRow
            const grade = gradeMapRef.current.get(row.studentId)
            const n = Number(grade?.finalGrade ?? grade?.tentativeFinalGrade)
            return isNaN(n) ? "" : n.toFixed(0)
          }, cellStyle: { fontWeight: 700 } },
        { headerName: "Transmuted", width: 120, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => {
            const row = params.data as StudentGradeRow
            const grade = gradeMapRef.current.get(row.studentId)
              return fmtNum(grade?.transmutedGrade ?? grade?.finalTransmuted)
            }, cellStyle: { fontWeight: 700 } },
          {
          headerName: "Release", marryChildren: true,
          headerClass: "ag-component-group-header",
          children: [
            { headerName: "Mid", colId: "midtermReleaseStatus", width: 100, sortable: true, filter: "agTextColumnFilter",
              valueGetter: (params) => {
                const row = params.data as StudentGradeRow
                const history = row.midtermReleaseHistory ?? []
                const lastAction = history.length > 0 ? history[history.length - 1].action : null
                if (row.midtermReleased && lastAction === "re-released") return "Re-released"
                if (row.midtermReleased) return "Released"
                return "Unreleased"
              },
              cellRenderer: ReleaseCellRenderer,
              onCellClicked: (params) => {
                const row = params.data as StudentGradeRow
                setStudentReleaseTarget({ studentId: row.studentId, studentName: row.studentName, period: "midterm", alreadyReleased: !!row.midtermReleased })
                setStudentReleaseOpen(true)
              },
            },
            { headerName: "Final", colId: "finalReleaseStatus", width: 100, sortable: true, filter: "agTextColumnFilter",
              valueGetter: (params) => {
                const row = params.data as StudentGradeRow
                const history = row.finalReleaseHistory ?? []
                const lastAction = history.length > 0 ? history[history.length - 1].action : null
                if (row.finalReleased && lastAction === "re-released") return "Re-released"
                if (row.finalReleased) return "Released"
                return "Unreleased"
              },
              cellRenderer: ReleaseCellRenderer,
              onCellClicked: (params) => {
                const row = params.data as StudentGradeRow
                setStudentReleaseTarget({ studentId: row.studentId, studentName: row.studentName, period: "final", alreadyReleased: !!row.finalReleased })
                setStudentReleaseOpen(true)
              },
            },
          ],
        },
      ]
    }

    const cols: (ColDef | ColGroupDef)[] = [
      { headerName: "No.", field: "no", width: saved["no"] ?? 60, sortable: true, filter: false, cellStyle: { textAlign: "center" }, pinned: "left" },
      { headerName: "Student Name", field: "studentName", width: saved["studentName"] ?? 220, sortable: true, filter: "agTextColumnFilter", pinned: "left" },
    ]

    const catColDefs = new Map<string, ColDef[]>()
    const catToColIds = new Map<string, string[]>()
    for (const col of filteredColumns) {
      const colId = `score_${scoreKey(col)}`
      const colDef: ColDef = {
        headerName: col.displayName || col.name,
        headerTooltip: `${col.category} (${findCategoryWeight(col.category, catWeightMap) ?? "?"}%) — max ${col.maxScore}`,
        colId,
        width: saved[colId] ?? col.width ?? 120,
        sortable: true,
        filter: "agNumberColumnFilter",
        editable: (params) => {
          if (!isEditable) return false
          return true
        },
        valueGetter: (params) => {
          const row = params.data as StudentGradeRow
          return row.scores?.[scoreKey(col)] ?? ""
        },
        valueSetter: (params) => {
          const row = params.data as StudentGradeRow
          const val = params.newValue
          const num = val === "" || val === null || val === undefined ? 0 : Number(val)
          row.scores = { ...row.scores, [scoreKey(col)]: isNaN(num) ? 0 : num }
          return true
        },
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, max: col.maxScore, precision: 2 },
      }
      let catKey = col.category
      if (catKey === "Performance/Recitation") catKey = "Performance"
      if (catKey === "Lec Attendance" || catKey === "Lecture Attendance") catKey = "Attendance"
      if (catKey === "Assignment") catKey = "Assignments"
      if (effectiveScheme) {
        for (const comp of effectiveScheme.components) {
          for (const cat of comp.categories) {
            if (gradeCategoryMatches(cat.name, catKey)) { catKey = cat.name; break }
          }
        }
        for (const lab of effectiveScheme.labComponents ?? []) {
          for (const cat of lab.categories) {
            if (gradeCategoryMatches(cat.name, catKey)) { catKey = cat.name; break }
          }
        }
      }
      if (!catColDefs.has(catKey)) catColDefs.set(catKey, [])
      catColDefs.get(catKey)!.push(colDef)
      if (!catToColIds.has(catKey)) catToColIds.set(catKey, [])
      catToColIds.get(catKey)!.push(col.id)
    }

    // Ensure all scheme categories appear as groups even when no columns exist
    if (effectiveScheme) {
      for (const comp of effectiveScheme.components) {
        for (const cat of comp.categories) {
          if (!catColDefsHas(catColDefs, cat.name)) {
            catColDefs.set(cat.name, [{
              headerName: "",
              colId: `spacer_${cat.name}`,
              width: 20,
              editable: false,
              sortable: false,
              filter: false,
              cellStyle: { backgroundColor: "transparent", cursor: "default" },
            }])
          }
        }
      }
      for (const lab of effectiveScheme.labComponents ?? []) {
        for (const cat of lab.categories) {
          if (!catColDefsHas(catColDefs, cat.name)) {
            catColDefs.set(cat.name, [{
              headerName: "",
              colId: `spacer_${cat.name}`,
              width: 20,
              editable: false,
              sortable: false,
              filter: false,
              cellStyle: { backgroundColor: "transparent", cursor: "default" },
            }])
          }
        }
      }
    }

    const CAT_COLORS = ["ag-cat-blue", "ag-cat-green", "ag-cat-orange", "ag-cat-purple", "ag-cat-cyan", "ag-cat-rose"] as const

    const compCatGroups = new Map<string, ColGroupDef[]>()
    let catColorIdx = 0
    for (const [catName, colDefs] of catColDefs) {
      const compName = (() => {
        if (!effectiveScheme) return "Other"
        for (const comp of effectiveScheme.components) {
          for (const cat of comp.categories) {
            if (gradeCategoryMatches(cat.name, catName)) return comp.name
          }
        }
        for (const lab of effectiveScheme.labComponents ?? []) {
          for (const cat of lab.categories) {
            if (gradeCategoryMatches(cat.name, catName)) return lab.name
          }
        }
        return "Other"
      })()
      if (!compCatGroups.has(compName)) compCatGroups.set(compName, [])
      const catWt = findCategoryWeight(catName, catWeightMap)
      const catKey = catName.toLowerCase().replace(/[^a-z0-9]/g, "")
      const comp = effectiveScheme?.components.find(c => c.name === compName)
        ?? effectiveScheme?.labComponents?.find(c => c.name === compName)
      const matchedCat = comp?.categories.find(c => gradeCategoryMatches(c.name, catName))
      const isAttendance = matchedCat?.isAttendance ?? (catKey.includes("attendance") || catKey.includes("attend"))
      const absenceCatKey = matchedCat
        ? matchedCat.name.toLowerCase().replace(/[^a-z0-9]/g, "")
        : catKey

      let children: (ColDef | ColGroupDef)[]
      if (isAttendance) {
        const absencesColDef: ColDef = {
          headerName: activeTab === "midterm" ? "Mid Absences" : "Fin Absences",
          colId: `absences_${activeTab}_${matchedCat?.name ?? catName}`,
          width: saved[`absences_${activeTab}_${matchedCat?.name ?? catName}`] ?? 100,
          sortable: true,
          filter: "agNumberColumnFilter",
          editable: (params) => {
            if (!isEditable) return false
            return true
          },
          valueGetter: (params) => {
            const row = params.data as StudentGradeRow
            return row.scores?.[`${activeTab}_absences_${absenceCatKey}`] ?? ""
          },
          valueSetter: (params) => {
            const row = params.data as StudentGradeRow
            const val = params.newValue
            const num = val === "" || val === null || val === undefined ? 0 : Number(val)
            row.scores = { ...row.scores, [`${activeTab}_absences_${absenceCatKey}`]: isNaN(num) ? 0 : num }
            return true
          },
          cellEditor: "agNumberCellEditor",
          cellEditorParams: { min: 0, max: 100, precision: 0 },
          cellStyle: { backgroundColor: "color-mix(in srgb, var(--destructive), transparent 85%)" },
        }
        const scoreColDef: ColDef = {
          headerName: "Score",
          colId: `attendance_score_${catName}`,
          width: saved[`attendance_score_${catName}`] ?? 90,
          sortable: true,
          filter: "agNumberColumnFilter",
          editable: false,
          valueGetter: (params) => {
            const row = params.data as StudentGradeRow
            const preview = liveData.get(row.studentId)
            if (!preview?.categoryGrades) return ""
            const match = preview.categoryGrades.find((cg) => gradeCategoryMatches(catName, cg.category))
            return match?.totalStudentScore ?? ""
          },
          cellStyle: { backgroundColor: "color-mix(in srgb, var(--accent), transparent 75%)" },
        }
        children = [absencesColDef, scoreColDef]
      } else {
        const isExam = comp?.isExam ?? compName.toLowerCase().includes("exam")
        const examContribColDef: ColDef = {
          headerName: "40%",
          colId: `exam_contrib_${catName}`,
          width: saved[`exam_contrib_${catName}`] ?? 70,
          sortable: true,
          filter: "agNumberColumnFilter",
          editable: false,
          valueGetter: (params) => {
            const row = params.data as StudentGradeRow
            const preview = liveData.get(row.studentId)
            if (!preview) return ""
            return preview.examGrade != null ? preview.examGrade * 0.4 : ""
          },
          valueFormatter: (params) => params.value == null ? "" : Number(params.value).toFixed(2),
          cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 70%)" },
        }
        const psColDef: ColDef = {
          headerName: "PS",
          colId: `ps_${catName}`,
          width: saved[`ps_${catName}`] ?? 70,
          sortable: true,
          filter: "agNumberColumnFilter",
          editable: false,
          valueGetter: (params) => {
            const row = params.data as StudentGradeRow
            const preview = liveData.get(row.studentId)
            if (!preview?.categoryGrades) return ""
            const match = preview.categoryGrades.find((cg) => gradeCategoryMatches(catName, cg.category))
            return match?.totalStudentScore ?? ""
          },
          cellStyle: { backgroundColor: "color-mix(in srgb, var(--accent), transparent 75%)" },
        }
        const wsColDef: ColDef = {
          headerName: "WS",
          colId: `ws_${catName}`,
          width: saved[`ws_${catName}`] ?? 70,
          sortable: true,
          filter: "agNumberColumnFilter",
          editable: false,
          valueGetter: (params) => {
            const row = params.data as StudentGradeRow
            const preview = liveData.get(row.studentId)
            if (!preview?.categoryGrades) return ""
            const match = preview.categoryGrades.find((cg) => gradeCategoryMatches(catName, cg.category))
            return match?.weightedScore ?? ""
          },
          valueFormatter: (params) => params.value == null ? "" : Number(params.value).toFixed(2),
          cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 70%)" },
        }
        const extraCols = isExam ? [examContribColDef] : [psColDef, wsColDef]
        children = [...colDefs, ...extraCols]
      }
      compCatGroups.get(compName)!.push({
        headerName: catWt != null ? `${catName} (${catWt}%)` : catName,
        headerClass: `ag-category-group-header ${CAT_COLORS[catColorIdx % CAT_COLORS.length]}`,
        marryChildren: true,
        children,
      })
      catColorIdx++
    }

    for (const [compName, catGroups] of compCatGroups) {
      const schemeComp = effectiveScheme?.components.find((c) => c.name === compName)
        ?? effectiveScheme?.labComponents?.find((c) => c.name === compName)
      if (schemeComp) {
        const order = new Map(schemeComp.categories.map((c, i) => [c.name.toLowerCase(), i]))
        catGroups.sort((a, b) => {
          const aName = (a.headerName as string).replace(/\s*\(.*?\)\s*$/, "").trim().toLowerCase()
          const bName = (b.headerName as string).replace(/\s*\(.*?\)\s*$/, "").trim().toLowerCase()
          const aIdx = Array.from(order.entries()).find(([k]) => gradeCategoryMatches(k, aName))?.[1]
          const bIdx = Array.from(order.entries()).find(([k]) => gradeCategoryMatches(k, bName))?.[1]
          if (aIdx === undefined && bIdx === undefined) return 0
          if (aIdx === undefined) return 1
          if (bIdx === undefined) return -1
          return aIdx - bIdx
        })
      }
    }

    const otherCols = new Map<string, string[]>()
    const otherGroups = compCatGroups.get("Other")
    if (otherGroups) {
      for (const group of otherGroups) {
        const rawName = (group.headerName as string).replace(/\s*\(.*?\)\s*$/, "").trim()
        const ids = catToColIds.get(rawName) ?? []
        if (ids.length > 0) otherCols.set(rawName, ids)
      }
    }
    otherColsRef.current = otherCols

      const lectureColDef: ColDef = {
        headerName: "Lecture Grade", width: saved["lectureGrade"] ?? 130, sortable: true, filter: "agNumberColumnFilter",
       valueGetter: (params) => {
         const row = params.data as StudentGradeRow
         const preview = liveData.get(row.studentId)
         return preview?.lectureGrade ?? ""
       }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 50%)" },
     }
     const labGradeColDef: ColDef = {
       headerName: "Lab Grade", width: saved["labGrade"] ?? 130, sortable: true, filter: "agNumberColumnFilter",
       valueGetter: (params) => {
         const row = params.data as StudentGradeRow
         const preview = liveData.get(row.studentId)
         return preview?.laboratoryGrade ?? ""
       }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 50%)" },
     }

    for (const [compName, catGroups] of compCatGroups) {
      const compWt = compWeightMap.get(compName)
      cols.push({
        headerName: compWt != null ? `${compName} (${compWt}%)` : compName,
        headerClass: "ag-component-group-header",
        marryChildren: true,
        children: catGroups,
      })
    }

    cols.push(lectureColDef)
    if (effectiveScheme?.subjectType === "Lecture with Lab") {
      cols.push(labGradeColDef)
    }
    cols.push(
      { headerName: activeTab === "midterm" ? "Midterm Grade" : "Final Period Grade", field: "livePeriodGrade", width: saved["livePeriodGrade"] ?? 130, sortable: true, filter: "agNumberColumnFilter",
        valueGetter: (params) => {
          const row = params.data as StudentGradeRow
           const preview = liveData.get(row.studentId)
           return preview?.periodGrade ?? ""
         }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 700 } },
      { headerName: activeTab === "midterm" ? "Mid Transmuted" : "Final Transmuted", width: saved[activeTab === "midterm" ? "midtermTransmuted" : "finalTransmuted"] ?? 120, sortable: true, filter: "agNumberColumnFilter",
        valueGetter: (params) => {
          const row = params.data as StudentGradeRow
          const preview = liveData.get(row.studentId)
          const grade = preview?.periodGrade
          if (grade == null || grade <= 0) return ""
          return transmuteGrade(grade)
        }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 700 } },
      { headerName: "Remarks", field: activeTab === "midterm" ? "midtermRemarks" : "finalRemarks", colId: activeTab === "midterm" ? "midtermRemarks" : "finalRemarks", width: saved["remarks"] ?? 150, sortable: true, filter: "agTextColumnFilter",
        cellRenderer: RemarksDropdownRenderer },
      {
        headerName: "Release", marryChildren: true,
        headerClass: "ag-component-group-header",
        children: [
          {
            headerName: "Midterm", colId: "midtermReleaseStatus", width: 120, sortable: true, filter: "agTextColumnFilter",
            valueGetter: (params) => {
              const row = params.data as StudentGradeRow
              const history = row.midtermReleaseHistory ?? []
              const lastAction = history.length > 0 ? history[history.length - 1].action : null
              if (row.midtermReleased && lastAction === "re-released") return "Re-released"
              if (row.midtermReleased) return "Released"
              return "Unreleased"
            },
            cellRenderer: ReleaseCellRenderer,
            onCellClicked: (params) => {
              const row = params.data as StudentGradeRow
              setStudentReleaseTarget({ studentId: row.studentId, studentName: row.studentName, period: "midterm", alreadyReleased: !!row.midtermReleased })
              setStudentReleaseOpen(true)
            },
          },
          {
            headerName: "Final", colId: "finalReleaseStatus", width: 120, sortable: true, filter: "agTextColumnFilter",
            valueGetter: (params) => {
              const row = params.data as StudentGradeRow
              const history = row.finalReleaseHistory ?? []
              const lastAction = history.length > 0 ? history[history.length - 1].action : null
              if (row.finalReleased && lastAction === "re-released") return "Re-released"
              if (row.finalReleased) return "Released"
              return "Unreleased"
            },
            cellRenderer: ReleaseCellRenderer,
            onCellClicked: (params) => {
              const row = params.data as StudentGradeRow
              setStudentReleaseTarget({ studentId: row.studentId, studentName: row.studentName, period: "final", alreadyReleased: !!row.finalReleased })
              setStudentReleaseOpen(true)
            },
          },
        ],
      },
    )

    return cols
  }, [filteredColumns, isEditable, activeTab, catWeightMap, compWeightMap, handleUpdateMaxScore, columnWidths, effectiveScheme, liveData])

  const theme = useMemo(() => {
    return themeAlpine.withParams({
      fontFamily: "inherit",
      fontSize: 13,
      headerFontWeight: 600,

      backgroundColor: "var(--card)",
      foregroundColor: "var(--foreground)",
      textColor: "var(--foreground)",
      cellTextColor: "var(--foreground)",
      dataBackgroundColor: "var(--card)",

      borderColor: "var(--border)",
      wrapperBorder: { color: "var(--border)", width: 1, style: "solid" },
      rowBorder: { color: "var(--border)", width: 1, style: "solid" },
      columnBorder: { color: "var(--border)", width: 1, style: "solid" },
      headerColumnBorder: { color: "var(--border)", width: 1, style: "solid" },
      pinnedColumnBorder: { color: "var(--border)", width: 2, style: "solid" },

      headerBackgroundColor: "var(--muted)",
      headerTextColor: "var(--foreground)",
      headerCellHoverBackgroundColor: darkMode ? "color-mix(in srgb, var(--muted), white 8%)" : "color-mix(in srgb, var(--muted), black 8%)",

      rowHoverColor: "color-mix(in srgb, var(--muted), transparent 50%)",
      oddRowBackgroundColor: "color-mix(in srgb, var(--muted), transparent 70%)",
      selectedRowBackgroundColor: "color-mix(in srgb, var(--primary), transparent 85%)",

      accentColor: "var(--primary)",
      focusShadow: { radius: 0, spread: 2, color: "var(--ring)" },

      borderRadius: 8,
      wrapperBorderRadius: 12,

      iconColor: "var(--foreground)",
      iconButtonColor: "var(--foreground)",

      chromeBackgroundColor: "var(--muted)",

      cellEditingBorder: { color: "var(--ring)", width: 2, style: "solid" },

      cellHorizontalPadding: 12,

      browserColorScheme: darkMode ? "dark" : "light",
    })
  }, [darkMode])

  const schemeInfo = useMemo(() => {
    if (!effectiveScheme) return null
    const totalComp = effectiveScheme.components.reduce((s, c) => s + c.weight, 0)
    return { totalComp, ...effectiveScheme }
  }, [effectiveScheme])

  const selectedColumnLabel = gradeColumnLabel(
    findGradeColumnBySelection(gradeColumns, selectedColName),
    selectedColName
  )

  const [schemeOpen, setSchemeOpen] = useState(false)

  const SchemeInfoBanner = useCallback(() => {
    if (!schemeInfo) return null
    const { subjectType, components, labComponents, lectureWeight, laboratoryWeight } = schemeInfo
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <button type="button" onClick={() => setSchemeOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted/20">
          <ChevronDown className={`size-3.5 transition-transform ${schemeOpen ? "rotate-0" : "-rotate-90"}`} />
          Grading Scheme
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">{subjectType}</span>
        </button>
        {schemeOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="space-y-3">
              {components.map((comp) => {
                const catSum = comp.categories.reduce((s, cat) => s + cat.weight, 0)
                return (
                  <div key={comp.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{comp.name}</span>
                      <span className="text-xs font-medium text-muted-foreground">({comp.weight}%)</span>
                      <span className={`ml-auto text-xs font-medium ${catSum === 100 ? "text-emerald-500" : "text-red-500"}`}>
                        {catSum}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {comp.categories.map((cat) => (
                        <span key={cat.name} className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                          {cat.name}
                          <span className="font-semibold text-foreground">{cat.weight}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {subjectType === "Lecture with Lab" && labComponents && (
              <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                Lecture <span className="font-semibold text-foreground">{lectureWeight}%</span> &middot; Lab <span className="font-semibold text-foreground">{laboratoryWeight}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }, [schemeInfo, schemeOpen])

  const tabLabels: { key: TabKey; label: string }[] = [
    { key: "midterm", label: "Midterm" },
    { key: "final", label: "Final" },
    { key: "summary", label: "Summary" },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card px-4 py-5 text-center shadow-sm sm:px-6 sm:py-6">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
          {selectedSubject.split(" - ")[0]?.trim()}{selectedSubject.includes(" - ") ? ": " : ""}{selectedSubject.split(" - ")[1]?.trim() ?? selectedSubject}
        </h2>
        {scheduleInfo.section && (
          <p className="mt-2 text-sm font-semibold text-muted-foreground sm:text-base">{scheduleInfo.section}</p>
        )}
        {scheduleInfo.instructor && (
          <p className="mt-1.5 text-xs text-muted-foreground/60 sm:text-sm"><span className="font-medium">Faculty:</span> {scheduleInfo.instructor}</p>
        )}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
            activeTab === "midterm"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : activeTab === "final"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          }`}>
            {(() => {
            const active = (model.semesters as Array<{ semester: string; schoolYearStart: number; schoolYearEnd: number; status: string }>)?.find((s) => s.status === "Active")
            const semLabel = active?.semester === "First Semester" ? "1st Semester" : active?.semester === "Second Semester" ? "2nd Semester" : active?.semester ?? ""
            const sy = active ? `${active.schoolYearStart}-${active.schoolYearEnd}` : ""
            const label = activeTab === "midterm" ? "Midterm" : activeTab === "final" ? "Finals" : "Midterm and Finals"
            return sy ? `${label} | ${semLabel}, S.Y. ${sy}` : label
          })()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Search students..." className="h-9 rounded-xl pl-9 text-sm" />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {tabLabels.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={activeTab === key ? "default" : "ghost"}
            onClick={() => setActiveTab(key)}
            className={`rounded-lg flex-1 ${activeTab === key ? "shadow-sm ring-1 ring-primary/50 font-semibold" : ""}`}
          >
            {label}
          </Button>
        ))}
      </div>

      <SchemeInfoBanner />

      {otherColsRef.current.size > 0 && !dismissedOther && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Unrecognized categories — not in current scheme:
            </span>
            <Button size="sm" variant="ghost" className="ms-auto h-6 w-6 shrink-0 p-0" onClick={() => setDismissedOther(true)}>
              <X className="size-3" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from(otherColsRef.current.entries()).map(([catName, colIds]) => (
              <Button key={catName} size="sm" variant="outline"
                className="h-7 border-destructive/50 text-xs text-destructive"
                onClick={() => handleDeleteOtherCategory(catName)}>
                × {catName} ({colIds.length})
              </Button>
            ))}
          </div>
        </div>
      )}

      <SpreadsheetToolbar
        onAction={handleToolbarAction}
        canUndo={undoManager.current.canUndo}
        canRedo={undoManager.current.canRedo}
        columnCount={filteredColumns.length}
        saveStatus={saveStatus}
      />

      <div className="rounded-xl border border-border shadow-sm" style={{ width: "100%" }}>
          <AgGridReact
            ref={gridRef}
            rowData={gridData}
            columnDefs={colDefs}
            domLayout="autoHeight"
            suppressHorizontalScroll={true}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            cellStyle: { display: "flex", alignItems: "center" },
          }}
          theme={theme}
          getRowId={(params) => params.data.studentId}
          getRowStyle={(params) => {
            const q = studentQuery?.toLowerCase().trim()
            if (!q) return undefined
            const name = params.data.studentName?.toLowerCase() ?? ""
            return name.includes(q)
              ? { backgroundColor: "rgba(251, 191, 36, 0.12)" }
              : undefined
          }}
          animateRows
          onCellValueChanged={onCellValueChanged}
          onGridReady={onGridReady}
          onColumnResized={onColumnResized}
          onColumnHeaderClicked={onColumnHeaderClicked}
          suppressClickEdit
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          enableCellTextSelection
          ensureDomOrder
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Button size="default" variant="default" onClick={async () => {
          let gradesToSave: GradeRecord[] = Array.from(gradeMap.values())
          if (activeTab !== "summary") {
            const period = activeTab === "midterm" ? "midterm" : "final"
            gradesToSave = gradesToSave.map((g) => {
              const result = computeLivePreview({
                scores: g.scores || {},
                columns: filteredColumns,
                assessments: periodAssessments,
                studentId: g.studentId,
                components: effectiveScheme?.components || [],
                labComponents: effectiveScheme?.labComponents,
                subjectType: effectiveScheme?.subjectType || "Lecture",
                lectureWeight: effectiveScheme?.lectureWeight,
                laboratoryWeight: effectiveScheme?.laboratoryWeight,
                midtermGrade: period === "final" ? (g.midtermGrade ?? undefined) : undefined,
                period,
              })
              const updated = { ...g, categoryGrades: result.categoryGrades, updatedAt: new Date().toISOString() } as GradeRecord & Record<string, unknown>
              if (period === "midterm") {
                updated.midtermClassStanding = result.classStanding
                updated.midtermExam = result.examGrade
                updated.midtermGrade = result.periodGrade
                updated.midtermTransmuted = transmuteGrade(result.periodGrade)
                updated.lectureGrade = result.lectureGrade
                if (result.laboratoryGrade !== undefined) updated.midtermLaboratoryGrade = result.laboratoryGrade
              } else {
                updated.finalClassStanding = result.classStanding
                updated.finalExam = result.examGrade
                updated.tentativeFinalGrade = result.periodGrade
                updated.finalTransmuted = transmuteGrade(result.periodGrade)
                if (result.laboratoryGrade !== undefined) updated.finalLaboratoryGrade = result.laboratoryGrade
                if (result.finalGrade !== undefined) { updated.finalGrade = result.finalGrade; updated.transmutedGrade = result.transmutedGrade }
              }
              return updated
            })
            setGrades((prev) => prev.map((g) => gradesToSave.find((c) => c.studentId === g.studentId) ?? g))
          }
          await autoSave.saveNow({ grades: gradesToSave, cid: classId, showToast: true })
        }} className="rounded-lg shadow-sm">
          <Save className="size-4" /> Save
        </Button>
        <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />

        <Button size="default" variant="outline" onClick={() => setReleaseOpen(true)} className="rounded-lg">
          <Megaphone className="size-4" /> Release
        </Button>
      </div>

      <ReleaseDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        onConfirm={handleRelease}
      />
      <EditMaxScoreDialog
        open={maxScoreDialogOpen}
        onOpenChange={setMaxScoreDialogOpen}
        colName={maxScoreColName}
        currentMax={maxScoreCurrent}
        onConfirm={(newMax) => handleUpdateMaxScore(maxScoreColName, newMax)}
      />
      <AddColumnDialog open={addColumnOpen} onOpenChange={setAddColumnOpen}
        onConfirm={(name, cat, max, period) => handleAddColumn(name, cat, max, period)}
        availableCategories={columnCategories}
        defaultPeriod={activeTab === "summary" ? "midterm" : activeTab as "midterm" | "final"} />
      <IntelligentImportDialog open={importOpen} onOpenChange={setImportOpen}
        classId={classId} subject={selectedSubject} onImportComplete={handleImportComplete} />
      <RenameColumnDialog open={renameOpen} onOpenChange={setRenameOpen}
        currentName={selectedColumnLabel} onConfirm={handleRenameColumn} />
      <DeleteColumnDialog open={deleteColOpen} onOpenChange={setDeleteColOpen}
        columnName={selectedColumnLabel} onConfirm={handleDeleteColumn} />

      {studentReleaseTarget && (
        <UndoReleaseDialog
          open={studentReleaseOpen}
          onOpenChange={setStudentReleaseOpen}
          studentName={studentReleaseTarget.studentName}
          period={studentReleaseTarget.period}
          studentId={studentReleaseTarget.studentId}
          alreadyReleased={studentReleaseTarget.alreadyReleased}
          onConfirm={handleStudentRelease}
        />
      )}

    </div>
  )
}
