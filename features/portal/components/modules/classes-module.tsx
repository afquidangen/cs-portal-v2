"use client"

import { scheduleSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function ClassesModule({ model }: PortalModuleProps) {
  const { role, roster, setRoster } = model

  if (role === "faculty") {
    return (
      <Panel title="Manage Class" eyebrow="Checklist enrollment">
        <div className="space-y-3">
          {roster.map((student) => (
            <label
              key={student.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
            >
              <div>
                <p className="font-medium text-slate-950">{student.name}</p>
                <p className="text-sm text-slate-500">
                  {student.id} - {student.section}
                </p>
              </div>
              <input
                type="checkbox"
                checked={student.enrolled}
                onChange={(event) =>
                  setRoster((current) =>
                    current.map((item) =>
                      item.id === student.id
                        ? { ...item, enrolled: event.target.checked }
                        : item
                    )
                  )
                }
                className="size-5 rounded border-slate-300"
              />
            </label>
          ))}
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Classes Management" eyebrow="Schedules and sections">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Section</th>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Instructor</th>
              <th className="py-2 pr-4">Schedule</th>
              <th className="py-2">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scheduleSeed.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {item.section}
                </td>
                <td className="py-3 pr-4 text-slate-600">{item.subject}</td>
                <td className="py-3 pr-4 text-slate-600">
                  {item.instructor}
                </td>
                <td className="py-3 pr-4 text-slate-600">
                  {item.day}, {item.time}
                </td>
                <td className="py-3 text-slate-600">{item.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
