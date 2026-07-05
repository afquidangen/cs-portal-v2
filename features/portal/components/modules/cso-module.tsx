"use client"

import Image from "next/image"

import { ChevronLeft, ChevronRight, Download, ExternalLink, Eye, FileText, ImageIcon, Images, LayoutGrid, Loader2, Megaphone, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, StatusBadge, Tooltip } from "../shared/dashboard-ui"
import type { PortalDashboardModel } from "../../hooks/use-portal-dashboard-model"

function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return ""
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return "Just now"
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(then)
}

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
      <section className="relative overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900 shadow-sm">
        {model.csoInfo?.coverImageUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${model.csoInfo.coverImageUrl})` }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(0,0,0,${(model.csoInfo.coverOpacity ?? 50) / 100})` }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}

        <div className="relative z-10 px-4 py-8 text-center sm:px-8 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-xl border border-slate-600/50 bg-white/95 p-1.5 shadow-sm sm:mb-6 sm:size-32 dark:bg-white/95">
              {model.csoInfo?.logoUrl ? (
                <Image
                  src={model.csoInfo.logoUrl}
                  alt="CSSO logo"
                  width={200}
                  height={250}
                  className="size-full rounded-lg object-contain"
                  priority={false}
                  unoptimized
                />
              ) : (
                <ImageIcon className="size-8 text-slate-400 sm:size-12" />
              )}
            </div>
            <h2 className="text-2xl font-bold uppercase leading-tight tracking-tight text-white sm:text-3xl">
              {model.csoInfo?.orgName ?? "COMPUTING STUDIES STUDENTS ORGANIZATION"}
            </h2>
            {model.csoInfo?.description ? (
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                {model.csoInfo.description}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-blue-300">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-950/50 px-3 py-1.5 backdrop-blur-sm">
                <Sparkles className="size-3.5" />
                Student leadership
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-950/50 px-3 py-1.5 backdrop-blur-sm">
                <Megaphone className="size-3.5" />
                Events and reports
              </span>
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="absolute right-3 top-3 z-20">
            <Button size="sm" variant="outline" className="rounded-lg bg-white/90 backdrop-blur-sm dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20" onClick={() => setShowCsoInfoForm(true)}>
              <Pencil className="size-3.5" />
              Edit Info
            </Button>
          </div>
        ) : null}
      </section>

      {model.csoInfo?.facebookLink ? (
        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#1877F2]" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">CSSO Facebook Page</h3>
                <p className="text-xs text-slate-500">Stay updated with our latest posts</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" asChild>
              <a href={model.csoInfo.facebookLink} target="_blank" rel="noreferrer">
                Visit Page
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>
          <CardContent className="flex justify-center p-0">
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
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Accomplishments", value: String(accomplishments.length), icon: FileText },
          { label: "Financial Reports", value: String(financials.length), icon: FileText },
          { label: "All Documents", value: String(model.csoReports.length), icon: FileText },
        ].map((item) => {
          const Icon = item.icon
          return (
          <Card key={item.label} className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Icon className="size-5" />
              </span>
            </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Images className="size-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-950">CSSO Newsroom</h3>
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
          <div className="p-5">
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
                      {item.createdAt ? (
                        <time className="mt-1 block text-[10px] text-foreground/40">{formatRelativeTime(item.createdAt)}</time>
                      ) : null}
                    </div>
                    <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-8 rounded-full bg-white shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
                        onClick={() => handleGalleryEdit(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Tooltip content="Delete gallery item">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="size-8 rounded-full bg-white shadow-sm hover:bg-red-50 dark:bg-red-900/60 dark:hover:bg-red-800/70 dark:shadow-none"
                          onClick={() => handleGalleryDeleteConfirm(item)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CsoMiniGallery items={model.galleryItems} />
        )}
      </Card>

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-950">CSSO Organizational Chart</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
        {orgChartUrl ? (
          <div>
            <div className="relative overflow-hidden rounded-lg border border-slate-200">
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
          <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-center">
            <div>
              <ImageIcon className="mx-auto size-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-500">
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
        </CardContent>
      </Card>

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

      <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 px-5 py-4">
          <CardTitle className="text-base font-semibold text-slate-950">CSSO Constitution and By Laws</CardTitle>
          <p className="text-xs font-medium text-blue-600">Governing document</p>
        </CardHeader>
        <CardContent className="p-5">
        {constitutionDoc ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="size-6 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">Constitution and By Laws</p>
                <p className="truncate text-xs text-slate-500">
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-12 text-center">
            <FileText className="mx-auto mb-3 size-10 text-slate-400" />
            <p className="text-sm text-slate-500">No constitution uploaded yet.</p>
            {canManage ? (
              <Button size="sm" variant="outline" className="mt-3 rounded-lg" onClick={() => setShowConstitutionUpload(true)}>
                <Upload className="size-4" />
                Upload PDF
              </Button>
            ) : null}
          </div>
        )}
        </CardContent>
      </Card>

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
      createdAt: item.createdAt,
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
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
              className="size-9 rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700"
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
              className="size-9 rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={showNext}
              aria-label="Show next CSSO gallery item"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {activeSlide.meta}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            {activeSlide.title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {activeSlide.description}
          </p>
          {activeSlide.createdAt ? (
            <time className="mt-2 block text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(activeSlide.createdAt)}</time>
          ) : null}
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
    <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-950">{title}</CardTitle>
            <p className="text-xs font-medium text-blue-600">CSSO reports and records</p>
          </div>
          {onAdd ? (
            <Button size="sm" variant="default" className="rounded-lg" onClick={onAdd}>
              <Plus className="size-4" />
              Add Report
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-5">
      {reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No reports to display.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {reports.map((report) => (
            <article
              key={`${title}-${report.id}`}
              className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              {report.file ? (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <FileText className="size-5 shrink-0 text-slate-400" />
                  <span className="truncate text-xs font-medium text-slate-700">
                    {report.fileName ?? "PDF file"}
                  </span>
                </div>
              ) : null}

              <StatusBadge value={report.type} />

              <h4 className="mt-3 font-semibold text-slate-950">
                {report.title}
              </h4>

              <p className="mt-1 text-sm text-slate-500">{report.date}</p>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">
                {report.summary}
              </p>

              {report.total ? (
                <p className="mt-3 text-sm font-semibold text-slate-950">
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
      </CardContent>
    </Card>
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
  const [coverImageUrl, setCoverImageUrl] = useState(data?.coverImageUrl ?? "")
  const [coverImagePublicId, setCoverImagePublicId] = useState(data?.coverImagePublicId ?? "")
  const [coverOpacity, setCoverOpacity] = useState(data?.coverOpacity ?? 50)
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

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
      setCoverImageUrl(json.data.secureUrl)
      setCoverImagePublicId(json.data.publicId ?? "")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload cover photo.")
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
      coverImageUrl: coverImageUrl || "",
      coverImagePublicId: coverImageUrl ? coverImagePublicId : "",
      coverOpacity,
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Edit CSSO Info</DialogTitle>
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
            <label className="text-sm font-medium text-foreground">CSSO Logo</label>
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
                <Tooltip content="Remove logo">
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500"
                  >
                    <X className="size-3" />
                  </button>
                </Tooltip>
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
                <Tooltip content="Remove portal logo">
                  <button
                    type="button"
                    onClick={() => setPortalLogoUrl("")}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500"
                  >
                    <X className="size-3" />
                  </button>
                </Tooltip>
              </div>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Cover Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={uploading}
              className="flex h-10 w-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50"
            />
            {coverImageUrl ? (
              <>
                <div className="relative mt-2 flex items-center justify-center overflow-hidden border border-border bg-muted/50">
                  <Image
                    src={coverImageUrl}
                    alt="Cover preview"
                    width={400}
                    height={160}
                    className="max-h-40 w-full object-cover"
                    unoptimized
                  />
                  <Tooltip content="Remove cover photo">
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl("")}
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500"
                    >
                      <X className="size-3" />
                    </button>
                  </Tooltip>
                </div>
                <div className="mt-3 space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Overlay Opacity: {coverOpacity}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={coverOpacity}
                    onChange={(e) => setCoverOpacity(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </>
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
                <Tooltip content="Remove file">
                  <button
                    type="button"
                    onClick={() => { setFile(""); setFileName(""); setCloudinaryPublicId("") }}
                    className="ml-auto flex size-5 items-center justify-center text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </Tooltip>
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
