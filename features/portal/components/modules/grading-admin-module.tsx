"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, Save, Trash2, AlertTriangle, CheckCircle2, BookMarked, GraduationCap, Variable, Table2, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Panel } from "../shared/dashboard-ui"
import type { GradingScheme, TransmutationTable, TransmutationEntry } from "@/lib/types"

type SchemeComponent = GradingScheme["components"][number]
type Category = SchemeComponent["categories"][number]

function emptyComponent(name = ""): SchemeComponent {
  return { name, weight: 0, categories: [] }
}

function emptyCategory(name = ""): Category {
  return { name, weight: 0 }
}

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
      if (sRes.ok) setSchemes(sData.data ?? [])
      if (tRes.ok) setTables(tData.data ?? [])
    } catch {
      toast.error("Failed to load data.")
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function saveScheme(scheme: GradingScheme) {
    const isNew = !schemes.find((s) => s.id === scheme.id)
    const res = await fetch(`/api/portal/grading-schemes${isNew ? "" : `/${scheme.id}`}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheme),
    })
    if (!res.ok) { const j = await res.json(); toast.error(j.error || "Failed to save."); return }
    toast.success(`Scheme "${scheme.name}" saved.`)
    setEditingScheme(null)
    load()
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

  function validateSchemeWeights(scheme: GradingScheme): string[] {
    const errors: string[] = []
    const compTotal = scheme.components.reduce((s, c) => s + c.weight, 0)
    if (Math.abs(compTotal - 100) > 0.01) errors.push(`Component weights sum to ${compTotal}%, must be 100%.`)
    if (scheme.subjectType === "Lecture with Lab") {
      if ((scheme.lectureWeight ?? 0) + (scheme.laboratoryWeight ?? 0) !== 100) {
        errors.push(`Lecture weight (${scheme.lectureWeight ?? 0}%) + Laboratory weight (${scheme.laboratoryWeight ?? 0}%) must equal 100%.`)
      }
    }
    return errors
  }

  function SchemeEditor({ scheme, onSave, onCancel }: { scheme: GradingScheme; onSave: (s: GradingScheme) => void; onCancel: () => void }) {
    const [draft, setDraft] = useState<GradingScheme>({ ...scheme, components: scheme.components.map(c => ({ ...c, categories: c.categories.map(cat => ({ ...cat })) })), labComponents: scheme.labComponents?.map(c => ({ ...c, categories: c.categories.map(cat => ({ ...cat })) })) })
    const errors = useMemo(() => validateSchemeWeights(draft), [draft])

    function updateField<K extends keyof GradingScheme>(key: K, value: GradingScheme[K]) {
      setDraft((prev) => ({ ...prev, [key]: value }))
    }

    function addComponent() {
      setDraft((prev) => ({ ...prev, components: [...prev.components, emptyComponent("")] }))
    }

    function updateComponent(index: number, field: keyof SchemeComponent, value: string | number) {
      setDraft((prev) => {
        const comps = [...prev.components]
        comps[index] = { ...comps[index], [field]: value }
        return { ...prev, components: comps }
      })
    }

    function removeComponent(index: number) {
      setDraft((prev) => ({ ...prev, components: prev.components.filter((_, i) => i !== index) }))
    }

    function addCategory(compIndex: number) {
      setDraft((prev) => {
        const comps = [...prev.components]
        comps[compIndex] = { ...comps[compIndex], categories: [...comps[compIndex].categories, emptyCategory("")] }
        return { ...prev, components: comps }
      })
    }

    function updateCategory(compIndex: number, catIndex: number, field: keyof Category, value: string | number) {
      setDraft((prev) => {
        const comps = [...prev.components]
        const cats = [...comps[compIndex].categories]
        cats[catIndex] = { ...cats[catIndex], [field]: value }
        comps[compIndex] = { ...comps[compIndex], categories: cats }
        return { ...prev, components: comps }
      })
    }

    function removeCategory(compIndex: number, catIndex: number) {
      setDraft((prev) => {
        const comps = [...prev.components]
        comps[compIndex] = { ...comps[compIndex], categories: comps[compIndex].categories.filter((_, i) => i !== catIndex) }
        return { ...prev, components: comps }
      })
    }

    function addLabComponent() {
      setDraft((prev) => ({ ...prev, labComponents: [...(prev.labComponents ?? []), emptyComponent("")] }))
    }

    function updateLabComponent(index: number, field: keyof SchemeComponent, value: string | number) {
      setDraft((prev) => {
        const comps = [...(prev.labComponents ?? [])]
        comps[index] = { ...comps[index], [field]: value }
        return { ...prev, labComponents: comps }
      })
    }

    function removeLabComponent(index: number) {
      setDraft((prev) => ({ ...prev, labComponents: (prev.labComponents ?? []).filter((_, i) => i !== index) }))
    }

    function addLabCategory(compIndex: number) {
      setDraft((prev) => {
        const comps = [...(prev.labComponents ?? [])]
        comps[compIndex] = { ...comps[compIndex], categories: [...comps[compIndex].categories, emptyCategory("")] }
        return { ...prev, labComponents: comps }
      })
    }

    function updateLabCategory(compIndex: number, catIndex: number, field: keyof Category, value: string | number) {
      setDraft((prev) => {
        const comps = [...(prev.labComponents ?? [])]
        const cats = [...comps[compIndex].categories]
        cats[catIndex] = { ...cats[catIndex], [field]: value }
        comps[compIndex] = { ...comps[compIndex], categories: cats }
        return { ...prev, labComponents: comps }
      })
    }

    function removeLabCategory(compIndex: number, catIndex: number) {
      setDraft((prev) => {
        const comps = [...(prev.labComponents ?? [])]
        comps[compIndex] = { ...comps[compIndex], categories: comps[compIndex].categories.filter((_, i) => i !== catIndex) }
        return { ...prev, labComponents: comps }
      })
    }

    return (
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{scheme.id ? "Edit" : "New"} Grading Scheme</h3>
          <div className="flex gap-2">
            {errors.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <AlertTriangle className="size-3.5" /> {errors.length} issue(s)
              </div>
            )}
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={() => onSave(draft)} disabled={errors.length > 0} className="rounded-lg">
              <Save className="size-4" /> Save
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
            <Input value={draft.name} onChange={(e) => updateField("name", e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Type</label>
            <select value={draft.subjectType} onChange={(e) => updateField("subjectType", e.target.value as "Lecture" | "Lecture with Lab")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background">
              <option value="Lecture">Lecture</option>
              <option value="Lecture with Lab">Lecture with Lab</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => updateField("isActive", e.target.checked)} />
              Active
            </label>
          </div>
        </div>

        {draft.subjectType === "Lecture with Lab" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lecture Weight (%)</label>
               <Input type="number" value={draft.lectureWeight ?? 40} onChange={(e) => updateField("lectureWeight", Number(e.target.value))} className="rounded-xl" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laboratory Weight (%)</label>
               <Input type="number" value={draft.laboratoryWeight ?? 60} onChange={(e) => updateField("laboratoryWeight", Number(e.target.value))} className="rounded-xl" />
            </div>
            <div className="col-span-full text-xs">
              <span className={`${(draft.lectureWeight ?? 0) + (draft.laboratoryWeight ?? 0) === 100 ? "text-emerald-600" : "text-red-500"}`}>
                Lecture + Lab = {(draft.lectureWeight ?? 0) + (draft.laboratoryWeight ?? 0)}% {(draft.lectureWeight ?? 0) + (draft.laboratoryWeight ?? 0) === 100 ? "✓" : "✗ (must equal 100%)"}
              </span>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Components <span className={`ml-2 text-xs font-normal ${Math.abs(draft.components.reduce((s, c) => s + c.weight, 0) - 100) < 0.01 ? "text-emerald-600" : "text-red-500"}`}>
              (Sum: {draft.components.reduce((s, c) => s + c.weight, 0)}%)
            </span></h4>
            <Button size="sm" variant="outline" onClick={addComponent} className="rounded-lg"><Plus className="size-3.5" /> Add</Button>
          </div>
          <div className="space-y-3">
            {draft.components.map((comp, ci) => {
              const catSum = comp.categories.reduce((s, c) => s + c.weight, 0)
              return (
              <div key={ci} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Input placeholder="Component name" value={comp.name} onChange={(e) => updateComponent(ci, "name", e.target.value)} className="flex-1 rounded-lg" />
                  <div className="flex items-center gap-1 text-sm">
                    <Input type="number" value={comp.weight} onChange={(e) => updateComponent(ci, "weight", Number(e.target.value))} className="w-20 rounded-lg text-center" />%
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeComponent(ci)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
                <div className="ml-4 space-y-2">
                  {comp.categories.map((cat, cati) => (
                    <div key={cati} className="flex items-center gap-2">
                      <Input placeholder="Category name" value={cat.name} onChange={(e) => updateCategory(ci, cati, "name", e.target.value)} className="flex-1 rounded-lg" />
                      <Input type="number" value={cat.weight} onChange={(e) => updateCategory(ci, cati, "weight", Number(e.target.value))} className="w-20 rounded-lg text-center" />%
                      <Button size="sm" variant="ghost" onClick={() => removeCategory(ci, cati)}><Trash2 className="size-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                  {comp.categories.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Category sum: {catSum}%</span>
                    </div>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => addCategory(ci)} className="text-xs"><Plus className="size-3" /> Category</Button>
                </div>
              </div>
            )})}
          </div>
        </div>

        {draft.subjectType === "Lecture with Lab" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Lab Components <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Sum: {(draft.labComponents ?? []).reduce((s, c) => s + c.weight, 0)}%)
              </span></h4>
              <Button size="sm" variant="outline" onClick={addLabComponent} className="rounded-lg"><Plus className="size-3.5" /> Add</Button>
            </div>
            <div className="space-y-3">
              {(draft.labComponents ?? []).map((comp, ci) => {
                const catSum = comp.categories.reduce((s, c) => s + c.weight, 0)
                return (
                <div key={ci} className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Input placeholder="Component name" value={comp.name} onChange={(e) => updateLabComponent(ci, "name", e.target.value)} className="flex-1 rounded-lg" />
                    <div className="flex items-center gap-1 text-sm">
                      <Input type="number" value={comp.weight} onChange={(e) => updateLabComponent(ci, "weight", Number(e.target.value))} className="w-20 rounded-lg text-center" />%
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeLabComponent(ci)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                  <div className="ml-4 space-y-2">
                    {comp.categories.map((cat, cati) => (
                      <div key={cati} className="flex items-center gap-2">
                        <Input placeholder="Category name" value={cat.name} onChange={(e) => updateLabCategory(ci, cati, "name", e.target.value)} className="flex-1 rounded-lg" />
                        <Input type="number" value={cat.weight} onChange={(e) => updateLabCategory(ci, cati, "weight", Number(e.target.value))} className="w-20 rounded-lg text-center" />%
                        <Button size="sm" variant="ghost" onClick={() => removeLabCategory(ci, cati)}><Trash2 className="size-3.5 text-destructive" /></Button>
                      </div>
                    ))}
                    {comp.categories.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Category sum: {catSum}%</span>
                      </div>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => addLabCategory(ci)} className="text-xs"><Plus className="size-3" /> Category</Button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            {errors.map((e, i) => (
              <p key={i} className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400"><AlertTriangle className="size-3" /> {e}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  function TransmutationEditor({ table, onSave, onCancel }: { table: TransmutationTable; onSave: (t: TransmutationTable) => void; onCancel: () => void }) {
    const [draft, setDraft] = useState<TransmutationTable>({ ...table, entries: table.entries.map(e => ({ ...e })) })

    function addEntry() {
      setDraft((prev) => ({ ...prev, entries: [...prev.entries, { min: 0, max: 100, equivalent: 5.0 }] }))
    }

    function updateEntry(index: number, field: keyof TransmutationEntry, value: number) {
      setDraft((prev) => {
        const entries = [...prev.entries]
        entries[index] = { ...entries[index], [field]: value }
        return { ...prev, entries }
      })
    }

    function removeEntry(index: number) {
      setDraft((prev) => ({ ...prev, entries: prev.entries.filter((_, i) => i !== index) }))
    }

    const sorted = [...draft.entries].sort((a, b) => b.max - a.max)

    return (
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{table.id ? "Edit" : "New"} Transmutation Table</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={() => onSave(draft)} className="rounded-lg"><Save className="size-4" /> Save</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
            <Input value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} className="rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Type</label>
            <select value={draft.subjectType} onChange={(e) => setDraft((prev) => ({ ...prev, subjectType: e.target.value as "Lecture" | "Lecture with Lab" | "All" }))}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background">
              <option value="All">All</option>
              <option value="Lecture">Lecture</option>
              <option value="Lecture with Lab">Lecture with Lab</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))} />
              Active
            </label>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Entries ({sorted.length})</h4>
            <Button size="sm" variant="outline" onClick={addEntry} className="rounded-lg"><Plus className="size-3.5" /> Add</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Min %</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Max %</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase">Equivalent</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {sorted.map((entry, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">
                      <Input type="number" value={entry.min} onChange={(e) => updateEntry(i, "min", Number(e.target.value))} className="w-24 rounded-lg" />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" value={entry.max} onChange={(e) => updateEntry(i, "max", Number(e.target.value))} className="w-24 rounded-lg" />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" step="0.25" value={entry.equivalent} onChange={(e) => updateEntry(i, "equivalent", Number(e.target.value))} className="w-24 rounded-lg" />
                    </td>
                    <td className="px-4 py-2">
                      <Button size="sm" variant="ghost" onClick={() => removeEntry(i)}><Trash2 className="size-3.5 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function ActiveSchemePreview({ schemes }: { schemes: GradingScheme[] }) {
    const activeSchemes = schemes.filter((s) => s.isActive)
    if (activeSchemes.length === 0) return null

    return (
      <div className="mb-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Grading Formula Applied</p>
        {activeSchemes.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <p className="font-semibold text-foreground">{s.subjectType}</p>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">Active</span>
              <span className="text-xs text-muted-foreground">— {s.name}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.components.map((comp) => {
                const catTotal = comp.categories.reduce((sum, c) => sum + c.weight, 0)
                return (
                  <span key={comp.name} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                    {comp.name}: <strong>{comp.weight}%</strong>
                    {comp.categories.length > 0 && (
                      <span className="text-muted-foreground">
                        ({comp.categories.map((c) => `${c.name} ${c.weight}%`).join(", ")})
                      </span>
                    )}
                    <span className="text-muted-foreground">{catTotal}%</span>
                  </span>
                )
              })}
              {s.subjectType === "Lecture with Lab" && s.labComponents?.map((comp) => (
                <span key={comp.name} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                  {comp.name}: <strong>{comp.weight}%</strong>
                  {comp.categories.length > 0 && (
                    <span className="text-muted-foreground">
                      ({comp.categories.map((c) => `${c.name} ${c.weight}%`).join(", ")})
                    </span>
                  )}
                </span>
              ))}
              {s.subjectType === "Lecture with Lab" && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                  Lecture {s.lectureWeight}% / Lab {s.laboratoryWeight}%
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Final Grade = <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">(Midterm Grade + Tentative Final Grade) ÷ 2</code> &rarr; Transmute
            </p>
          </div>
        ))}
      </div>
    )
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
            <SchemeEditor scheme={editingScheme} onSave={saveScheme} onCancel={() => setEditingScheme(null)} />
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
