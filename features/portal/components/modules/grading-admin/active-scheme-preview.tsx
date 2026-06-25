import { GraduationCap } from "lucide-react"
import type { GradingScheme } from "@/lib/types"

export function ActiveSchemePreview({ schemes }: { schemes: GradingScheme[] }) {
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
                <span key={comp.name} className="rounded-md bg-muted px-2 py-1 text-xs">
                  <span className="font-medium text-foreground">{comp.name}</span>: <strong>{comp.weight}%</strong>
                  {comp.categories.length > 0 && (
                    <span className="ml-1.5 inline-flex flex-wrap gap-1">
                      {comp.categories.map((c) => (
                        <span key={c.name} className="text-muted-foreground">
                          {c.name} {c.weight}%
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              )
            })}
            {s.subjectType === "Lecture with Lab" && s.labComponents?.map((comp) => (
              <span key={comp.name} className="rounded-md bg-muted px-2 py-1 text-xs">
                <span className="font-medium text-foreground">{comp.name}</span>: <strong>{comp.weight}%</strong>
                {comp.categories.length > 0 && (
                  <span className="ml-1.5 inline-flex flex-wrap gap-1">
                    {comp.categories.map((c) => (
                      <span key={c.name} className="text-muted-foreground">
                        {c.name} {c.weight}%
                      </span>
                    ))}
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
