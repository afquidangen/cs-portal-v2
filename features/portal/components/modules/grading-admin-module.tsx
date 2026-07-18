"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Download, FileUp, Loader2, Plus, Table2, Trash2, Variable } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { GradingScheme, ImportTemplateFile, TransmutationTable } from "@/lib/types"
import { SchemeEditor } from "./grading-admin/scheme-editor"
import { TransmutationEditor } from "./grading-admin/transmutation-editor"
import { ActiveSchemePreview } from "./grading-admin/active-scheme-preview"

export function GradingAdminModule() {
  const [schemes, setSchemes] = useState<GradingScheme[]>([])
  const [tables, setTables] = useState<TransmutationTable[]>([])
  const [activeTab, setActiveTab] = useState<"schemes" | "tables">("schemes")

  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null)
  const [editingTable, setEditingTable] = useState<TransmutationTable | null>(null)

  const [importTemplates, setImportTemplates] = useState<Record<string, ImportTemplateFile | null>>({
    Lecture: null,
    "Lecture with Lab": null,
  })
  const [uploadingTemplate, setUploadingTemplate] = useState<string | null>(null)
  const lectureInputRef = useRef<HTMLInputElement>(null)
  const labInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const [sRes, tRes, itRes] = await Promise.all([
        fetch("/api/portal/grading-schemes"),
        fetch("/api/portal/transmutation-tables"),
        fetch("/api/portal/import-template"),
      ])
      const sData = await sRes.json()
      const tData = await tRes.json()
      const itData = await itRes.json()
      if (sRes.ok) {
        console.log("[LOAD] data comp0 cats:", JSON.stringify(sData.data?.[0]?.components?.[0]?.categories))
        setSchemes(sData.data ?? [])
      }
      if (tRes.ok) setTables(tData.data ?? [])
      if (itRes.ok) {
        const templates: ImportTemplateFile[] = itData.data ?? []
        const map: Record<string, ImportTemplateFile | null> = { Lecture: null, "Lecture with Lab": null }
        for (const t of templates) map[t.subjectType] = t
        setImportTemplates(map)
      }
    } catch {
      toast.error("Failed to load data.")
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  async function saveScheme(scheme: GradingScheme) {
    console.log("[SAVE] comp0 cats:", JSON.stringify(scheme.components[0]?.categories))
    const isNew = !schemes.find((s) => s.id === scheme.id)
    const res = await fetch(`/api/portal/grading-schemes${isNew ? "" : `/${scheme.id}`}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheme),
    })
    if (!res.ok) { const j = await res.json(); toast.error(j.error || "Failed to save."); return }
    toast.success(`Scheme "${scheme.name}" saved.`)
    setEditingScheme(null)
    await load()
  }

  async function deleteScheme(id: string) {
    const res = await fetch(`/api/portal/grading-schemes/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Failed to delete."); return }
    toast.success("Scheme deleted.")
    load()
  }

  async function saveTable(table: TransmutationTable) {
    const isNew = !tables.find((t) => t.id === table.id)
    const res = await fetch(`/api/portal/transmutation-tables${isNew ? "" : `/${table.id}`}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(table),
    })
    if (!res.ok) { const j = await res.json(); toast.error(j.error || "Failed to save."); return }
    toast.success(`Table "${table.name}" saved.`)
    setEditingTable(null)
    load()
  }

  async function deleteTable(id: string) {
    const res = await fetch(`/api/portal/transmutation-tables/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Failed to delete."); return }
    toast.success("Table deleted.")
    load()
  }

  async function handleUploadTemplate(subjectType: string, file: File) {
    setUploadingTemplate(subjectType)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("subjectType", subjectType)
      const res = await fetch("/api/portal/import-template", { method: "PUT", body: formData })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to upload template.")
        return
      }
      toast.success(`Template for "${subjectType}" uploaded.`)
      await load()
    } catch {
      toast.error("Failed to upload template.")
    } finally {
      setUploadingTemplate(null)
    }
  }

  async function handleDeleteTemplate(subjectType: string) {
    try {
      const res = await fetch(`/api/portal/import-template?subjectType=${encodeURIComponent(subjectType)}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete template."); return }
      toast.success(`Template for "${subjectType}" removed.`)
      await load()
    } catch {
      toast.error("Failed to delete template.")
    }
  }

  async function handleDownloadTemplate(template: ImportTemplateFile) {
    try {
      const fileRes = await fetch(template.fileUrl)
      const blob = await fileRes.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = template.fileName || "template.xlsx"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Failed to download template.")
    }
  }

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Grading Configuration</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage grading schemes, category weights, and transmutation tables used by grade computations.
        </p>
      </div>

      <ActiveSchemePreview schemes={schemes} />

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">Import Templates</h2>
            <p className="text-sm text-slate-500">Upload Excel templates that faculty can download for the grade import feature.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(["Lecture", "Lecture with Lab"] as const).map((subjectType) => {
              const template = importTemplates[subjectType]
              const isUploading = uploadingTemplate === subjectType
              return (
                <div key={subjectType} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">{subjectType}</p>
                  {template ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileUp className="size-4 text-blue-600" />
                        <span className="truncate text-sm text-slate-600">{template.fileName}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Uploaded {new Date(template.uploadedAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadTemplate(template)} className="h-8 rounded-md text-xs">
                          <Download className="size-3.5" /> Download
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteTemplate(subjectType)} className="h-8 rounded-md text-xs text-destructive">
                          <Trash2 className="size-3.5" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">No template uploaded</p>
                  )}
                  <input
                    ref={subjectType === "Lecture" ? lectureInputRef : labInputRef}
                    type="file"
                    accept=".xlsx"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUploadTemplate(subjectType, f)
                      e.target.value = ""
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => (subjectType === "Lecture" ? lectureInputRef : labInputRef).current?.click()}
                    disabled={isUploading}
                    className="mt-3 h-8 w-full rounded-md text-xs"
                  >
                    {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
                    {template ? "Replace Template" : "Upload Template"}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-wrap gap-2 p-2">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("schemes")}
          className={cn("h-10 rounded-md text-sm font-semibold", activeTab === "schemes" ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}
        >
          <Table2 className="size-4" /> Grading Schemes
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("tables")}
          className={cn("h-10 rounded-md text-sm font-semibold", activeTab === "tables" ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}
        >
          <Variable className="size-4" /> Transmutation Tables
        </Button>
        </CardContent>
      </Card>

      {activeTab === "schemes" && (
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-4 p-5">
          {!editingScheme && (
            <Button onClick={() => setEditingScheme({
              id: `GS-${Date.now()}`, name: "", subjectType: "Lecture", isDefault: false, isActive: true,
              components: [], createdAt: "", updatedAt: "",
            })} className="h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700"><Plus className="size-4" /> New Scheme</Button>
          )}

          {editingScheme && (
            <SchemeEditor key={editingScheme.id} scheme={editingScheme} onSave={saveScheme} onCancel={() => setEditingScheme(null)} />
          )}

          <div className="space-y-3">
            {schemes.map((scheme) => (
              <div key={scheme.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{scheme.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {scheme.subjectType} &middot; {scheme.components.length} component(s) &middot;
                    {scheme.isActive ? <span className="text-emerald-600"> Active</span> : <span className="text-muted-foreground"> Inactive</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {scheme.components.map((c) => (
                      <span key={c.name} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {c.name} ({c.weight}%)
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingScheme(scheme)} className="rounded-md">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteScheme(scheme.id)} className="rounded-md text-destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "tables" && (
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-4 p-5">
          {!editingTable && (
            <Button onClick={() => setEditingTable({
              id: `TT-${Date.now()}`, name: "", subjectType: "All", isDefault: false, isActive: true,
              entries: [], createdAt: "", updatedAt: "",
            })} className="h-10 rounded-md bg-blue-600 text-white hover:bg-blue-700"><Plus className="size-4" /> New Table</Button>
          )}

          {editingTable && (
            <TransmutationEditor table={editingTable} onSave={saveTable} onCancel={() => setEditingTable(null)} />
          )}

          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{table.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {table.subjectType} &middot; {table.entries.length} entr{table.entries.length === 1 ? "y" : "ies"} &middot;
                    {table.isActive ? <span className="text-emerald-600"> Active</span> : <span className="text-muted-foreground"> Inactive</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {table.entries.slice(0, 5).map((e, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {e.min}–{e.max}% &rarr; {e.equivalent}
                      </span>
                    ))}
                    {table.entries.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{table.entries.length - 5} more</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingTable(table)} className="rounded-md">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteTable(table.id)} className="rounded-md text-destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
