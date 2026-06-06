"use client"

import { FileText, Link as LinkIcon } from "lucide-react"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function QuickLinksModule({ model }: PortalModuleProps) {
  const quickLinks = model.quickLinks
  return (
    <>
      <Panel title="Quick Links" eyebrow="Department resources">
        {quickLinks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No quick links available.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
              >
                {link.label}
                <LinkIcon className="size-4 text-foreground/80" />
              </a>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Downloadables" eyebrow="ISPSC resources">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-foreground">ISPSC Student Manual</p>
              <p className="text-xs text-foreground/60">PDF document</p>
            </div>
            <FileText className="size-5 text-foreground/60" />
          </div>
        </div>
      </Panel>
    </>
  )
}
