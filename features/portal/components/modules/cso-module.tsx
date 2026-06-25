"use client"

import Image from "next/image"

import { ChevronLeft, ChevronRight, Download, ExternalLink, Eye, FileText, ImageIcon, Images, LayoutGrid, Loader2, Megaphone, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react"
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
import { ImageCropDialog } from "../shared/image-crop-dialog"

import type { CsoReport } from "../../data/portal-data"
import type { CsoInfoRecord, GalleryItem } from "@/lib/types"
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

  const [showCsoInfoForm, setShowCsoInfoForm] = useState(false)
  const [isManageGallery, setIsManageGallery] = useState(false)
  const [showGalleryForm, setShowGalleryForm] = useState(false)
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null)
  const [deletingGalleryItem, setDeletingGalleryItem] = useState<GalleryItem | null>(null)

  const canManage = model.canManageCso ?? false

  const accomplishments = model.filteredCsoReports.filter(
    (report: CsoReport) => report.type === "Accomplishment" || report.type === "Event"
  )
  const financials = model.filteredCsoReports.filter((report: CsoReport) => report.type === "Financial")
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

  function handleCsoInfoSave(data: CsoInfoRecord) {
    model.handleUpdateCsoInfo(data)
    setShowCsoInfoForm(false)
  }

  function handleGallerySave(item: GalleryItem) {
    const existing = editingGalleryItem
    if (existing) {
      model.handleUpdateGalleryItem(existing._id ?? existing.id, item)
    } else {
      model.handleCreateGalleryItem(item)
    }
    setShowGalleryForm(false)
    setEditingGalleryItem(null)
  }

  function handleGalleryEdit(item: GalleryItem) {
    setEditingGalleryItem(item)
    setShowGalleryForm(true)
  }

  function handleGalleryDeleteConfirm(item: GalleryItem) {
    setDeletingGalleryItem(item)
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
      <section className="relative overflow-hidden rounded-xl border border-primary/15 bg-[linear-gradient(120deg,#f8fbff_0%,#eef7ff_56%,#f7fbff_100%)] px-4 py-6 text-center shadow-sm dark:border-[#1d3858] dark:bg-[linear-gradient(120deg,#071224_0%,#0b2038_58%,#123768_100%)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(36,120,255,0.08)_1px,transparent_1px),linear-gradient(rgba(36,120,255,0.06)_1px,transparent_1px)] bg-[size:38px_38px] opacity-50 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)]" />
        <div className="relative mx-auto max-w-3xl">
          {canManage ? (
            <div className="absolute right-0 top-0 z-10">
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setShowCsoInfoForm(true)}>
                <Pencil className="size-3.5" />
                Edit Info
              </Button>
            </div>
          ) : null}
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-2xl border border-primary/20 bg-white/80 p-1.5 shadow-md dark:border-[#8bd3ff]/25 dark:bg-white/10 sm:mb-6 sm:size-32 sm:rounded-3xl">
            {model.csoInfo?.logoUrl ? (
              <Image
                src={model.csoInfo.logoUrl}
                alt="CSSO logo"
                width={200}
                height={250}
                className="size-full rounded-xl object-contain"
                priority={false}
                unoptimized
              />
            ) : (
              <ImageIcon className="size-8 text-foreground/30 sm:size-12" />
            )}
          </div>
          <h2 className="font-heading text-[1.4rem] font-black uppercase leading-tight tracking-[0.03em] text-foreground sm:text-[3.35rem]">
            {model.csoInfo?.orgName ?? "COMPUTING STUDIES STUDENTS ORGANIZATION"}
          </h2>
          {model.csoInfo?.description ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {model.csoInfo.description}
            </p>
          ) : null}
          {model.csoInfo?.facebookLink ? (
            <a
              href={model.csoInfo.facebookLink}
              target="_blank"
              rel="noreferrer"
              className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#8bd3ff]/25 dark:bg-[#8bd3ff] dark:text-[#071224]"
            >
              Visit CSSO Facebook Page
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-primary dark:text-[#8bd3ff]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
              <Sparkles className="size-3.5" />
              Student leadership
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
              <Megaphone className="size-3.5" />
              Events and reports
            </span>

          </div>
        </div>
      </section>

      {model.csoInfo?.facebookLink ? (
        <div className="overflow-hidden rounded-xl border border-[#1877F2]/20 bg-card shadow-sm dark:border-[#1877F2]/15">
          <div className="flex items-center justify-between border-b border-[#1877F2]/15 bg-[#1877F2]/5 px-4 py-3 dark:border-[#1877F2]/10 dark:bg-[#1877F2]/[0.07] sm:px-5">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#1877F2]" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-foreground">CSSO Facebook Page</h3>
                <p className="text-[11px] leading-tight text-muted-foreground">Stay updated with our latest posts</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" asChild>
              <a href={model.csoInfo.facebookLink} target="_blank" rel="noreferrer">
                Visit Page
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>
          <div className="flex justify-center">
            <iframe
              src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(model.csoInfo.facebookLink)}&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`}
              width="500"
              height="600"
              className="w-full max-w-[500px] h-[400px] sm:h-[500px]"
              style={{ border: "none", overflow: "hidden", display: "block" }}
              scrolling="no"
              frameBorder={0}
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="CSSO Facebook Page"
              loading="lazy"
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Accomplishments", value: String(accomplishments.length) },
          { label: "Financial Reports", value: String(financials.length) },
          { label: "All Documents", value: String(model.csoReports.length) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-primary/15 bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[#1d3858] sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary dark:text-[#8bd3ff] sm:text-xs">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-primary/15 bg-card shadow-sm dark:border-[#1d3858]">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Images className="size-4 text-primary dark:text-[#8bd3ff]" />
            <h3 className="text-sm font-semibold text-foreground">CSSO Newsroom</h3>
          </div>
          {canManage ? (
            <div className="flex gap-2">
              {isManageGallery ? (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setIsManageGallery(false)}>
                  <LayoutGrid className="size-3.5" />
                  View Gallery
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setIsManageGallery(true)}>
                  <Pencil className="size-3.5" />
                  Manage Gallery
                </Button>
              )}
            </div>
          ) : null}
        </div>
        {isManageGallery ? (
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{model.galleryItems.length} photo{model.galleryItems.length !== 1 ? "s" : ""}</p>
              <Button size="sm" className="rounded-lg" onClick={() => { setEditingGalleryItem(null); setShowGalleryForm(true) }}>
                <Plus className="size-3.5" />
                Add Photo
              </Button>
            </div>
            {model.galleryItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="mx-auto mb-3 size-10 text-foreground/40" />
                <p className="text-sm text-foreground/60">No photos in gallery yet.</p>
                <Button size="sm" variant="outline" className="mt-3 rounded-lg" onClick={() => { setEditingGalleryItem(null); setShowGalleryForm(true) }}>
                  <Plus className="size-3.5" />
                  Add Photo
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {model.galleryItems.map((item) => (
                  <article
                    key={item._id ?? item.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-center overflow-hidden bg-muted min-h-[280px]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={400}
                        height={300}
                        className="size-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      {item.description ? (
                        <p className="mt-1 text-xs text-foreground/70 line-clamp-2">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-8 rounded-full bg-white/90 shadow-sm hover:bg-white"
                        onClick={() => handleGalleryEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="size-8 rounded-full shadow-sm"
                        onClick={() => handleGalleryDeleteConfirm(item)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CsoMiniGallery items={model.galleryItems} />
        )}
      </div>

      <Panel title="CSSO Organizational Chart">
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
            {canManage ? (
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
              {canManage ? (
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
        isAdmin={canManage}
        onEdit={(r) => {
          setEditingReport(r)
          setShowForm(true)
        }}
        onDelete={(r) => setDeletingReport(r)}
        onView={(r) => setViewingReport(r)}
        onAdd={canManage ? () => {
          setEditingReport(null)
          setAddReportType("Accomplishment")
          setShowForm(true)
        } : undefined}
      />

      <ReportGrid
        title="Financial Reports"
        reports={financials}
        isAdmin={canManage}
        onEdit={(r) => {
          setEditingReport(r)
          setShowForm(true)
        }}
        onDelete={(r) => setDeletingReport(r)}
        onView={(r) => setViewingReport(r)}
        onAdd={canManage ? () => {
          setEditingReport(null)
          setAddReportType("Financial")
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
              {canManage ? (
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
            {canManage ? (
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

      {showCsoInfoForm ? (
        <CsoInfoFormDialog
          data={model.csoInfo}
          onSave={handleCsoInfoSave}
          onClose={() => setShowCsoInfoForm(false)}
        />
      ) : null}

      {showGalleryForm ? (
        <GalleryFormDialog
          item={editingGalleryItem}
          onSave={handleGallerySave}
          onClose={() => {
            setShowGalleryForm(false)
            setEditingGalleryItem(null)
          }}
        />
      ) : null}

      <Dialog open={!!deletingGalleryItem} onOpenChange={(open) => { if (!open) setDeletingGalleryItem(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Photo</DialogTitle>
            <p className="pt-1 text-sm text-muted-foreground">
              Are you sure you want to delete &ldquo;{deletingGalleryItem?.title}&rdquo;? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingGalleryItem) {
                  model.handleDeleteGalleryItem(deletingGalleryItem._id ?? deletingGalleryItem.id)
                }
                setDeletingGalleryItem(null)
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="max-w-4xl">
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
                {viewingReport.file ? (
                  <>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="size-6 shrink-0 text-foreground/60" />
                        <span className="truncate text-sm font-medium text-foreground">
                          {viewingReport.fileName ?? "Report File"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg shrink-0"
                        onClick={() => {
                          const a = document.createElement("a")
                          a.href = `/api/portal/cso-reports/${viewingReport.id}/pdf?download=1`
                          a.download = viewingReport.fileName || `${viewingReport.title}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                      >
                        <Download className="size-4" />
                        Download
                      </Button>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <iframe
                        src={`/api/portal/cso-reports/${viewingReport.id}/pdf`}
                        className="w-full"
                        style={{ height: "65vh", minHeight: 450 }}
                      />
                    </div>
                  </>
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

function CsoMiniGallery({ items }: { items: GalleryItem[] }) {
  const gallerySlides = items
    .slice(0, 10)
    .map((item) => ({
      title: item.title,
      description: item.description,
      image: item.image,
      meta: "Gallery",
    }))

  const slides = gallerySlides.slice(0, 10)

  const [activeIndex, setActiveIndex] = useState(0)
  const normalizedIndex = activeIndex % slides.length
  const activeSlide = slides[normalizedIndex] ?? slides[0]

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [slides.length])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ImageIcon className="mx-auto mb-3 size-10 text-foreground/40" />
        <p className="text-sm font-medium text-foreground/70">No gallery photos yet</p>
      </div>
    )
  }

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length)
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % slides.length)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-primary/15 bg-card shadow-sm dark:border-[#1d3858]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="relative min-h-[400px] bg-muted">
          <Image
            src={activeSlide.image || "/csso-logo.svg"}
            alt={activeSlide.title}
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className={activeSlide.image ? "object-cover" : "object-contain p-10"}
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-9 rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
              onClick={showPrevious}
              aria-label="Show previous CSSO news item"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex gap-1.5" aria-hidden="true">
              {slides.map((slide, index) => (
                <span
                  key={`${slide.title}-${index}`}
                  className={`h-1.5 rounded-full transition-all ${index === normalizedIndex ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-9 rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
              onClick={showNext}
              aria-label="Show next CSSO gallery item"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary dark:text-[#8bd3ff]">
            {activeSlide.meta}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {activeSlide.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground/75">
            {activeSlide.description}
          </p>
        </div>
      </div>
    </section>
  )
}

function ReportGrid({
  title,
  reports,
  isAdmin: canManage,
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
      eyebrow="CSSO reports and records"
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
              {report.file ? (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <FileText className="size-5 shrink-0 text-foreground/60" />
                  <span className="truncate text-xs font-medium text-foreground/80">
                    {report.fileName ?? "PDF file"}
                  </span>
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
                {canManage ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => onView(report)}
                    >
                      <Eye className="size-4" />
                      Read
                    </Button>
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

function CsoInfoFormDialog({
  data,
  onSave,
  onClose,
}: {
  data: CsoInfoRecord | null
  onSave: (data: CsoInfoRecord) => void
  onClose: () => void
}) {
  const [orgName, setOrgName] = useState(data?.orgName ?? "")
  const [description, setDescription] = useState(data?.description ?? "")
  const [facebookLink, setFacebookLink] = useState(data?.facebookLink ?? "")
  const [logoUrl, setLogoUrl] = useState(data?.logoUrl ?? "")
  const [logoPublicId, setLogoPublicId] = useState(data?.logoPublicId ?? "")
  const [portalLogoUrl, setPortalLogoUrl] = useState(data?.portalLogoUrl ?? "")
  const [portalLogoPublicId, setPortalLogoPublicId] = useState(data?.portalLogoPublicId ?? "")
  const [uploading, setUploading] = useState(false)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", f)
    try {
      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed.")
      setLogoUrl(json.data.secureUrl)
      setLogoPublicId(json.data.publicId ?? "")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo.")
    }
    setUploading(false)
  }

  async function handlePortalLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", f)
    try {
      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed.")
      setPortalLogoUrl(json.data.secureUrl)
      setPortalLogoPublicId(json.data.publicId ?? "")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload portal logo.")
    }
    setUploading(false)
  }

  function handleSubmit() {
    onSave({
      ...data,
      orgName,
      description,
      facebookLink,
      logoUrl: logoUrl || "",
      logoPublicId: logoUrl ? logoPublicId : "",
      portalLogoUrl: portalLogoUrl || "",
      portalLogoPublicId: portalLogoUrl ? portalLogoPublicId : "",
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Edit CSO Info</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Organization Name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="Organization name"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Organization description"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Facebook Page Link</label>
            <input
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">CSO Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50"
            />
            {logoUrl ? (
              <div className="relative mt-2 flex items-center justify-center overflow-hidden border border-border bg-muted/50 p-2">
                <Image
                  src={logoUrl}
                  alt="Logo preview"
                  width={80}
                  height={80}
                  className="max-h-20 w-auto object-contain"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Portal Logo (navbar)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePortalLogoUpload}
              disabled={uploading}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50"
            />
            {portalLogoUrl ? (
              <div className="relative mt-2 flex items-center justify-center overflow-hidden border border-border bg-muted/50 p-2">
                <Image
                  src={portalLogoUrl}
                  alt="Portal logo preview"
                  width={32}
                  height={32}
                  className="max-h-8 w-auto object-contain"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setPortalLogoUrl("")}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!orgName || uploading}>
            {uploading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GalleryFormDialog({
  item,
  onSave,
  onClose,
}: {
  item: GalleryItem | null
  onSave: (item: GalleryItem) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [image, setImage] = useState(item?.image ?? "")
  const [newFile, setNewFile] = useState<File | null>(null)
  const [pendingCropImage, setPendingCropImage] = useState<string | null>(null)

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0

  function handleDescriptionChange(value: string) {
    const words = value.trim() ? value.trim().split(/\s+/) : []
    if (words.length <= 60) {
      setDescription(value)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setNewFile(f)
    const reader = new FileReader()
    reader.onload = () => setPendingCropImage(reader.result as string)
    reader.readAsDataURL(f)
  }

  function handleCropConfirm(croppedDataUrl: string) {
    setImage(croppedDataUrl)
    setPendingCropImage(null)
  }

  function handleCropCancel() {
    setPendingCropImage(null)
    setNewFile(null)
  }

  function handleSubmit() {
    const id = item?.id ?? `GALLERY-${String(Date.now()).slice(-6)}`
    onSave({
      id,
      title,
      description,
      image: image || "",
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            {item ? "Edit Photo" : "Add Photo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder="Photo title"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={3}
              className="w-full resize-none border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Photo description"
            />
            <p className={`text-xs ${wordCount >= 60 ? "text-red-500" : "text-foreground/50"}`}>
              {wordCount}/60 words
            </p>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {item ? "Replace Image (optional)" : "Image"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
            />
            {image ? (
              <div className="relative mt-2 overflow-hidden border border-border">
                  <Image
                    src={image}
                    alt="Preview"
                    width={400}
                    height={200}
                    className="max-h-48 w-full object-contain"
                    unoptimized
                  />
                {newFile ? null : (
                  <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                    Current image (pick a new file to replace)
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title || !image}>
            {item ? "Update Photo" : "Add Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {pendingCropImage ? (
        <ImageCropDialog
          imageSrc={pendingCropImage}
          open
          aspect={4 / 3}
          cropShape="rect"
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      ) : null}
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
  const [file, setFile] = useState(report?.file ?? "")
  const [fileName, setFileName] = useState(report?.fileName ?? "")
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState(report?.cloudinaryPublicId ?? "")
  const [uploading, setUploading] = useState(false)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    setFileName(f.name)
    try {
      const formData = new FormData()
      formData.append("file", f)
      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed.")
      setFile(json.data.secureUrl)
      setCloudinaryPublicId(json.data.publicId)
      setUploading(false)
    } catch (err) {
      console.error("File upload failed:", err)
      toast.error(err instanceof Error ? err.message : "Failed to upload file.")
      setFileName("")
      setUploading(false)
    }
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
      file: file || undefined,
      fileName: fileName || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
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
              options={["Event", "Accomplishment", "Financial"]}
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
            <label className="text-sm font-medium text-foreground">File (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50"
            />
            {uploading ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <Loader2 className="size-5 shrink-0 animate-spin text-foreground/60" />
                <span className="text-sm text-foreground/80">Uploading file...</span>
              </div>
            ) : file ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <FileText className="size-5 shrink-0 text-foreground/60" />
                <span className="truncate text-sm text-foreground/80">
                  {fileName || "File selected"}
                </span>
                <button
                  type="button"
                  onClick={() => { setFile(""); setFileName(""); setCloudinaryPublicId("") }}
                  className="ml-auto flex size-5 items-center justify-center text-foreground/50 transition-colors hover:text-foreground"
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
            disabled={!title || !date || !summary || uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : null}
            {uploading ? "Uploading\u2026" : report ? "Update Report" : "Create Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
