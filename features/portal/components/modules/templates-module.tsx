"use client"

import { Download, FileSpreadsheet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import type { PortalModuleProps } from "./types"

export function TemplatesModule({ model }: PortalModuleProps) {
  const { downloadUserTemplate, setUploadName, uploadName } = model

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Templates and Uploads</h1>
        <p className="mt-2 text-sm text-slate-600">Download data gathering templates and upload CSV/Excel files.</p>
      </div>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardContent className="p-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FileSpreadsheet className="size-8 text-blue-600" />
          <h4 className="mt-3 font-semibold text-slate-950">
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FileSpreadsheet className="size-8 text-blue-600" />
          <h4 className="mt-3 font-semibold text-slate-950">
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
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FileSpreadsheet className="size-8 text-blue-600" />
          <h4 className="mt-3 font-semibold text-slate-950">Upload Excel File</h4>
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
        </CardContent>
      </Card>
    </div>
  )
}
