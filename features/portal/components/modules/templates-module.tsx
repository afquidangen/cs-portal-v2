"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function TemplatesModule({ model }: PortalModuleProps) {
  const { downloadUserTemplate, setUploadName, uploadName } = model

  return (
    <Panel title="Templates and Uploads" eyebrow="Data gathering">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-950">
            Student Account Template
          </h4>
          <p className="mt-2 text-sm text-slate-500">
            CSV fields for name, email, course, year, and section.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => downloadUserTemplate("student")}
          >
            <Download className="size-4" />
            Download
          </Button>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-950">
            Faculty Account Template
          </h4>
          <p className="mt-2 text-sm text-slate-500">
            CSV fields for name, email, position, and department role.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => downloadUserTemplate("faculty")}
          >
            <Download className="size-4" />
            Download
          </Button>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h4 className="font-semibold text-slate-950">Upload Excel File</h4>
          <p className="mt-2 text-sm text-slate-500">{uploadName}</p>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) =>
              setUploadName(event.target.files?.[0]?.name ?? "No file selected")
            }
            className="mt-4 h-9 rounded-lg"
          />
        </div>
      </div>
    </Panel>
  )
}
