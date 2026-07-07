"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { Download, ExternalLink, FileText, Globe, Link2, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { QuickLinkRecord } from "@/lib/types"
import { toast } from "sonner"
import type { PortalModuleProps } from "./types"

export function QuickLinksModule({ model }: PortalModuleProps) {
  const {
    role,
    quickLinks,
    downloadables,
    setDownloadables,
    quickLinkDraft,
    setQuickLinkDraft,
    showQuickLinkForm,
    setShowQuickLinkForm,
    handleDeleteDownloadable,
    handleCreateQuickLink,
    handleUpdateQuickLink,
    handleDeleteQuickLink,
  } = model

  const dlFileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = role === "admin"

  const [quickLinkUploading, setQuickLinkUploading] = useState(false)
  const [editingQuickLink, setEditingQuickLink] = useState<QuickLinkRecord | null>(null)
  const [deleteQuickLinkId, setDeleteQuickLinkId] = useState<string | null>(null)
  const [downloadableUploading, setDownloadableUploading] = useState(false)
  const [showDownloadableForm, setShowDownloadableForm] = useState(false)
  const [downloadableDraft, setDownloadableDraft] = useState({
    label: "",
    fileName: "",
    fileSize: 0,
    fileData: "",
  })

  function handleDlFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setDownloadableDraft((current) => ({
        ...current,
        fileName: file.name,
        fileSize: file.size,
        fileData: typeof reader.result === "string" ? reader.result : "",
      }))
    }
    reader.readAsDataURL(file)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setQuickLinkDraft((current) => ({
        ...current,
        imageData: typeof reader.result === "string" ? reader.result : "",
      }))
    }
    reader.readAsDataURL(file)
  }

  async function handleQuickLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quickLinkDraft.label.trim() || !quickLinkDraft.href.trim()) return

    setQuickLinkUploading(true)
    if (editingQuickLink) {
      const updated: QuickLinkRecord & { imageData?: string; removeImage?: boolean } = {
        _id: editingQuickLink._id,
        label: quickLinkDraft.label.trim(),
        href: quickLinkDraft.href.trim(),
        type: "link",
        imageData: quickLinkDraft.imageData || undefined,
        removeImage: quickLinkDraft.imageData === "" && editingQuickLink.imageUrl ? true : undefined,
      }
      handleUpdateQuickLink(updated)
      setEditingQuickLink(null)
    } else {
      await handleCreateQuickLink(event)
    }
    setQuickLinkDraft({ label: "", href: "", type: "link", fileName: "", fileSize: 0, fileData: "", imageData: "" })
    setShowQuickLinkForm(false)
    setQuickLinkUploading(false)
  }

  async function handleSubmitDownloadable(event: React.FormEvent) {
    event.preventDefault()
    if (!downloadableDraft.label.trim() || !downloadableDraft.fileData) return

    setDownloadableUploading(true)
    try {
      const res = await fetch("/api/portal/downloadables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: downloadableDraft.label.trim(),
          href: downloadableDraft.fileData,
          fileName: downloadableDraft.fileName,
          fileSize: downloadableDraft.fileSize,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed.")
      if (json.data) {
        setDownloadables((current) => [json.data, ...current])
      }
    } catch {
      toast.error("Failed to upload file")
      setDownloadableUploading(false)
      return
    }

    setDownloadableDraft({ label: "", fileName: "", fileSize: 0, fileData: "" })
    setShowDownloadableForm(false)
    setDownloadableUploading(false)
    toast.success("PDF uploaded successfully")
  }

  function handleCloseDialog(open: boolean) {
    if (!open) {
      setQuickLinkDraft({ label: "", href: "", type: "link", fileName: "", fileSize: 0, fileData: "", imageData: "" })
      setEditingQuickLink(null)
    }
    setShowQuickLinkForm(open)
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleFileDownload(link: typeof downloadables[number]) {
    try {
      const res = await fetch(link.href)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = link.fileName || `${link.label}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(link.href, "_blank")
    }
  }

  function renderDownloadableFile(link: typeof downloadables[number]) {
    return (
      <div
        key={link._id ?? link.label}
        className="group relative flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{link.label}</p>
            {link.fileSize ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatFileSize(link.fileSize)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleFileDownload(link)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
            title="Download file"
          >
            <Download className="size-3.5" />
            Download
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleDeleteDownloadable(link._id!)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              title="Delete file"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  function renderQuickLink(link: QuickLinkRecord) {
    const domain = link.href
      ? (() => {
          try {
            return new URL(link.href).hostname.replace(/^www\./, "")
          } catch {
            return link.href
          }
        })()
      : ""

    return (
      <div
        key={link._id ?? link.label}
        className="group relative flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
      >
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-3"
        >
          {link.imageUrl ? (
            <Image
              src={link.imageUrl}
              alt={link.label}
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-lg object-contain"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Link2 className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{link.label}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="size-3 shrink-0" />
              <span className="truncate">{domain}</span>
            </p>
          </div>
        </a>

        {isAdmin && (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setQuickLinkDraft({ label: link.label, href: link.href, type: "link", fileName: "", fileSize: 0, fileData: "", imageData: undefined })
                setEditingQuickLink(link)
                setShowQuickLinkForm(true)
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
              title="Edit link"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteQuickLinkId(link._id!)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              title="Delete link"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">
        <div className="pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Quick Links &amp; Downloads</h1>
          <p className="mt-2 text-sm text-slate-600">Access commonly used portal resources and downloadable files.</p>
        </div>

        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-950">Quick Links</h3>
                <p className="text-sm text-slate-500">Portal resources</p>
              </div>
          {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setShowQuickLinkForm(true)}>
                <Plus className="size-4" />
                Add Link
              </Button>
          )}
            </div>
          {quickLinks.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No quick links available.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {quickLinks.map(renderQuickLink)}
            </div>
          )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-950">Downloadables</h3>
                <p className="text-sm text-slate-500">ISPSC resources</p>
              </div>
          {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setShowDownloadableForm(true)}>
                <Upload className="size-4" />
                Upload PDF
              </Button>
          )}
            </div>
          {downloadables.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No downloadable files available.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {downloadables.map(renderDownloadableFile)}
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Dialog */}
      <Dialog open={showQuickLinkForm} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85dvh] overflow-y-auto">
          <form onSubmit={handleQuickLinkSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">
                {editingQuickLink ? "Edit Quick Link" : "Add Quick Link"}
              </DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">
                {editingQuickLink
                  ? "Update the resource link details"
                  : "Add a resource link visible to all portal users"}
              </DialogDescription>
            </DialogHeader>

            <div className="relative space-y-4">
              {quickLinkUploading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Saving\u2026</p>
                </div>
              )}

              <Input
                value={quickLinkDraft.label}
                onChange={(event) =>
                  setQuickLinkDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="Link label (e.g. Online Library)"
              />

              <Input
                value={quickLinkDraft.href}
                onChange={(event) =>
                  setQuickLinkDraft((current) => ({
                    ...current,
                    href: event.target.value,
                  }))
                }
                placeholder="URL (e.g. https://..."
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Image (optional)</p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {quickLinkDraft.imageData || editingQuickLink?.imageUrl ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <Image
                      src={quickLinkDraft.imageData || editingQuickLink?.imageUrl || ""}
                      alt="Preview"
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-lg object-contain"
                    />
                    <span className="min-w-0 truncate text-sm text-muted-foreground">
                      {quickLinkDraft.imageData ? "New image selected" : "Current image"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickLinkDraft((current) => ({ ...current, imageData: "" }))
                        if (imageInputRef.current) imageInputRef.current.value = ""
                      }}
                      className="ml-auto rounded-lg p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    <Upload className="size-5" />
                    Click to upload an image
                  </button>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={quickLinkUploading}>
                  <X className="mr-1.5 size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={quickLinkUploading}>
                {quickLinkUploading ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 size-4" />
                )}
                {quickLinkUploading ? "Saving\u2026" : editingQuickLink ? "Update Link" : "Add Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Quick Link Dialog */}
      <Dialog open={!!deleteQuickLinkId} onOpenChange={(open) => { if (!open) setDeleteQuickLinkId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Quick Link</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Are you sure you want to delete this quick link? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                <X className="mr-1.5 size-4" /> Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteQuickLinkId) handleDeleteQuickLink(deleteQuickLinkId)
                setDeleteQuickLinkId(null)
              }}
            >
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downloadables Dialog */}
      <Dialog open={showDownloadableForm} onOpenChange={setShowDownloadableForm}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85dvh] overflow-y-auto">
          <form onSubmit={handleSubmitDownloadable}>
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">Upload PDF</DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">
                Upload a PDF file that students and faculty can download
              </DialogDescription>
            </DialogHeader>

            <div className="relative space-y-4">
              {downloadableUploading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Uploading PDF\u2026</p>
                </div>
              )}
              <Input
                value={downloadableDraft.label}
                onChange={(event) =>
                  setDownloadableDraft((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="File label (e.g. ISPSC Student Manual)"
              />

              <div className="space-y-2">
                <input
                  ref={dlFileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleDlFileChange}
                  className="hidden"
                />
                {downloadableDraft.fileName ? (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      <span className="font-medium text-foreground">{downloadableDraft.fileName}</span>
                      <span className="text-muted-foreground">
                        ({formatFileSize(downloadableDraft.fileSize)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDownloadableDraft((current) => ({
                          ...current,
                          fileName: "",
                          fileSize: 0,
                          fileData: "",
                        }))
                        if (dlFileInputRef.current) dlFileInputRef.current.value = ""
                      }}
                      className="rounded-lg p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => dlFileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    <Upload className="size-5" />
                    Click to select a PDF file
                  </button>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={downloadableUploading}>
                  <X className="mr-1.5 size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={downloadableUploading}>
                {downloadableUploading ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 size-4" />
                )}
                {downloadableUploading ? "Uploading\u2026" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
