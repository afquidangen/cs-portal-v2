"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Lock, CheckCircle2, Search, Calculator,
  Send, XCircle,
} from "lucide-react"
import { AgGridReact } from "ag-grid-react"
import type { ColDef, CellValueChangedEvent, ColumnResizedEvent, SelectionChangedEvent, GridReadyEvent } from "ag-grid-community"
import { AllCommunityModule, ModuleRegistry, themeAlpine } from "ag-grid-community"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "../modules/types"
import type { GradeRecord } from "../../data/portal-data"
import type { GradeWorkflowStatus, GradeColumn } from "@/lib/types"
import { useAutoSave, type SaveStatus } from "../../lib/auto-save"
import { transmuteGrade, getGradeRemarks, computeAllCategoryGrades } from "../../lib/grade-engine"
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
}

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
}) {
  const gridRef = useRef<AgGridReact>(null)
  const colStateRef = useRef<Record<string, number>>({})
  const isEditable = model.role === "faculty" || model.role === "admin"

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

  const undoManager = useRef(new UndoRedoManager())

  const saveGradeData = useCallback(async (data: unknown) => {
    const { grades: gradeData, cid } = data as { grades: GradeRecord[]; cid: string }
    const res = await fetch(`/api/portal/grades/class/${cid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grades: gradeData }),
    })
    if (!res.ok) throw new Error("Failed to save")
  }, [])

  const autoSave = useAutoSave(saveGradeData, 800)

  useEffect(() => {
    setSaveStatus(autoSave.status)
    setLastSaved(autoSave.lastSaved)
  }, [autoSave.status, autoSave.lastSaved])

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
      subjectType: "Lecture",
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
    const field = colDef.field

    if (field?.startsWith("score_")) {
      const colName = field.replace("score_", "")
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

  async function handleComputeGrades(period: "midterm" | "final" = "final") {
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

  async function handleAddColumn(name: string, category: string, maxScore: number) {
    try {
      const res = await fetch("/api/portal/grades/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name, category, maxScore }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || "Failed to add column."); return }
      setGradeColumns([...gradeColumns, json.data as GradeColumn])
      toast.success(`Column "${name}" added.`)
    } catch { toast.error("Failed to add column.") }
  }

  async function handleRenameColumn(newName: string) {
    if (!selectedColName) return
    const col = gradeColumns.find((c) => c.name === selectedColName)
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
    const col = gradeColumns.find((c) => c.name === selectedColName)
    if (!col) return
    try {
      const res = await fetch(`/api/portal/grades/columns/${col.id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete column."); return }
      setGradeColumns(gradeColumns.filter((c) => c.id !== col.id))
      toast.success(`Column "${selectedColName}" deleted.`)
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
          if (colDef.field?.startsWith("score_")) {
            setSelectedColName(colDef.field.replace("score_", ""))
            setRenameOpen(true)
          } else { toast.info("Focus a grade column to rename.") }
        } else { toast.info("Click a grade column first, then rename.") }
        break
      }
      case "deleteColumn": {
        const focused = gridRef.current?.api.getFocusedCell()
        if (focused) {
          const colDef = focused.column.getColDef()
          if (colDef.field?.startsWith("score_")) {
            setSelectedColName(colDef.field.replace("score_", ""))
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
        const snapshot = undoManager.current.undo()
        if (snapshot) {
          toast.info("Undo applied.")
        } else { toast.info("Nothing to undo.") }
        break
      }
      case "redo": {
        const snapshot = undoManager.current.redo()
        if (snapshot) {
          toast.info("Redo applied.")
        } else { toast.info("Nothing to redo.") }
        break
      }
      case "import": setImportOpen(true); break
      case "export": handleExport(); break
      case "templates": setTemplatesOpen((prev) => !prev); break
      case "save": autoSave.saveNow({ grades: Array.from(gradeMap.values()), cid: classId }).then().catch(() => {}); break
    }
  }

  const columnCategories = useMemo(() => {
    const cats = new Set<string>()
    for (const col of gradeColumns) cats.add(col.category)
    return Array.from(cats)
  }, [gradeColumns])

  const colDefs = useMemo((): ColDef[] => {
    const saved = colStateRef.current

    const cols: ColDef[] = [
      { headerName: "No.", field: "no", width: saved["no"] ?? 60, sortable: true, filter: false, cellStyle: { textAlign: "center" } },
      { headerName: "Student Name", field: "studentName", width: saved["studentName"] ?? 220, sortable: true, filter: "agTextColumnFilter", pinned: "left" },
    ]

    for (const col of gradeColumns) {
      const field = `score_${col.name}`
      cols.push({
        headerName: col.displayName || col.name,
        field,
        width: saved[field] ?? col.width ?? 120,
        sortable: true,
        filter: "agNumberColumnFilter",
        editable: isEditable,
        valueGetter: (params) => {
          const row = params.data as StudentGradeRow
          return row.scores?.[col.name] ?? ""
        },
        valueSetter: (params) => {
          const row = params.data as StudentGradeRow
          const val = params.newValue
          const num = val === "" || val === null || val === undefined ? 0 : Number(val)
          row.scores = { ...row.scores, [col.name]: isNaN(num) ? 0 : num }
          return true
        },
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, max: col.maxScore, precision: 2 },
      })
    }

    cols.push(
      { headerName: "Midterm Grade", field: "midtermGrade", width: saved["midtermGrade"] ?? 120, sortable: true, filter: "agNumberColumnFilter",
        valueFormatter: (params) => params.value?.toFixed(2) ?? "", cellStyle: { fontWeight: 600 } },
      { headerName: "Final Grade", field: "finalGrade", width: saved["finalGrade"] ?? 120, sortable: true, filter: "agNumberColumnFilter",
        valueFormatter: (params) => params.value?.toFixed(2) ?? "", cellStyle: { fontWeight: 600 } },
      { headerName: "Transmuted", field: "transmutedGrade", width: saved["transmutedGrade"] ?? 110, sortable: true, filter: "agNumberColumnFilter",
        valueFormatter: (params) => params.value?.toFixed(2) ?? "", cellStyle: { fontWeight: 700 } },
      { headerName: "Remarks", field: "remarks", width: saved["remarks"] ?? 120, sortable: true, filter: "agTextColumnFilter",
        cellRenderer: RemarksCellRenderer },
      { headerName: "Status", field: "workflowStatus", width: saved["workflowStatus"] ?? 130, sortable: true, filter: "agTextColumnFilter",
        cellRenderer: StatusCellRenderer },
    )

    return cols
  }, [gradeColumns, isEditable])

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

      <SpreadsheetToolbar
        onAction={handleToolbarAction}
        canUndo={undoManager.current.canUndo}
        canRedo={undoManager.current.canRedo}
        selectedRowCount={selectedRows.length}
        columnCount={gradeColumns.length}
        saveStatus={saveStatus}
      />

      <div className="rounded-xl border border-border shadow-sm overflow-hidden" style={{ height: "min(600px, 70vh)", width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={gridData}
          columnDefs={colDefs}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            cellStyle: { display: "flex", alignItems: "center" },
          }}
          theme={theme}
          animateRows
          rowSelection="multiple"
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={onCellValueChanged}
          onGridReady={onGridReady}
          onColumnResized={onColumnResized}
          suppressClickEdit
          singleClickEdit
          stopEditingWhenCellsLoseFocus
          enableCellTextSelection
          ensureDomOrder
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => handleComputeGrades("midterm")} className="rounded-lg">
          <Calculator className="size-4" /> Midterm
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleComputeGrades("final")} className="rounded-lg">
          <Calculator className="size-4" /> Final
        </Button>
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

      <AddColumnDialog open={addColumnOpen} onOpenChange={setAddColumnOpen}
        onConfirm={handleAddColumn} availableCategories={columnCategories} />
      <IntelligentImportDialog open={importOpen} onOpenChange={setImportOpen}
        classId={classId} subject={selectedSubject} onImportComplete={handleImportComplete} />
      <RenameColumnDialog open={renameOpen} onOpenChange={setRenameOpen}
        currentName={selectedColName} onConfirm={handleRenameColumn} />
      <DeleteColumnDialog open={deleteColOpen} onOpenChange={setDeleteColOpen}
        columnName={selectedColName} onConfirm={handleDeleteColumn} />
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
