import { useMemo, useState } from "react"
import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GradingScheme } from "@/lib/types"

type SchemeComponent = GradingScheme["components"][number]
type Category = SchemeComponent["categories"][number]

function emptyComponent(name = ""): SchemeComponent {
  return { name, weight: 0, categories: [] }
}

function emptyCategory(name = ""): Category {
  return { name, weight: 0 }
}

function validateSchemeWeights(scheme: GradingScheme): string[] {
  const errors: string[] = []
  if (scheme.components.length > 0) {
    const compTotal = scheme.components.reduce((s, c) => s + c.weight, 0)
    if (Math.abs(compTotal - 100) > 0.01) errors.push(`Component weights sum to ${compTotal}%, must be 100%.`)
  }
  const labComps = scheme.labComponents ?? []
  if (scheme.subjectType === "Lecture with Lab" && labComps.length > 0) {
    const labTotal = labComps.reduce((s, c) => s + c.weight, 0)
    if (Math.abs(labTotal - 100) > 0.01) errors.push(`Lab component weights sum to ${labTotal}%, must be 100%.`)
  }
  for (const comp of scheme.components) {
    if (comp.categories.length > 0) {
      const catSum = comp.categories.reduce((s, c) => s + c.weight, 0)
      if (Math.abs(catSum - 100) > 0.01) errors.push(`"${comp.name || "Untitled"}" categories sum to ${catSum}%, must be 100%.`)
    }
  }
  for (const comp of labComps) {
    if (comp.categories.length > 0) {
      const catSum = comp.categories.reduce((s, c) => s + c.weight, 0)
      if (Math.abs(catSum - 100) > 0.01) errors.push(`"${comp.name || "Untitled"}" categories sum to ${catSum}%, must be 100%.`)
    }
  }
  if (scheme.subjectType === "Lecture with Lab") {
    if ((scheme.lectureWeight ?? 0) + (scheme.laboratoryWeight ?? 0) !== 100) {
      errors.push(`Lecture weight (${scheme.lectureWeight ?? 0}%) + Laboratory weight (${scheme.laboratoryWeight ?? 0}%) must equal 100%.`)
    }
  }
  return errors
}

export function SchemeEditor({ scheme, onSave, onCancel }: { scheme: GradingScheme; onSave: (s: GradingScheme) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<GradingScheme>({
    ...scheme,
    components: scheme.components.map(c => ({ ...c, categories: c.categories.map(cat => ({ ...cat })) })),
    labComponents: scheme.labComponents?.map(c => ({ ...c, categories: c.categories.map(cat => ({ ...cat })) })),
  })
  console.log("[EDITOR] init cats:", JSON.stringify(draft.components[0]?.categories))
  const errors = useMemo(() => validateSchemeWeights(draft), [draft])

  function updateField<K extends keyof GradingScheme>(key: K, value: GradingScheme[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function addComponent() {
    setDraft((prev) => ({ ...prev, components: [...prev.components, emptyComponent("")] }))
  }

  function updateComponent(index: number, field: keyof SchemeComponent, value: string | number | boolean) {
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

  function updateCategory(compIndex: number, catIndex: number, field: keyof Category, value: string | number | boolean) {
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

  function updateLabComponent(index: number, field: keyof SchemeComponent, value: string | number | boolean) {
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

  function updateLabCategory(compIndex: number, catIndex: number, field: keyof Category, value: string | number | boolean) {
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
          <Select value={draft.subjectType} onValueChange={(value) => updateField("subjectType", value as "Lecture" | "Lecture with Lab")}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lecture">Lecture</SelectItem>
              <SelectItem value="Lecture with Lab">Lecture with Lab</SelectItem>
            </SelectContent>
          </Select>
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
             <Input type="number" value={draft.lectureWeight ?? 40} onChange={(e) => { const r = e.target.value; if (r === "") return; updateField("lectureWeight", Number(r)) }} className="rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laboratory Weight (%)</label>
             <Input type="number" value={draft.laboratoryWeight ?? 60} onChange={(e) => { const r = e.target.value; if (r === "") return; updateField("laboratoryWeight", Number(r)) }} className="rounded-xl" />
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
          <h4 className="text-sm font-bold text-foreground">Components <span className={`ml-2 text-xs font-normal ${draft.components.length === 0 ? "text-muted-foreground" : Math.abs(draft.components.reduce((s, c) => s + c.weight, 0) - 100) < 0.01 ? "text-emerald-600" : "text-red-500"}`}>
            (Sum: {draft.components.reduce((s, c) => s + c.weight, 0)}%)
          </span></h4>
          <Button size="sm" variant="outline" onClick={addComponent} className="rounded-lg"><Plus className="size-3.5" /> Add</Button>
        </div>
        <div className="space-y-3">
          {draft.components.map((comp, ci) => {
            const catSum = comp.categories.reduce((s, c) => s + c.weight, 0)
            return (
            <div key={ci} className="rounded-xl border border-border border-l-2 border-l-primary/20 bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Input placeholder="Component name" value={comp.name} onChange={(e) => updateComponent(ci, "name", e.target.value)} className="flex-1 rounded-lg" />
                <div className="flex items-center gap-1 text-sm">
                  <div className="relative">
                    <Input type="number" value={comp.weight} onChange={(e) => { const r = e.target.value; if (r === "") return; updateComponent(ci, "weight", Number(r)) }} className="w-20 rounded-lg pr-6 text-right" />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <Select value={comp.isExam ? "exam" : "component"} onValueChange={(value) => updateComponent(ci, "isExam", value === "exam")}>
                  <SelectTrigger className="h-10 w-[110px] rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="component">Component</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => removeComponent(ci)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
              <div className="ml-4 space-y-2">
                {comp.categories.map((cat, cati) => (
                  <div key={cati} className="flex items-center gap-2">
                    <Input placeholder="Category name" value={cat.name} onChange={(e) => updateCategory(ci, cati, "name", e.target.value)} className="flex-1 rounded-lg" />
                    <Input type="number" value={cat.weight} onChange={(e) => { const r = e.target.value; if (r === "") return; updateCategory(ci, cati, "weight", Number(r)) }} className="w-20 rounded-lg text-right" /><span className="text-xs text-muted-foreground">%</span>
                    <Select value={cat.isAttendance ? "attendance" : "regular"} onValueChange={(value) => updateCategory(ci, cati, "isAttendance", value === "attendance")}>
                      <SelectTrigger className="h-10 w-[120px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                      </SelectContent>
                    </Select>
                    {cat.isAttendance && (
                      <Input type="number" step="0.1" min="0" value={cat.penaltyPerAbsence ?? 0.6} onChange={(e) => { const r = e.target.value; if (r === "") return; updateCategory(ci, cati, "penaltyPerAbsence", Number(r)) }} className="w-16 rounded-lg text-right" title="Penalty per absence" />
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeCategory(ci, cati)}><Trash2 className="size-3.5 text-destructive" /></Button>
                  </div>
                ))}
                {comp.categories.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={Math.abs(catSum - 100) < 0.01 ? "text-emerald-600" : "text-red-500"}>Category sum: {catSum}%</span>
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
            <h4 className="text-sm font-bold text-foreground">Lab Components <span className={`ml-2 text-xs font-normal ${(draft.labComponents ?? []).length === 0 ? "text-muted-foreground" : Math.abs((draft.labComponents ?? []).reduce((s, c) => s + c.weight, 0) - 100) < 0.01 ? "text-emerald-600" : "text-red-500"}`}>
              (Sum: {(draft.labComponents ?? []).reduce((s, c) => s + c.weight, 0)}%)
            </span></h4>
            <Button size="sm" variant="outline" onClick={addLabComponent} className="rounded-lg"><Plus className="size-3.5" /> Add</Button>
          </div>
          <div className="space-y-3">
            {(draft.labComponents ?? []).map((comp, ci) => {
              const catSum = comp.categories.reduce((s, c) => s + c.weight, 0)
              return (
              <div key={ci} className="rounded-xl border border-border border-l-2 border-l-primary/20 bg-muted/30 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Input placeholder="Component name" value={comp.name} onChange={(e) => updateLabComponent(ci, "name", e.target.value)} className="flex-1 rounded-lg" />
                <div className="flex items-center gap-1 text-sm">
                  <div className="relative">
                    <Input type="number" value={comp.weight} onChange={(e) => { const r = e.target.value; if (r === "") return; updateLabComponent(ci, "weight", Number(r)) }} className="w-20 rounded-lg pr-6 text-right" />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  </div>
                  <Select value={comp.isExam ? "exam" : "component"} onValueChange={(value) => updateLabComponent(ci, "isExam", value === "exam")}>
                    <SelectTrigger className="h-10 w-[110px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="component">Component</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => removeLabComponent(ci)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
                <div className="ml-4 space-y-2">
                  {comp.categories.map((cat, cati) => (
                    <div key={cati} className="flex items-center gap-2">
                      <Input placeholder="Category name" value={cat.name} onChange={(e) => updateLabCategory(ci, cati, "name", e.target.value)} className="flex-1 rounded-lg" />
                      <Input type="number" value={cat.weight} onChange={(e) => { const r = e.target.value; if (r === "") return; updateLabCategory(ci, cati, "weight", Number(r)) }} className="w-20 rounded-lg text-right" /><span className="text-xs text-muted-foreground">%</span>
                        <Select value={cat.isAttendance ? "attendance" : "regular"} onValueChange={(value) => updateLabCategory(ci, cati, "isAttendance", value === "attendance")}>
                          <SelectTrigger className="h-10 w-[120px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="attendance">Attendance</SelectItem>
                          </SelectContent>
                        </Select>
                      {cat.isAttendance && (
                        <Input type="number" step="0.1" min="0" value={cat.penaltyPerAbsence ?? 0.6} onChange={(e) => { const r = e.target.value; if (r === "") return; updateLabCategory(ci, cati, "penaltyPerAbsence", Number(r)) }} className="w-16 rounded-lg text-right" title="Penalty per absence" />
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeLabCategory(ci, cati)}><Trash2 className="size-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                  {comp.categories.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={Math.abs(catSum - 100) < 0.01 ? "text-emerald-600" : "text-red-500"}>Category sum: {catSum}%</span>
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
