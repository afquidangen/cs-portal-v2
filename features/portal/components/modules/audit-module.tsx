"use client"

import { auditLogsSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"

export function AuditModule() {
  return (
    <Panel title="Audit Trail" eyebrow="Grade changes and actions">
      <div className="space-y-3">
        {auditLogsSeed.map((log) => (
          <div key={log.id} className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50">
            <p className="font-medium text-abyss dark:text-quartz">{log.action}</p>
            <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
              {log.actor} - {log.time}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
