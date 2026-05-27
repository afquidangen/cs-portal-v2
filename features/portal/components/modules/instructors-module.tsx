"use client"

import { Building2 } from "lucide-react"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function InstructorsModule({ model }: PortalModuleProps) {
  const { faculty } = model

  return (
    <div className="space-y-5">
      <Panel title="Instructor Information" eyebrow="Faculty profiles">
        <div className="grid gap-4 lg:grid-cols-2">
          {faculty.map((member) => (
            <article
              key={member.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {member.name}
                  </h4>
                  <p className="text-sm text-slate-500">{member.position}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {member.education}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {member.email}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Department Organizational Chart" eyebrow="Structure">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Program Chair", "Computing Studies Unit"],
            ["Research Coordinator", "Thesis and capstone review"],
            ["Faculty Members", "Instruction and consultation"],
            ["CSSO Officers", "Events and student records"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <Building2 className="mb-3 size-5 text-slate-600" />
              <h4 className="font-semibold text-slate-950">{title}</h4>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
