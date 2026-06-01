"use client"

import { Download, Image as ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { csoReportsSeed } from "../../data/portal-data"
import { downloadFile } from "../../lib/downloads"
import { Panel, StatusBadge } from "../shared/dashboard-ui"

export function CsoModule() {
  const accomplishments = csoReportsSeed.filter(
    (report) => report.type === "Accomplishment" || report.type === "Event"
  )
  const financials = csoReportsSeed.filter((report) => report.type === "Financial")

  return (
    <div className="space-y-5">
      <Panel title="CSSO Organizational Chart" eyebrow="Officers and adviser">
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-center text-foreground/70">
          <div>
            <ImageIcon className="mx-auto size-10 text-foreground/60" />
            <p className="mt-3 text-sm font-medium">
              Organizational chart picture placeholder
            </p>
          </div>
        </div>
      </Panel>

      <ReportGrid title="Accomplishment Reports" reports={accomplishments} />
      <ReportGrid title="Financial Reports" reports={financials} />
      <ReportGrid title="Transparency Documents" reports={csoReportsSeed} />
    </div>
  )
}

function ReportGrid({
  title,
  reports,
}: {
  title: string
  reports: typeof csoReportsSeed
}) {
  return (
    <Panel title={title} eyebrow="CSSO transparency documents">
      <div className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <article
            key={`${title}-${report.id}`}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
          >
            <StatusBadge value={report.type} />

            <h4 className="mt-3 font-semibold text-foreground">
              {report.title}
            </h4>

            <p className="mt-1 text-sm text-foreground/70">{report.date}</p>

            <p className="mt-3 text-sm leading-6 text-foreground/80">
              {report.summary}
            </p>

            {report.total ? (
              <p className="mt-3 text-sm font-semibold text-foreground">
                {report.total}
              </p>
            ) : null}

            <Button
              size="sm"
              variant="outline"
              className="mt-4 rounded-2xl"
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