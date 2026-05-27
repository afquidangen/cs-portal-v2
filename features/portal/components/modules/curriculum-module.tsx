"use client"

import { CheckCircle2 } from "lucide-react"

import { curriculumSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"

export function CurriculumModule() {
  return (
    <Panel title="Current Curriculum" eyebrow="Plan and guide">
      <div className="grid gap-4 lg:grid-cols-2">
        {curriculumSeed.map((term) => (
          <article
            key={`${term.year}-${term.term}`}
            className="rounded-lg border border-slate-200 p-4"
          >
            <h4 className="font-semibold text-slate-950">
              {term.year} - {term.term}
            </h4>
            <ul className="mt-3 space-y-2">
              {term.subjects.map((subject) => (
                <li
                  key={subject}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {subject}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Panel>
  )
}
