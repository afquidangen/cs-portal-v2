"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Lock, CheckCircle2, Search, Calculator,
  Send, XCircle, RotateCcw, Save,
} from "lucide-react"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, ColGroupDef, CellValueChangedEvent, ColumnResizedEvent, SelectionChangedEvent, GridReadyEvent, ColumnHeaderClickedEvent } from "ag-grid-community"
import { AllCommunityModule, ModuleRegistry, themeAlpine } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "../modules/types"
import type { GradeRecord, GradeWorkflowStatus, GradeColumn, GradingPeriod, Assessment } from "@/lib/types"
import { useAutoSave, type SaveStatus } from "../../lib/auto-save"
import { computeLivePreview, gradeCategoryMatches } from "../../lib/grade-engine"
import { UndoRedoManager, buildSnapshot } from "../../lib/undo-redo"
import { SpreadsheetToolbar, type ToolbarAction } from "./spreadsheet-toolbar"
import { RenameColumnDialog } from "./rename-column-dialog"
import { DeleteColumnDialog } from "./delete-column-dialog"
import { DeleteRowDialog } from "./delete-row-dialog"
import { AddColumnDialog } from "../modules/add-column-dialog"
import { IntelligentImportDialog } from "./intelligent-import-dialog"
import { TemplateSelector } from "./template-selector"
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

function RemarksCellRenderer(params: { value: string }) {
  const val = params.value
  if (!val) return null
  return <StatusBadge value={val} />
}

function StatusCellRenderer(params: { value: string }) {
  const val = params.value
  if (!val) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      val === "Draft" ? "bg-amber-100 text-amber-700" :
      val === "Submitted" ? "bg-blue-100 text-blue-700" :
      val === "Reviewed" ? "bg-violet-100 text-violet-700" :
      val === "Approved" ? "bg-emerald-100 text-emerald-700" :
      val === "Locked" ? "bg-gray-100 text-gray-700" :
      "bg-muted text-muted-foreground"
    }`}>
      {val === "Locked" ? <Lock className="size-3" /> : null}
      {val === "Approved" ? <CheckCircle2 className="size-3" /> : null}
      {val}
    </span>
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
  finalGrade?: number
  transmutedGrade?: number
  remarks?: string
  workflowStatus: GradeWorkflowStatus
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
  gradingScheme?: { components: Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number }> }>; labComponents?: Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number }> }>; lectureWeight?: number; laboratoryWeight?: number; subjectType: "Lecture" | "Lecture with Lab" } | null
}) {
  const gridRef = useRef<AgGridReact>(null)
  const colStateRef = useRef<Record<string, number>>({})
  const isEditable = model.role === "faculty" || model.role === "admin"

  const [activeTab, setActiveTab] = useState<TabKey>("midterm")
  const [selectedRows, setSelectedRows] = useState<StudentGradeRow[]>([])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [addColumnOpen, setAddColumnOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteColOpen, setDeleteColOpen] = useState(false)
  const [deleteRowOpen, setDeleteRowOpen] = useState(false)
  const [selectedColName, setSelectedColName] = useState("")
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [maxScoreDialogOpen, setMaxScoreDialogOpen] = useState(false)
  const [maxScoreColName, setMaxScoreColName] = useState("")
  const [maxScoreCurrent, setMaxScoreCurrent] = useState(0)

  const undoManager = useRef(new UndoRedoManager())

  const gradeMapRef = useRef(gradeMap)
  const livePreviewDataRef = useRef<LivePreviewEntry[] | null>(null)
  const dataLoadedRef = useRef(false)

  useEffect(() => { gradeMapRef.current = gradeMap }, [gradeMap])

  // Force grid refresh once grade data first becomes available
  useEffect(() => {
    if (gradeMap.size > 0 && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      setTimeout(() => {
        gridRef.current?.api?.refreshCells({ force: true })
      }, 0)
    }
  }, [gradeMap])

  const saveGradeData = useCallback(async (data: unknown) => {
    const { grades: gradeData, cid, showToast } = data as { grades: GradeRecord[]; cid: string; showToast?: boolean }
    const res = await fetch(`/api/portal/grades/class/${cid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grades: gradeData }),
    })
    if (!res.ok) {
      if (showToast) toast.error("Failed to save grades.")
      throw new Error("Failed to save")
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
    return gradeColumns.filter((col) => {
      if (col.gradingPeriod === "both") return true
      return col.gradingPeriod === activeTab
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
      released: false,
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

      setTimeout(() => {
        gridRef.current?.api?.refreshCells({ force: true })
      }, 0)

      autoSave.schedule({ grades: [{ ...grade, scores: updatedScores }], cid: classId })
    }
  }

  function onSelectionChanged(event: SelectionChangedEvent) {
    setSelectedRows(event.api.getSelectedRows() as StudentGradeRow[])
  }

  function onGridReady(event: GridReadyEvent) {
    undoManager.current.clear()
  }

  function onColumnResized(event: ColumnResizedEvent) {
    if (!event.finished) return
    event.api.getColumnState().forEach((col) => {
      colStateRef.current[col.colId] = col.width ?? 0
    })
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

  async function handleUpdateWorkflow(status: GradeWorkflowStatus) {
    if (!classId) return
    const studentIds = selectedRows.length > 0 ? selectedRows.map((r) => r.studentId) : undefined
    try {
      const res = await fetch("/api/portal/grades/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, status, studentIds }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Failed to update status."); return }
      setGrades((prev) =>
        prev.map((g) =>
          (studentIds ? studentIds.includes(g.studentId) : g.classId === classId)
            ? { ...g, workflowStatus: status, released: status === "Approved" || status === "Locked" }
            : g
        )
      )
      toast.success(`Grades ${status.toLowerCase()}.`)
    } catch { toast.error("Failed to update status.") }
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

  async function handleDeleteColumn() {
    if (!selectedColName) return
    const col = findGradeColumnBySelection(gradeColumns, selectedColName)
    if (!col) return
    try {
      const res = await fetch(`/api/portal/grades/columns/${col.id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete column."); return }
      setGradeColumns(gradeColumns.filter((c) => c.id !== col.id))
      const keysToRemove = new Set([col.name, scoreKey(col)])
      setGrades((prev) => prev.map((grade) => {
        const scores = { ...(grade.scores ?? {}) }
        for (const key of keysToRemove) delete scores[key]
        return { ...grade, scores, updatedAt: new Date().toISOString() }
      }))
      toast.success(`Column "${gradeColumnLabel(col, selectedColName)}" deleted.`)
      setDeleteColOpen(false)
    } catch { toast.error("Failed to delete column.") }
  }

  async function handleAddRow() {
    const studentsWithGrade = new Set(gradeMap.keys())
    const ungraded = subjectRoster.find((s) => !studentsWithGrade.has(s.id))
    if (!ungraded) { toast.info("All students already have a grade record."); return }
    ensureGradeRecord(ungraded.id)
    toast.success(`Row added for ${ungraded.name}.`)
  }

  async function handleDeleteRow() {
    if (selectedRows.length === 0) return
    const studentIds = selectedRows.map((r) => r.studentId)
    try {
      const res = await fetch("/api/portal/grades/rows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentIds }),
      })
      if (!res.ok) { toast.error("Failed to delete rows."); return }
      setGrades((prev) => prev.filter((g) => !studentIds.includes(g.studentId)))
      toast.success(`${studentIds.length} row(s) deleted.`)
      setDeleteRowOpen(false)
    } catch { toast.error("Failed to delete rows.") }
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
      case "reorderColumns": {
        const cols = [...gradeColumns]
        const last = cols.pop()
        if (last) setGradeColumns([last, ...cols])
        else toast.info("No columns to reorder.")
        break
      }
      case "addRow": handleAddRow(); break
      case "deleteRow": setDeleteRowOpen(true); break
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
      case "templates": setTemplatesOpen((prev) => !prev); break
      case "refresh": handleRefresh(); break
      case "save": autoSave.saveNow({ grades: Array.from(gradeMap.values()), cid: classId, showToast: true }).then().catch(() => {}); break
    }
  }

  const effectiveScheme = gradingScheme

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

  const catToComponent = useMemo(() => {
    const map = new Map<string, string>()
    if (!effectiveScheme) return map
    for (const comp of effectiveScheme.components) {
      for (const cat of comp.categories) map.set(cat.name.toLowerCase(), comp.name)
    }
    for (const lab of effectiveScheme.labComponents ?? []) {
      for (const cat of lab.categories) map.set(cat.name.toLowerCase(), lab.name)
    }
    return map
  }, [effectiveScheme])

  const columnCategories = useMemo(() => {
    const cats = new Set<string>()
    for (const col of gradeColumns) cats.add(col.category)
    if (effectiveScheme) {
      for (const comp of effectiveScheme.components) {
        for (const cat of comp.categories) cats.add(cat.name)
      }
      for (const lab of effectiveScheme.labComponents ?? []) {
        for (const cat of lab.categories) cats.add(cat.name)
      }
    }
    return Array.from(cats)
  }, [gradeColumns, effectiveScheme])

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
      })
      return {
        studentId: row.studentId,
        classStanding: result.classStanding,
        examGrade: result.examGrade,
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

  useEffect(() => { livePreviewDataRef.current = livePreviewData }, [livePreviewData])

  const colDefs = useMemo((): (ColDef | ColGroupDef)[] => {
    const saved = colStateRef.current

    if (activeTab === "summary") {
      return [
        { headerName: "No.", field: "no", width: saved["no"] ?? 60, sortable: true, filter: false, cellStyle: { textAlign: "center" }, pinned: "left" },
        { headerName: "Student Name", field: "studentName", width: saved["studentName"] ?? 220, sortable: true, filter: "agTextColumnFilter", pinned: "left" },
        { headerName: "Midterm Grade", field: "midtermGrade", width: 130, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 600 } },
        { headerName: "Tentative Final", field: "finalGrade", width: 130, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => {
            const row = params.data as StudentGradeRow
            const grade = gradeMapRef.current.get(row.studentId)
            return fmtNum(grade?.tentativeFinalGrade)
          }, cellStyle: { fontWeight: 600 } },
        { headerName: "Final %", field: "finalGrade", width: 120, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 700 } },
        { headerName: "Transmuted", field: "transmutedGrade", width: 120, sortable: true, filter: "agNumberColumnFilter",
          valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 700 } },
        { headerName: "Remarks", field: "remarks", width: 120, sortable: true, filter: "agTextColumnFilter",
          cellRenderer: RemarksCellRenderer },
        { headerName: "Status", field: "workflowStatus", width: 130, sortable: true, filter: "agTextColumnFilter",
          cellRenderer: StatusCellRenderer },
      ]
    }

    const cols: (ColDef | ColGroupDef)[] = [
      { headerName: "No.", field: "no", width: saved["no"] ?? 60, sortable: true, filter: false, cellStyle: { textAlign: "center" }, pinned: "left" },
      { headerName: "Student Name", field: "studentName", width: saved["studentName"] ?? 220, sortable: true, filter: "agTextColumnFilter", pinned: "left" },
    ]

    const catColDefs = new Map<string, ColDef[]>()
    for (const col of filteredColumns) {
      const colId = `score_${scoreKey(col)}`
      const colDef: ColDef = {
        headerName: col.displayName || col.name,
        headerTooltip: `${col.category} (${catWeightMap.get(col.category.toLowerCase()) ?? "?"}%) — max ${col.maxScore}`,
        colId,
        width: saved[colId] ?? col.width ?? 120,
        sortable: true,
        filter: "agNumberColumnFilter",
        editable: isEditable,
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
      if (!catColDefs.has(col.category)) catColDefs.set(col.category, [])
      catColDefs.get(col.category)!.push(colDef)
    }

    // Ensure all scheme categories appear as groups even when no columns exist
    if (effectiveScheme) {
      for (const comp of effectiveScheme.components) {
        for (const cat of comp.categories) {
          if (!catColDefs.has(cat.name)) {
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
          if (!catColDefs.has(cat.name)) {
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
      const compName = catToComponent.get(catName.toLowerCase()) || "Other"
      if (!compCatGroups.has(compName)) compCatGroups.set(compName, [])
      const catWt = catWeightMap.get(catName.toLowerCase())
      const psColDef: ColDef = {
        headerName: "PS",
        colId: `ps_${catName}`,
        width: saved[`ps_${catName}`] ?? 70,
        sortable: true,
        filter: "agNumberColumnFilter",
        editable: false,
        valueGetter: (params) => {
          const row = params.data as StudentGradeRow
          const preview = livePreviewDataRef.current?.find((p) => p.studentId === row.studentId)
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
          const preview = livePreviewDataRef.current?.find((p) => p.studentId === row.studentId)
          if (!preview?.categoryGrades) return ""
          const match = preview.categoryGrades.find((cg) => gradeCategoryMatches(catName, cg.category))
          return match?.weightedScore ?? ""
        },
        valueFormatter: (params) => params.value == null ? "" : String(Math.round(Number(params.value))),
        cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 70%)" },
      }
      const isExam = gradeCategoryMatches("exam", catName)
      const nCat = catName.toLowerCase().replace(/[^a-z0-9]/g, "")
      const isAttendance = nCat.includes("attendance") || nCat.includes("attend")
      const extraCols = isExam || isAttendance ? [] : [psColDef, wsColDef]
      compCatGroups.get(compName)!.push({
        headerName: catWt != null ? `${catName} (${catWt}%)` : catName,
        headerClass: `ag-category-group-header ${CAT_COLORS[catColorIdx % CAT_COLORS.length]}`,
        marryChildren: true,
        children: [...colDefs, ...extraCols],
      })
      catColorIdx++
    }

    const csColDef: ColDef = {
      headerName: "Class Standing", field: "liveClassStanding", width: saved["liveClassStanding"] ?? 130, sortable: true, filter: "agNumberColumnFilter",
      valueGetter: (params) => {
        const row = params.data as StudentGradeRow
        const preview = livePreviewDataRef.current?.find((p) => p.studentId === row.studentId)
         return preview?.classStanding ?? ""
       }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 50%)" },
     }
     const examColDef: ColDef = {
       headerName: "Exam Grade", field: "liveExamGrade", width: saved["liveExamGrade"] ?? 110, sortable: true, filter: "agNumberColumnFilter",
       valueGetter: (params) => {
         const row = params.data as StudentGradeRow
         const preview = livePreviewDataRef.current?.find((p) => p.studentId === row.studentId)
        return preview?.examGrade ?? ""
      }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--accent), transparent 50%)" },
    }

    let csPlaced = false
    let examPlaced = false
    for (const [compName, catGroups] of compCatGroups) {
      const compWt = compWeightMap.get(compName)
      const isExam = compName.toLowerCase().includes("exam")
      const extraCol = isExam ? (!examPlaced ? examColDef : null) : (!csPlaced ? csColDef : null)
      if (extraCol === examColDef) examPlaced = true
      if (extraCol === csColDef) csPlaced = true

      const children: (ColDef | ColGroupDef)[] = extraCol ? [...catGroups, extraCol] : catGroups

      if (catGroups.length === 1 && !extraCol) {
        cols.push(...catGroups)
      } else {
        cols.push({
          headerName: compWt != null ? `${compName} (${compWt}%)` : compName,
          headerClass: "ag-component-group-header",
          marryChildren: true,
          children,
        })
      }
    }

    if (!csPlaced) cols.push(csColDef)
    if (!examPlaced) cols.push(examColDef)
    cols.push(
      { headerName: activeTab === "midterm" ? "Midterm Grade" : "Final Period Grade", field: "livePeriodGrade", width: saved["livePeriodGrade"] ?? 130, sortable: true, filter: "agNumberColumnFilter",
        valueGetter: (params) => {
          const row = params.data as StudentGradeRow
           const preview = livePreviewDataRef.current?.find((p) => p.studentId === row.studentId)
           return preview?.periodGrade ?? ""
         }, valueFormatter: (params) => fmtNum(params.value), cellStyle: { fontWeight: 700 } },
      { headerName: "Status", field: "workflowStatus", width: saved["workflowStatus"] ?? 130, sortable: true, filter: "agTextColumnFilter",
        cellRenderer: StatusCellRenderer },
    )

    return cols
  }, [filteredColumns, isEditable, activeTab, catToComponent, catWeightMap, compWeightMap, handleUpdateMaxScore])

  const pinnedTopRowData = useMemo(() => {
    if (activeTab === "summary") return undefined
    const row: Record<string, string> = { no: "No.", studentName: "Scores" }
    for (const col of filteredColumns) {
      row[`score_${scoreKey(col)}`] = ""
    }
    return [row]
  }, [filteredColumns, activeTab])

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return
    const state = Object.entries(colStateRef.current)
      .filter(([, w]) => w > 0)
      .map(([colId, width]) => ({ colId, width }))
    if (state.length > 0) {
      api.applyColumnState({ state })
    }
  }, [colDefs])

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
      headerCellHoverBackgroundColor: "color-mix(in srgb, var(--muted), black 8%)",

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
    }, darkMode ? "dark" : undefined)
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

  const SchemeInfoBanner = useCallback(() => {
    if (!schemeInfo) return null
    const { subjectType, components, labComponents, lectureWeight, laboratoryWeight } = schemeInfo
    return (
      <div className="rounded-xl border border-border bg-card p-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-foreground">Grading Scheme:</span>
          <span className="text-muted-foreground">{subjectType}</span>
          {components.map((c) => {
            const catSum = c.categories.reduce((s, cat) => s + cat.weight, 0)
            return (
              <span key={c.name} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5">
                {c.name}
                <span className="font-semibold text-foreground">{c.weight}%</span>
                {c.categories.length > 0 && (
                  <span className="text-muted-foreground">
                    ({c.categories.map((cat) => `${cat.name} ${cat.weight}%`).join(", ")})
                  </span>
                )}
                <span className={catSum === 100 ? "text-emerald-500" : "text-red-500"}>{catSum}%</span>
              </span>
            )
          })}
          {subjectType === "Lecture with Lab" && labComponents && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5">
              Lecture {lectureWeight}% / Lab {laboratoryWeight}%
            </span>
          )}
          <span className={schemeInfo.totalComp === 100 ? "text-emerald-500" : "text-red-500"}>
            {schemeInfo.totalComp}% total
          </span>
        </div>
      </div>
    )
  }, [schemeInfo])

  const tabLabels: { key: TabKey; label: string }[] = [
    { key: "midterm", label: "Midterm" },
    { key: "final", label: "Final" },
    { key: "summary", label: "Summary" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Search students..." className="h-9 rounded-xl pl-9 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
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

      <SpreadsheetToolbar
        onAction={handleToolbarAction}
        canUndo={undoManager.current.canUndo}
        canRedo={undoManager.current.canRedo}
        selectedRowCount={selectedRows.length}
        columnCount={filteredColumns.length}
        saveStatus={saveStatus}
      />

      <div className="rounded-xl border border-border shadow-sm overflow-hidden" style={{ height: "min(600px, 70vh)", width: "100%" }}>
          <AgGridReact
            ref={gridRef}
            rowData={gridData}
            columnDefs={colDefs}
            pinnedTopRowData={pinnedTopRowData}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            cellStyle: { display: "flex", alignItems: "center" },
          }}
          theme={theme}
          getRowId={(params) => params.data.studentId}
          animateRows
          rowSelection="multiple"
          onSelectionChanged={onSelectionChanged}
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

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleRefresh} className="rounded-lg">
          <RotateCcw className="size-3.5" /> Refresh
        </Button>
        <Button size="sm" variant="outline" onClick={() => autoSave.saveNow({ grades: Array.from(gradeMap.values()), cid: classId, showToast: true })} className="rounded-lg">
          <Save className="size-3.5" /> Save
        </Button>
        {activeTab !== "summary" && (
          <>
            <Button size="sm" variant="default" onClick={() => handleComputeGrades(activeTab === "midterm" ? "midterm" : "final")} className="rounded-lg shadow-sm ring-1 ring-primary/30">
              <Calculator className="size-4" /> Compute {activeTab === "midterm" ? "Midterm" : "Final"}
            </Button>
            <span className="text-xs text-muted-foreground">Live preview updates automatically as you type</span>
          </>
        )}
        <span className="text-xs font-medium text-muted-foreground">Workflow:</span>
        <Button size="sm" variant="outline" onClick={() => handleUpdateWorkflow("Submitted")} className="rounded-lg">
          <Send className="size-3.5" /> Submit
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleUpdateWorkflow("Reviewed")} className="rounded-lg">
          <CheckCircle2 className="size-3.5" /> Reviewed
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleUpdateWorkflow("Approved")} className="rounded-lg">
          <CheckCircle2 className="size-3.5" /> Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleUpdateWorkflow("Locked")} className="rounded-lg">
          <Lock className="size-3.5" /> Lock
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleUpdateWorkflow("Draft")} className="rounded-lg">
          <XCircle className="size-3.5" /> Revert
        </Button>
      </div>

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
      <DeleteRowDialog open={deleteRowOpen} onOpenChange={setDeleteRowOpen}
        rowCount={selectedRows.length} onConfirm={handleDeleteRow} />

      {templatesOpen && (
        <TemplateSelector classId={classId} open={templatesOpen} onClose={() => setTemplatesOpen(false)}
          onApplied={() => {
            setTemplatesOpen(false)
            handleImportComplete()
          }} />
      )}
    </div>
  )
}
