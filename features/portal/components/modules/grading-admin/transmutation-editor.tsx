import { useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TransmutationTable, TransmutationEntry } from "@/lib/types"

export function TransmutationEditor({ table, onSave, onCancel }: { table: TransmutationTable; onSave: (t: TransmutationTable) => void; onCancel: () => void }) {
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
          <Select value={draft.subjectType} onValueChange={(value) => setDraft((prev) => ({ ...prev, subjectType: value as "Lecture" | "Lecture with Lab" | "All" }))}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Lecture">Lecture</SelectItem>
              <SelectItem value="Lecture with Lab">Lecture with Lab</SelectItem>
            </SelectContent>
          </Select>
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
          <h4 className="text-sm font-bold text-foreground">Entries ({draft.entries.length})</h4>
          <Button size="sm" variant="outline" onClick={addEntry} className="rounded-lg"><Plus className="size-3.5" /> Add</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Min %</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Max %</th>
                <th className="px-4 py-2 text-center text-xs font-semibold uppercase">Equivalent</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {draft.entries.map((entry, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">
                      <Input type="number" value={entry.min} onChange={(e) => updateEntry(i, "min", Number(e.target.value))} className="w-24 rounded-lg text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <Input type="number" value={entry.max} onChange={(e) => updateEntry(i, "max", Number(e.target.value))} className="w-24 rounded-lg text-right" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Input type="number" step="0.25" value={entry.equivalent} onChange={(e) => updateEntry(i, "equivalent", Number(e.target.value))} className="w-24 rounded-lg text-center" />
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
