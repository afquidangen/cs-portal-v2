"use client"

import { scheduleSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"

export function SchedulePanel() {
  return (
    <Panel title="Weekly Schedule" eyebrow="Classes">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Day</th>
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Instructor</th>
              <th className="py-2">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scheduleSeed.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {item.day}
                </td>
                <td className="py-3 pr-4 text-slate-600">{item.time}</td>
                <td className="py-3 pr-4 text-slate-600">{item.subject}</td>
                <td className="py-3 pr-4 text-slate-600">
                  {item.instructor}
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
