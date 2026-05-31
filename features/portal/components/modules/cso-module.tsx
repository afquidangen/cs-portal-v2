"use client"

import { Download, Users } from "lucide-react"

import { Button } from "@/components/ui/button"

import { csoReportsSeed } from "../../data/portal-data"
import { downloadFile } from "../../lib/downloads"
import { Panel, StatusBadge } from "../shared/dashboard-ui"

export function CsoModule() {
  return (
    <div className="space-y-5">
      <Panel title="CSSO Organizational Chart" eyebrow="Officers and Adviser">
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-glacier bg-quartz p-12 dark:border-lapis dark:bg-abyss/30">
          <div className="text-center">
            <Users className="mx-auto size-12 text-slate-blue dark:text-glacier" />
            <p className="mt-4 text-sm text-slate-blue dark:text-glacier">
              Organizational chart image will be placed here
            </p>
            <p className="mt-1 text-xs text-slate-blue dark:text-glacier">
              (CSSO Officers and Adviser with pictures)
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="CSSO Transparency Documents" eyebrow="Accomplishment and financial reports">
        <div className="grid gap-4 lg:grid-cols-3">
          {csoReportsSeed.map((report) => (
            <article
              key={report.id}
              className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50"
            >
              <StatusBadge value={report.type} />
              <h4 className="mt-3 font-semibold text-abyss dark:text-quartz">
                {report.title}
              </h4>
              <p className="mt-1 text-sm text-slate-blue dark:text-glacier">{report.date}</p>
              <p className="mt-3 text-sm leading-6 text-slate-blue dark:text-glacier">
                {report.summary}
              </p>
              {report.total ? (
                <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
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
    </div>
  )
}
