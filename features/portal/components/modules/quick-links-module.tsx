"use client"

import { Link as LinkIcon } from "lucide-react"

import { quickLinksSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"

export function QuickLinksModule() {
  return (
    <Panel title="Quick Links" eyebrow="Department resources">
      <div className="grid gap-3 md:grid-cols-3">
        {quickLinksSeed.map((link) => (
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
    </Panel>
  )
}