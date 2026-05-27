"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"

import { csoReportsSeed } from "../../data/portal-data"
import { downloadFile } from "../../lib/downloads"
import { Panel, StatusBadge } from "../shared/dashboard-ui"

export function CsoModule() {
  return (
    <Panel title="CSSO Transparency Reports" eyebrow="Events and records">
      <div className="grid gap-4 lg:grid-cols-3">
        {csoReportsSeed.map((report) => (
          <article
            key={report.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <StatusBadge value={report.type} />
            <h4 className="mt-3 font-semibold text-slate-950">
              {report.title}
            </h4>
            <p className="mt-1 text-sm text-slate-500">{report.date}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {report.summary}
            </p>
            {report.total ? (
              <p className="mt-3 text-sm font-semibold text-emerald-700">
                {report.total}
              </p>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() =>
                downloadFile(
                  `${report.id}.txt`,
                  `${report.title}\n${report.date}\n\n${report.summary}`,
                  "text/plain"
                )
              }
            >
              <Download className="size-4" />
              Download
            </Button>
          </article>
        ))}
      </div>
    </Panel>
  )
}
