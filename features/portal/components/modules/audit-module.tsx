"use client"

import { auditLogsSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"

export function AuditModule() {
  return (
    <Panel title="Audit Trail" eyebrow="Grade changes and actions">
      <div className="space-y-3">
        {auditLogsSeed.map((log) => (
          <div key={log.id} className="rounded-lg border border-slate-200 p-4">
            <p className="font-medium text-slate-950">{log.action}</p>
            <p className="mt-1 text-sm text-slate-500">
              {log.actor} - {log.time}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
