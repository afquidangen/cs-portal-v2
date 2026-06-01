"use client"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AuditModule({ model }: PortalModuleProps) {
  const { auditLogs } = model

  return (
    <Panel title="Audit Trail" eyebrow="Grade changes and actions">
      <div className="space-y-3">
        {auditLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No audit logs yet.
          </p>
        ) : (
          auditLogs.map((log: { id: string; actor: string; action: string; time: string }) => (
            <div key={log.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.actor}
                  </p>
                </div>
                <StatusBadge value={log.time} />
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}
