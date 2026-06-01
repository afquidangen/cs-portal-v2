"use client"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function InstructorsModule({ model }: PortalModuleProps) {
  const { faculty } = model

  return (
    <Panel title="Instructor Information" eyebrow="Faculty profiles">
      <div className="grid gap-4 lg:grid-cols-2">
        {faculty.map((member) => (
          <article
            key={member.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-foreground">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>
                <h4 className="font-semibold text-foreground">
                  {member.name}
                </h4>
                <p className="text-sm text-foreground/70">{member.position}</p>
                <p className="mt-2 text-sm text-foreground/80">
                  {member.education}
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  {member.email}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
