"use client"

import { Clock, Filter, RefreshCw, Search, User } from "lucide-react"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { Panel, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function AuditModule({ model }: PortalModuleProps) {
  const { auditLogs } = model
  const [search, setSearch] = useState("")
  const [actorFilter, setActorFilter] = useState("All")

  const actors = Array.from(new Set(auditLogs.map((log: { actor: string }) => log.actor)))

  const filtered = auditLogs.filter((log: { actor: string; action: string }) => {
    if (actorFilter !== "All" && log.actor !== actorFilter) return false
    if (search && !log.action.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <Panel
      title="Audit Trail"
      eyebrow="System-wide activity log"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions..."
              className="h-8 w-44 rounded-xl pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{auditLogs.length} entries</span>
          </div>
        </div>
      }
    >
      {actors.length > 1 ? (
        <div className="mb-4 flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="h-8 w-44 rounded-xl text-xs">
              <SelectValue placeholder="Filter by actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Actors</SelectItem>
              {actors.map((actor: string) => (
                <SelectItem key={actor} value={actor}>{actor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <RefreshCw className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No audit logs found.
            </p>
            <p className="text-xs text-muted-foreground/60">
              {search || actorFilter !== "All"
                ? "Try adjusting your filters."
                : "Activity will appear here as actions are performed."}
            </p>
          </div>
        ) : (
          filtered.map((log: { id: string; actor: string; action: string; time: string }, index: number) => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md",
                index === 0 && "ring-1 ring-primary/10"
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {log.action}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {log.actor}
                    </p>
                  </div>
                  <StatusBadge value={log.time} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}
