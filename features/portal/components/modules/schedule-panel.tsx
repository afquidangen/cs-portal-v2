"use client"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function SchedulePanel({ model }: PortalModuleProps) {
  const schedules = model.visibleSchedules

  return (
    <Panel title="Weekly Schedule" eyebrow="Classes">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-muted text-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Day
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Time
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Instructor
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Room
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border bg-card">
            {schedules.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">
                  {item.day}
                </td>
                <td className="px-4 py-3 text-foreground/80">{item.time}</td>
                <td className="px-4 py-3 text-foreground/80">{item.subject}</td>
                <td className="px-4 py-3 text-foreground/80">
                  {item.instructor}
                </td>
                <td className="px-4 py-3 text-foreground/80">{item.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
