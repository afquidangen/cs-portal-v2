"use client"

import Image from "next/image"
import { Eye, ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { CsoReport, Role } from "../../data/portal-data"
import { csoReportsSeed } from "../../data/portal-data"
import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"

export function CsoModule({ role }: { role: Role }) {
  const [reports, setReports] = useState<CsoReport[]>(csoReportsSeed)
  const [editingReport, setEditingReport] = useState<CsoReport | null>(null)
  const [deletingReport, setDeletingReport] = useState<CsoReport | null>(null)
  const [viewingReport, setViewingReport] = useState<CsoReport | null>(null)
  const [showForm, setShowForm] = useState(false)

  const isAdmin = role === "admin"

  const accomplishments = reports.filter(
    (report) => report.type === "Accomplishment" || report.type === "Event"
  )
  const financials = reports.filter((report) => report.type === "Financial")

  function handleSave(report: CsoReport) {
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.id === report.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = report
        return next
      }
      return [...prev, report]
    })
    setShowForm(false)
    setEditingReport(null)
  }

  function handleDelete(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id))
    setDeletingReport(null)
  }

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
          setShowForm(true)
        } : undefined}
      />

      <ReportGrid
        title="Transparency Documents"
        reports={reports}
        isAdmin={isAdmin}
        onEdit={(r) => {
          setEditingReport(r)
          setShowForm(true)
        }}
        onDelete={(r) => setDeletingReport(r)}
        onView={(r) => setViewingReport(r)}
        onAdd={isAdmin ? () => {
          setEditingReport(null)
          setShowForm(true)
        } : undefined}
      />

      {showForm ? (
        <ReportFormDialog
          report={editingReport}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setEditingReport(null)
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
                      className="w-full object-cover"
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
          <Button size="sm" variant="default" className="rounded-2xl" onClick={onAdd}>
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
              className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
            >
              {report.image ? (
                <div className="mb-3 overflow-hidden rounded-xl border border-border">
                  <Image
                    src={report.image}
                    alt={report.title}
                    width={400}
                    height={144}
                    className="h-36 w-full object-cover"
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
                      className="rounded-2xl"
                      onClick={() => onEdit(report)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-2xl"
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
                    className="rounded-2xl"
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

function ReportFormDialog({
  report,
  onSave,
  onClose,
}: {
  report: CsoReport | null
  onSave: (report: CsoReport) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(report?.title ?? "")
  const [type, setType] = useState<CsoReport["type"]>(report?.type ?? "Event")
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
