"use client"

import { useRef, useState } from "react"
import { Download, FileText, Link as LinkIcon, Loader2, Plus, Trash2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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

import { Panel } from "../shared/dashboard-ui"
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
    handleCreateQuickLink,
    handleDeleteQuickLink,
    handleDeleteDownloadable,
    setQuickLinks,
  } = model

  const dlFileInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = role === "admin"

  const [quickLinkUploading, setQuickLinkUploading] = useState(false)
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

  async function handleQuickLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quickLinkDraft.label.trim() || !quickLinkDraft.href.trim()) return

    setQuickLinkUploading(true)
    try {
      const res = await fetch("/api/portal/quick-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: quickLinkDraft.label.trim(),
          href: quickLinkDraft.href.trim(),
          type: "link",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save.")
      if (json.data) {
        setQuickLinks((current) => [json.data, ...current])
      }
    } catch {
      window.alert("Failed to save quick link.")
      setQuickLinkUploading(false)
      return
    }

    setQuickLinkDraft({ label: "", href: "", type: "link", fileName: "", fileSize: 0, fileData: "" })
    setShowQuickLinkForm(false)
    setQuickLinkUploading(false)
    window.alert("Quick link added successfully.")
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
      window.alert("Failed to upload file.")
      setDownloadableUploading(false)
      return
    }

    setDownloadableDraft({ label: "", fileName: "", fileSize: 0, fileData: "" })
    setShowDownloadableForm(false)
    setDownloadableUploading(false)
    window.alert("PDF uploaded successfully.")
  }

  function handleCloseDialog(open: boolean) {
    if (!open) {
      setQuickLinkDraft({ label: "", href: "", type: "link", fileName: "", fileSize: 0, fileData: "" })
    }
    setShowQuickLinkForm(open)
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function renderQuickLink(link: typeof quickLinks[number]) {
    return (
      <div
        key={link._id ?? link.label}
        className="group relative flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted"
      >
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center gap-3 text-sm font-medium text-foreground"
        >
          <LinkIcon className="size-4 shrink-0 text-foreground/80" />
          <span className="min-w-0 truncate">{link.label}</span>
        </a>

        {isAdmin && (
          <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => handleDeleteQuickLink(link._id!)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              title="Delete quick link"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    )
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
        className="group relative flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:bg-muted"
      >
        <button
          type="button"
          onClick={() => handleFileDownload(link)}
          className="flex flex-1 items-center gap-3 text-sm font-medium text-foreground text-left"
        >
          <Download className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 truncate">{link.label}</span>
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {link.fileName?.endsWith(".pdf") ? "PDF" : link.fileName?.split(".").pop()?.toUpperCase()}
            {link.fileSize ? ` \u00B7 ${formatFileSize(link.fileSize)}` : ""}
          </span>
        </button>

        {isAdmin && (
          <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => handleDeleteDownloadable(link._id!)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              title="Delete file"
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
    <div className="space-y-8">
      <Panel title="Quick Links" eyebrow="Department resources">
        {quickLinks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No quick links available.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {quickLinks.map(renderQuickLink)}
          </div>
        )}
      </Panel>

      <Panel title="Downloadables" eyebrow="ISPSC resources">
        {isAdmin && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowDownloadableForm(true)}
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <Upload className="size-5" />
              <span className="font-medium">Upload PDF</span>
            </button>
          </div>
        )}
        {downloadables.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No downloadable files available.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {downloadables.map(renderDownloadableFile)}
          </div>
        )}
      </Panel>

      </div>

      {/* Quick Links Dialog */}
      <Dialog open={showQuickLinkForm} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleQuickLinkSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">Add Quick Link</DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">
                Add a resource link visible to all portal users
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
                {quickLinkUploading ? "Saving\u2026" : "Add Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Downloadables Dialog */}
      <Dialog open={showDownloadableForm} onOpenChange={setShowDownloadableForm}>
        <DialogContent className="max-w-lg">
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
