"use client"

import Image from "next/image"
import { Download, ExternalLink, Eye, FileText, ImageIcon, Loader2, Megaphone, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { CsoReport } from "../../data/portal-data"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalDashboardModel } from "../../hooks/use-portal-dashboard-model"

export function CsoModule({ model }: { model: PortalDashboardModel }) {
  const [editingReport, setEditingReport] = useState<CsoReport | null>(null)
  const [deletingReport, setDeletingReport] = useState<CsoReport | null>(null)
  const [viewingReport, setViewingReport] = useState<CsoReport | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [constitutionDoc, setConstitutionDoc] = useState<{ href: string; fileName?: string; fileSize?: number } | null>(null)
  const [constitutionUploading, setConstitutionUploading] = useState(false)
  const [showConstitutionUpload, setShowConstitutionUpload] = useState(false)

  const [orgChartUrl, setOrgChartUrl] = useState<string | null>(null)
  const [showOrgChartUpload, setShowOrgChartUpload] = useState(false)
  const [orgChartUploading, setOrgChartUploading] = useState(false)

  const [addReportType, setAddReportType] = useState<CsoReport["type"] | null>(null)

  const isAdmin = model.role === "admin"

  const accomplishments = model.csoReports.filter(
    (report: CsoReport) => report.type === "Accomplishment" || report.type === "Event"
  )
  const financials = model.csoReports.filter((report: CsoReport) => report.type === "Financial")
  const records = model.csoReports.filter((report: CsoReport) => report.type === "Record")

  function handleSave(report: CsoReport) {
    const existing = model.csoReports.find((r: CsoReport) => r.id === report.id)
    if (existing) {
      model.handleUpdateCsoReport(report)
    } else {
      model.handleCreateCsoReport(report)
    }
    setShowForm(false)
    setEditingReport(null)
    setAddReportType(null)
  }

  function handleDelete(id: string) {
    model.handleDeleteCsoReport(id)
    setDeletingReport(null)
  }

  useEffect(() => {
    fetch("/api/portal/governing-document")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setConstitutionDoc(json.data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/portal/org-chart")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.imageUrl) setOrgChartUrl(json.data.imageUrl)
      })
      .catch(() => {})
  }, [])

  async function handleConstitutionDownload() {
    if (!constitutionDoc) return
    try {
      const res = await fetch(constitutionDoc.href)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = constitutionDoc.fileName || "CSSO-Constitution.pdf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(constitutionDoc.href, "_blank")
    }
  }

  async function handleConstitutionUpload(base64: string, fileName: string) {
    setConstitutionUploading(true)
    try {
      const res = await fetch("/api/portal/governing-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ href: base64, fileName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed.")
      if (json.data) setConstitutionDoc(json.data)
    } catch {
      toast.error("Failed to upload constitution.")
      setConstitutionUploading(false)
      return
    }
    setShowConstitutionUpload(false)
    setConstitutionUploading(false)
    toast.success("Constitution uploaded successfully.")
  }

  async function handleDeleteConstitution() {
    if (!constitutionDoc) return
    model.setPendingConfirm({
      title: "Delete Constitution",
      description: "Delete the Constitution and By Laws PDF? This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/portal/governing-document", { method: "DELETE" })
          if (!res.ok) throw new Error("Failed to delete.")
          setConstitutionDoc(null)
          toast.success("Constitution deleted successfully.")
        } catch {
          toast.error("Failed to delete constitution.")
        }
      },
    })
  }

  async function handleOrgChartUpload(base64: string) {
    setOrgChartUploading(true)
    try {
      const res = await fetch("/api/portal/org-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: base64 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed.")
      if (json.data?.imageUrl) setOrgChartUrl(json.data.imageUrl)
    } catch {
      toast.error("Failed to upload organizational chart.")
      setOrgChartUploading(false)
      return
    }
    setShowOrgChartUpload(false)
    setOrgChartUploading(false)
    toast.success("Organizational chart uploaded successfully.")
  }

  async function handleDeleteOrgChart() {
    if (!orgChartUrl) return
    model.setPendingConfirm({
      title: "Delete Organizational Chart",
      description: "Delete the organizational chart image? This action cannot be undone.",
      variant: "destructive",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/portal/org-chart", { method: "DELETE" })
          if (!res.ok) throw new Error("Failed to delete.")
          setOrgChartUrl(null)
          toast.success("Organizational chart deleted successfully.")
        } catch {
          toast.error("Failed to delete organizational chart.")
        }
      },
    })
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-xl border border-primary/15 bg-[linear-gradient(120deg,#f8fbff_0%,#eef7ff_56%,#f7fbff_100%)] px-5 py-8 text-center shadow-sm dark:border-[#1d3858] dark:bg-[linear-gradient(120deg,#071224_0%,#0b2038_58%,#123768_100%)] sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(36,120,255,0.08)_1px,transparent_1px),linear-gradient(rgba(36,120,255,0.06)_1px,transparent_1px)] bg-[size:38px_38px] opacity-50 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex size-32 items-center justify-center rounded-3xl border border-primary/20 bg-white/80 p-1.5 shadow-md dark:border-[#8bd3ff]/25 dark:bg-white/10">
            <Image
              src="/csso-logo.svg"
              alt="CSSO logo placeholder"
              width={200}
              height={250}
              className="size-full rounded-xl object-contain"
              priority={false}
            />
          </div>
          <h2 className="font-heading text-[2.65rem] font-black uppercase leading-tight tracking-[0.03em] text-foreground sm:text-[3.35rem]">
            COMPUTING STUDIES STUDENTS ORGANIZATION
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            The Computer Science Student Organization is the student-led home for CS leadership, events, transparency records, and community initiatives across the department.
          </p>
          <a
            href="https://www.facebook.com/nlpsccssocandon"
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#8bd3ff]/25 dark:bg-[#8bd3ff] dark:text-[#071224]"
          >
            Visit CSSO Facebook Page
            <ExternalLink className="size-4" />
          </a>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-primary dark:text-[#8bd3ff]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
              <Sparkles className="size-3.5" />
              Student leadership
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
              <Megaphone className="size-3.5" />
              Events and reports
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
              <FileText className="size-3.5" />
              Transparent records
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Accomplishments", value: String(accomplishments.length) },
          { label: "Financial Reports", value: String(financials.length) },
          { label: "All Documents", value: String(model.csoReports.length) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-primary/15 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#1d3858]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary dark:text-[#8bd3ff]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <Panel title="CSSO Organizational Chart" eyebrow="Officers and adviser">
        {orgChartUrl ? (
          <div className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src={orgChartUrl}
                alt="CSSO Organizational Chart"
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
            {isAdmin ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setShowOrgChartUpload(true)}>
                  <Upload className="size-4" />
                  Replace
                </Button>
                <Button size="sm" variant="destructive" className="rounded-lg" onClick={handleDeleteOrgChart}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="edu-bg-soft-glacier flex min-h-56 items-center justify-center rounded-xl border border-dashed border-[var(--edu-border-glacier)] text-center text-foreground/70">
            <div>
              <ImageIcon className="mx-auto size-10 text-foreground/60" />
              <p className="mt-3 text-sm font-medium">
                Organizational chart picture placeholder
              </p>
              {isAdmin ? (
                <Button size="sm" variant="outline" className="mt-4 rounded-lg" onClick={() => setShowOrgChartUpload(true)}>
                  <Upload className="size-4" />
                  Upload Image
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </Panel>

      <ReportGrid
        title="Accomplishment Reports"
        reports={accomplishments}
        isAdmin={isAdmin}
        onEdit={(r) => {
          setEditingReport(r)
          setShowForm(true)
        }}
        onDelete={(r) => setDeletingReport(r)}
        onView={(r) => setViewingReport(r)}
        onAdd={isAdmin ? () => {
          setEditingReport(null)
          setAddReportType("Accomplishment")
          setShowForm(true)
        } : undefined}
      />

      <ReportGrid
        title="Financial Reports"
        reports={financials}
        isAdmin={isAdmin}
        onEdit={(r) => {
          setEditingReport(r)
          setShowForm(true)
        }}
        onDelete={(r) => setDeletingReport(r)}
        onView={(r) => setViewingReport(r)}
        onAdd={isAdmin ? () => {
          setEditingReport(null)
          setAddReportType("Financial")
          setShowForm(true)
        } : undefined}
      />

      <ReportGrid
        title="Transparency Documents"
        reports={records}
        isAdmin={isAdmin}
        onEdit={(r) => {
          setEditingReport(r)
          setShowForm(true)
        }}
        onDelete={(r) => setDeletingReport(r)}
        onView={(r) => setViewingReport(r)}
        onAdd={isAdmin ? () => {
          setEditingReport(null)
          setAddReportType("Record")
          setShowForm(true)
        } : undefined}
      />

      <Panel title="CSSO Constitution and By Laws" eyebrow="Governing document">
        {constitutionDoc ? (
          <div className="edu-bg-soft-lapis flex flex-col gap-4 rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="size-6 shrink-0 text-foreground/60" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Constitution and By Laws</p>
                <p className="truncate text-xs text-foreground/60">
                  {constitutionDoc.fileName ?? "PDF document"}
                  {constitutionDoc.fileSize ? ` \u00B7 ${(constitutionDoc.fileSize / 1024).toFixed(0)} KB` : ""}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap sm:w-auto sm:justify-end">
              <Button size="sm" variant="outline" className="w-full rounded-lg min-[420px]:w-auto" onClick={handleConstitutionDownload}>
                <Download className="size-4" />
                Download
              </Button>
              {isAdmin ? (
                <>
                  <Button size="sm" variant="outline" className="w-full rounded-lg min-[420px]:w-auto" onClick={() => setShowConstitutionUpload(true)}>
                    <Upload className="size-4" />
                    Replace
                  </Button>
                  <Button size="sm" variant="destructive" className="w-full rounded-lg min-[420px]:w-auto" onClick={handleDeleteConstitution}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="edu-bg-soft-glacier flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--edu-border-glacier)] py-12 text-center">
            <FileText className="mx-auto mb-3 size-10 text-foreground/40" />
            <p className="text-sm text-foreground/60">No constitution uploaded yet.</p>
            {isAdmin ? (
              <Button size="sm" variant="outline" className="mt-3 rounded-lg" onClick={() => setShowConstitutionUpload(true)}>
                <Upload className="size-4" />
                Upload PDF
              </Button>
            ) : null}
          </div>
        )}
      </Panel>

      {showConstitutionUpload ? (
        <ConstitutionUploadDialog
          uploading={constitutionUploading}
          onSave={(base64, fileName) => handleConstitutionUpload(base64, fileName)}
          onClose={() => setShowConstitutionUpload(false)}
        />
      ) : null}

      {showOrgChartUpload ? (
        <OrgChartUploadDialog
          uploading={orgChartUploading}
          onSave={(base64) => handleOrgChartUpload(base64)}
          onClose={() => setShowOrgChartUpload(false)}
        />
      ) : null}

      {showForm ? (
        <ReportFormDialog
          report={editingReport}
          defaultType={addReportType}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingReport(null)
            setAddReportType(null)
          }}
        />
      ) : null}

      <Dialog open={!!deletingReport} onOpenChange={(open) => { if (!open) setDeletingReport(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Report</DialogTitle>
            <p className="pt-1 text-sm text-muted-foreground">
              Are you sure you want to delete &ldquo;{deletingReport?.title}&rdquo;? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deletingReport && handleDelete(deletingReport.id)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingReport} onOpenChange={(open) => { if (!open) setViewingReport(null) }}>
        <DialogContent className="max-w-2xl">
          {viewingReport ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge value={viewingReport.type} />
                </div>
                <DialogTitle className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {viewingReport.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{viewingReport.date}</p>
              </DialogHeader>

              <div className="space-y-4">
                {viewingReport.image ? (
                  <div className="overflow-hidden border border-border">
                    <Image
                      src={viewingReport.image}
                      alt={viewingReport.title}
                      width={800}
                      height={450}
                      className="w-full h-auto object-contain"
                      unoptimized
                    />
                  </div>
                ) : null}

                <p className="text-sm leading-7 text-foreground/85">
                  {viewingReport.summary}
                </p>

                {viewingReport.total ? (
                  <p className="text-sm font-semibold text-foreground">
                    {viewingReport.total}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReportGrid({
  title,
  reports,
  isAdmin,
  onEdit,
  onDelete,
  onView,
  onAdd,
}: {
  title: string
  reports: CsoReport[]
  isAdmin: boolean
  onEdit: (report: CsoReport) => void
  onDelete: (report: CsoReport) => void
  onView: (report: CsoReport) => void
  onAdd?: () => void
}) {
  return (
    <Panel
      title={title}
      eyebrow="CSSO transparency documents"
      actions={
        onAdd ? (
          <Button size="sm" variant="default" className="rounded-lg" onClick={onAdd}>
            <Plus className="size-4" />
            Add Report
          </Button>
        ) : undefined
      }
    >
      {reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/60">No reports to display.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {reports.map((report) => (
            <article
              key={`${title}-${report.id}`}
              className="group relative rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm transition-colors hover:shadow-md edu-bg-soft-lapis"
            >
              {report.image ? (
                <div className="mb-3 overflow-hidden rounded-xl border border-border">
                  <Image
                    src={report.image}
                    alt={report.title}
                    width={400}
                    height={144}
                    className="w-full h-auto object-contain"
                    unoptimized
                  />
                </div>
              ) : null}

              <StatusBadge value={report.type} />

              <h4 className="mt-3 font-semibold text-foreground">
                {report.title}
              </h4>

              <p className="mt-1 text-sm text-foreground/70">{report.date}</p>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80">
                {report.summary}
              </p>

              {report.total ? (
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {report.total}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {isAdmin ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => onEdit(report)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-lg"
                      onClick={() => onDelete(report)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => onView(report)}
                  >
                    <Eye className="size-4" />
                    Read
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}

function ConstitutionUploadDialog({
  uploading,
  onSave,
  onClose,
}: {
  uploading: boolean
  onSave: (pdf: string, fileName: string) => void
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Upload Constitution and By Laws</DialogTitle>
        </DialogHeader>
        <div className="relative space-y-4">
          {uploading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Uploading PDF\u2026</p>
            </div>
          )}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            />
          </div>
          {preview ? (
            <div className="rounded-2xl border border-border bg-muted p-3 text-center text-sm text-foreground/70">
              {file?.name ?? "File selected"}
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button onClick={() => preview && file && onSave(preview, file.name)} disabled={!preview || uploading}>
            {uploading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 size-4" />
            )}
            {uploading ? "Uploading\u2026" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OrgChartUploadDialog({
  uploading,
  onSave,
  onClose,
}: {
  uploading: boolean
  onSave: (image: string) => void
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Upload Organizational Chart</DialogTitle>
        </DialogHeader>
        <div className="relative space-y-4">
          {uploading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Uploading image\u2026</p>
            </div>
          )}
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            />
          </div>
          {preview ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={300}
                className="w-full h-auto object-contain"
                unoptimized
              />
            </div>
          ) : null}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button onClick={() => preview && onSave(preview)} disabled={!preview || uploading}>
            {uploading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 size-4" />
            )}
            {uploading ? "Uploading\u2026" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReportFormDialog({
  report,
  defaultType,
  onSave,
  onClose,
}: {
  report: CsoReport | null
  defaultType: CsoReport["type"] | null
  onSave: (report: CsoReport) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(report?.title ?? "")
  const [type, setType] = useState<CsoReport["type"]>(report?.type ?? defaultType ?? "Event")
  const [date, setDate] = useState(report?.date ?? "")
  const [summary, setSummary] = useState(report?.summary ?? "")
  const [total, setTotal] = useState(report?.total ?? "")
  const [image, setImage] = useState(report?.image ?? "")

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    const id = report?.id ?? `CSSO-${String(Date.now()).slice(-6)}`
    onSave({
      id,
      title,
      type,
      date,
      summary,
      total: total || undefined,
      image: image || undefined,
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            {report ? "Edit Report" : "Add Report"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="Report title"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Type</label>
            <Select
              value={type}
              onChange={(v) => setType(v as CsoReport["type"])}
              options={["Event", "Accomplishment", "Financial", "Record"]}
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Date</label>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="e.g. June 10, 2026"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full resize-none border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Report summary"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Total (optional)
            </label>
            <input
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="e.g. PHP 12,450 balance"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            />
            {image ? (
              <div className="relative mt-2 overflow-hidden border border-border">
                <Image
                  src={image}
                  alt="Preview"
                  width={400}
                  height={128}
                  className="h-32 w-full object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute right-2 top-2 flex size-6 items-center justify-center bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !date || !summary}
          >
            {report ? "Update Report" : "Create Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
