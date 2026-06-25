"use client"

import { useCallback, useEffect, useState } from "react"
import { GraduationCap, Plus, Table2, Variable } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Panel } from "../shared/dashboard-ui"
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

  useEffect(() => { load() }, [load])

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
    <Panel title="Grading Configuration">
      <div className="mb-5 flex flex-col items-start gap-4 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:flex-row sm:items-center sm:px-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <Variable className="size-8" />
        </div>
        <div>
          <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <GraduationCap className="size-4" />
            Administrator
          </p>
          <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
            Grading Configuration
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage grading schemes, category weights, and transmutation tables. Changes affect all grade computations.
          </p>
        </div>
      </div>

      <ActiveSchemePreview schemes={schemes} />

      <div className="mb-4 flex gap-2">
        <Button variant={activeTab === "schemes" ? "default" : "outline"} onClick={() => setActiveTab("schemes")} className="rounded-lg">
          <Table2 className="size-4" /> Grading Schemes
        </Button>
        <Button variant={activeTab === "tables" ? "default" : "outline"} onClick={() => setActiveTab("tables")} className="rounded-lg">
          <Variable className="size-4" /> Transmutation Tables
        </Button>
      </div>

      {activeTab === "schemes" && (
        <div className="space-y-4">
          {!editingScheme && (
            <Button onClick={() => setEditingScheme({
              id: `GS-${Date.now()}`, name: "", subjectType: "Lecture", isDefault: false, isActive: true,
              components: [], createdAt: "", updatedAt: "",
            })} className="rounded-lg"><Plus className="size-4" /> New Scheme</Button>
          )}

          {editingScheme && (
            <SchemeEditor key={editingScheme.id} scheme={editingScheme} onSave={saveScheme} onCancel={() => setEditingScheme(null)} />
          )}

          <div className="space-y-3">
            {schemes.map((scheme) => (
              <div key={scheme.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                <div>
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingScheme(scheme)} className="rounded-lg">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteScheme(scheme.id)} className="rounded-lg text-destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tables" && (
        <div className="space-y-4">
          {!editingTable && (
            <Button onClick={() => setEditingTable({
              id: `TT-${Date.now()}`, name: "", subjectType: "All", isDefault: false, isActive: true,
              entries: [], createdAt: "", updatedAt: "",
            })} className="rounded-lg"><Plus className="size-4" /> New Table</Button>
          )}

          {editingTable && (
            <TransmutationEditor table={editingTable} onSave={saveTable} onCancel={() => setEditingTable(null)} />
          )}

          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <p className="font-semibold text-foreground">{table.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {table.subjectType} &middot; {table.entries.length} entr{table.entries.length === 1 ? "y" : "ies"} &middot;
                    {table.isActive ? <span className="text-emerald-600"> Active</span> : <span className="text-muted-foreground"> Inactive</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {table.entries.slice(0, 5).map((e, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {e.min}-{e.max}% &rarr; {e.equivalent}
                      </span>
                    ))}
                    {table.entries.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{table.entries.length - 5} more</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingTable(table)} className="rounded-lg">Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteTable(table.id)} className="rounded-lg text-destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
