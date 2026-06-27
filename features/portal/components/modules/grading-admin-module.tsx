"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Table2, Variable } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { GradingScheme, TransmutationTable } from "@/lib/types"
import { SchemeEditor } from "./grading-admin/scheme-editor"
import { TransmutationEditor } from "./grading-admin/transmutation-editor"
import { ActiveSchemePreview } from "./grading-admin/active-scheme-preview"

export function GradingAdminModule() {
  const [schemes, setSchemes] = useState<GradingScheme[]>([])
  const [tables, setTables] = useState<TransmutationTable[]>([])
  const [activeTab, setActiveTab] = useState<"schemes" | "tables">("schemes")

  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null)
  const [editingTable, setEditingTable] = useState<TransmutationTable | null>(null)

  const load = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("/api/portal/grading-schemes"),
        fetch("/api/portal/transmutation-tables"),
      ])
      const sData = await sRes.json()
      const tData = await tRes.json()
      if (sRes.ok) {
        console.log("[LOAD] data comp0 cats:", JSON.stringify(sData.data?.[0]?.components?.[0]?.categories))
        setSchemes(sData.data ?? [])
      }
      if (tRes.ok) setTables(tData.data ?? [])
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
