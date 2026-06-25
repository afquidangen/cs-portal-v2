"use client"

import { useEffect, useRef, useState } from "react"
import { BookOpen, Calendar, Clock, Download, Eye, FileText, GraduationCap, LibraryBig, Loader2, Plus, Search, Tags, FileIcon, ExternalLink, Bookmark, Trash2, Tag, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  EmptyState,
  Metric,
  Panel,
  SearchBox,
  Select,
  StatusBadge,
  Textarea,
} from "../shared/dashboard-ui"
import { toast } from "sonner"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { PortalModuleProps } from "./types"
import type { ThesisRecord } from "@/lib/types"
import { ThesisTrashPanel } from "./thesis-trash-panel"

export function ThesisLibraryModule({ model }: PortalModuleProps) {
  const {
    confirmAndDeleteThesis,
    filteredTheses,
    query,
    role,
    setQuery,
    setShowThesisUploadForm,
    setThesisCategoryFilter,
    setThesisDraft,
    setThesisYearFilter,
    showThesisUploadForm,
    showThesisTrash,
    setShowThesisTrash,
    theses,
    thesisCategoryFilter,
    thesisDraft,
    thesisYearFilter,
    setTheses,
    fetchTrashedTheses,
  } = model

  useEffect(() => {
    if (showThesisTrash) {
      fetchTrashedTheses()
    }
  }, [showThesisTrash, fetchTrashedTheses])

  
  const categories = [
    "All",
    ...Array.from(new Set(theses.map((thesis) => thesis.category))),
  ]

  const years = [
    "All",
    ...Array.from(new Set(theses.map((thesis) => String(thesis.year)))),
  ]

  const [uploading, setUploading] = useState(false)
  const [detailThesis, setDetailThesis] = useState<ThesisRecord | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editDraft, setEditDraft] = useState({
    title: "", authors: "", year: "", category: "", adviser: "", tags: "",
  })
  const [replacementFile, setReplacementFile] = useState<{ url: string; name: string } | null>(null)
  const [removingFile, setRemovingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function openEditDraft(thesis: ThesisRecord) {
    setEditDraft({
      title: thesis.title,
      authors: thesis.authors,
      year: String(thesis.year),
      category: thesis.category,
      adviser: thesis.adviser,
      tags: thesis.tags.join(", "),
    })
    setReplacementFile(null)
    setRemovingFile(false)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setReplacementFile(null)
    setRemovingFile(false)
  }

  async function handleEditSave() {
    if (!detailThesis || !editDraft.title.trim() || !editDraft.authors.trim()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: editDraft.title.trim(),
        authors: editDraft.authors.trim(),
        year: Number(editDraft.year) || detailThesis.year,
        category: editDraft.category.trim(),
        adviser: editDraft.adviser.trim() || "For assignment",
        tags: editDraft.tags.split(",").map((t) => t.trim()).filter(Boolean),
      }
      if (replacementFile) {
        body.pdfUrl = replacementFile.url
        body.fileName = replacementFile.name
      } else if (removingFile) {
        body.pdfUrl = ""
        body.fileName = ""
      }
      const res = await fetch(`/api/portal/theses/${detailThesis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save.")
      setTheses((prev) => prev.map((t) => t.id === detailThesis.id ? { ...t, ...body } : t))
      setDetailThesis((prev) => prev ? { ...prev, ...body } : null)
      setEditing(false)
      setReplacementFile(null)
      setRemovingFile(false)
      toast.success("Thesis updated successfully")
    } catch (e) {
      toast.error(`Failed to update thesis${e instanceof Error ? `: ${e.message}` : ""}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitThesis(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!thesisDraft.title.trim() || !thesisDraft.authors.trim() || !thesisDraft.pdfUrl) return

    setUploading(true)
    try {
      const newItem = {
        id: `TH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: thesisDraft.title.trim(),
        authors: thesisDraft.authors.trim(),
        year: Number(thesisDraft.year) || 2026,
        category: thesisDraft.category.trim(),
        adviser: thesisDraft.adviser.trim() || "For assignment",
        abstract:
          thesisDraft.abstract.trim() ||
          "Abstract will be supplied after manuscript review.",
        tags: thesisDraft.category.split(" ").filter(Boolean).slice(0, 3),
        pdfUrl: thesisDraft.pdfUrl,
        fileName:
          thesisDraft.fileName ||
          `${thesisDraft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
      }

      const res = await fetch("/api/portal/theses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save.")
      if (json.data) setTheses((current) => [json.data, ...current])

      setThesisDraft({
        title: "",
        authors: "",
        year: "2026",
        category: "Software Engineering",
        adviser: "",
        abstract: "",
        pdfUrl: "",
        fileName: "",
      })
      setShowThesisUploadForm(false)
      toast.success("Thesis uploaded successfully")
    } catch {
      toast.error("Failed to upload thesis")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <LibraryBig className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Search className="size-4" />
              Research Repository
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              Thesis Library
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Browse and manage thesis manuscripts in the research repository.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Metric label="Repository Records" value={String(theses.length)} icon={BookOpen} />
        <Metric label="Categories" value={String(Math.max(0, categories.length - 1))} icon={Tags} tone="glacier" />
      </div>

      <Dialog open={showThesisUploadForm} onOpenChange={setShowThesisUploadForm}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmitThesis}>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/35 text-foreground">
                  <LibraryBig className="size-5" />
                </span>
                <div>
                  <DialogTitle className="text-xl">Upload Thesis PDF</DialogTitle>
                  <DialogDescription>Add a new manuscript to the thesis repository</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Input
                value={thesisDraft.title}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Thesis title"
                className="h-10 rounded-lg"
              />

              <Input
                value={thesisDraft.authors}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    authors: event.target.value,
                  }))
                }
                placeholder="Authors"
                className="h-10 rounded-lg"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={thesisDraft.category}
                  onChange={(event) =>
                    setThesisDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="Category"
                  className="h-10 rounded-lg"
                />

                <Input
                  value={thesisDraft.year}
                  onChange={(event) =>
                    setThesisDraft((current) => ({
                      ...current,
                      year: event.target.value,
                    }))
                  }
                  placeholder="Year"
                  className="h-10 rounded-lg"
                />
              </div>

              <Input
                value={thesisDraft.adviser}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    adviser: event.target.value,
                  }))
                }
                placeholder="Adviser"
                className="h-10 rounded-lg"
              />

              <Input
                type="file"
                accept="application/pdf,.pdf"
                className="h-10 rounded-lg"
                onChange={(event) => {
                  const file = event.target.files?.[0]

                  if (!file) return
                  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
                    toast.error("Please upload a PDF manuscript.")
                    event.target.value = ""
                    return
                  }

                  const reader = new FileReader()
                  reader.onload = () => {
                    setThesisDraft((current) => ({
                      ...current,
                      pdfUrl: reader.result as string,
                      fileName: file.name,
                    }))
                  }
                  reader.readAsDataURL(file)
                }}
              />

              <Textarea
                value={thesisDraft.abstract}
                onChange={(value) =>
                  setThesisDraft((current) => ({
                    ...current,
                    abstract: value,
                  }))
                }
                placeholder="Abstract"
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="rounded-lg">
                  <X className="size-4" />
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="rounded-lg" disabled={uploading}>
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {uploading ? "Uploading..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailThesis !== null} onOpenChange={(open) => { if (!open) { setDetailThesis(null); setEditing(false); setReplacementFile(null); setRemovingFile(false) } }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailThesis && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/35 text-foreground">
                    <LibraryBig className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2">
                      <StatusBadge value={editing ? editDraft.category : detailThesis.category} />
                    </div>
                    {editing ? (
                      <Input value={editDraft.title}
                        onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                        className="h-9 rounded-lg text-lg font-bold" placeholder="Thesis title" />
                    ) : (
                      <DialogTitle className="text-xl leading-tight">{detailThesis.title}</DialogTitle>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-5">
                <div className="space-y-5 md:col-span-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authors</p>
                    {editing ? (
                      <Input value={editDraft.authors}
                        onChange={(e) => setEditDraft((d) => ({ ...d, authors: e.target.value }))}
                        className="h-9 rounded-lg" placeholder="Authors" />
                    ) : (
                      <p className="text-base font-semibold text-foreground">{detailThesis.authors}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adviser</p>
                      {editing ? (
                        <Input value={editDraft.adviser}
                          onChange={(e) => setEditDraft((d) => ({ ...d, adviser: e.target.value }))}
                          className="mt-0.5 h-9 rounded-lg" placeholder="Adviser" />
                      ) : (
                        <p className="mt-0.5 text-sm text-foreground/80">{detailThesis.adviser}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Year</p>
                      {editing ? (
                        <Input value={editDraft.year}
                          onChange={(e) => setEditDraft((d) => ({ ...d, year: e.target.value }))}
                          className="mt-0.5 h-9 rounded-lg" placeholder="Year" />
                      ) : (
                        <p className="mt-0.5 text-sm text-foreground/80">{detailThesis.year}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                      {editing ? (
                        <Input value={editDraft.category}
                          onChange={(e) => setEditDraft((d) => ({ ...d, category: e.target.value }))}
                          className="mt-0.5 h-9 rounded-lg" placeholder="Category" />
                      ) : (
                        <p className="mt-0.5 text-sm text-foreground/80">{detailThesis.category}</p>
                      )}
                    </div>
                  </div>

                  {(editing || detailThesis.tags.length > 0) && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
                      {editing ? (
                        <Input value={editDraft.tags}
                          onChange={(e) => setEditDraft((d) => ({ ...d, tags: e.target.value }))}
                          className="h-9 rounded-lg" placeholder="Separate tags with commas" />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {detailThesis.tags.map((tag) => (
                            <span key={tag} className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground/60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Manuscript File</p>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                        <FileIcon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {removingFile ? (
                          <p className="text-sm font-semibold text-red-500">File will be removed on save</p>
                        ) : replacementFile ? (
                          <p className="truncate text-sm font-semibold text-foreground">{replacementFile.name}</p>
                        ) : (
                          <>
                            <p className="truncate text-sm font-semibold text-foreground">
                              {detailThesis.fileName || `${detailThesis.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`}
                            </p>
                            <p className="text-xs text-muted-foreground">PDF &middot; Manuscript File</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editing ? (
                        <>
                          {!removingFile && !replacementFile && (
                            <>
                              <Button size="sm" variant="outline"
                                className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                                onClick={() => fileInputRef.current?.click()}>
                                <Plus className="size-3.5" />
                                {detailThesis.pdfUrl ? "Replace" : "Upload"}
                              </Button>
                              {detailThesis.pdfUrl && (
                                <Button size="sm" variant="outline"
                                  className="h-8 gap-1.5 rounded-lg px-3 text-xs text-red-500 hover:text-red-600"
                                  onClick={() => setRemovingFile(true)}>
                                  <Trash2 className="size-3.5" />
                                  Remove
                                </Button>
                              )}
                            </>
                          )}
                          {replacementFile && (
                            <Button size="sm" variant="outline"
                              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                              onClick={() => setReplacementFile(null)}>
                              <X className="size-3.5" />
                              Cancel
                            </Button>
                          )}
                          {removingFile && (
                            <Button size="sm" variant="outline"
                              className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                              onClick={() => setRemovingFile(false)}>
                              <X className="size-3.5" />
                              Undo
                            </Button>
                          )}
                        </>
                      ) : detailThesis.pdfUrl ? (
                        <>
                          <Button size="sm" variant="outline"
                            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                            onClick={() => window.open(detailThesis.pdfUrl, "_blank")}>
                            <ExternalLink className="size-3.5" />
                            Open
                          </Button>
                          <Button size="sm"
                            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                            onClick={async () => {
                              try {
                                const res = await fetch(detailThesis.pdfUrl)
                                const blob = await res.blob()
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement("a")
                                a.href = url
                                a.download = detailThesis.fileName || `${detailThesis.title}.pdf`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                              } catch {
                                window.open(detailThesis.pdfUrl, "_blank")
                              }
                            }}>
                            <Download className="size-3.5" />
                            Download
                          </Button>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No manuscript file attached</p>
                      )}
                    </div>
                  </div>
                  <input type="file" accept="application/pdf,.pdf" ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
                        toast.error("Please upload a PDF manuscript.")
                        e.target.value = ""
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        setReplacementFile({ url: reader.result as string, name: file.name })
                        setRemovingFile(false)
                      }
                      reader.readAsDataURL(file)
                      e.target.value = ""
                    }} />
                </div>
              </div>

              {detailThesis.createdAt && (
                <div className="-mx-6 -mb-4 mt-2 border-t border-border bg-muted/20 px-6 py-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>Added: {new Date(detailThesis.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                    {detailThesis.updatedAt && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>Updated: {new Date(detailThesis.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {role === "admin" && (
                <div className="-mx-6 -mb-4 mt-0 border-t border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {editing ? (
                        <>
                          <Button size="sm" variant="ghost"
                            className="h-8 rounded-lg px-3 text-xs"
                            onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <Button size="sm"
                            className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                            disabled={saving}
                            onClick={handleEditSave}>
                            {saving ? <Loader2 className="size-3 animate-spin" /> : <FileText className="size-3" />}
                            {saving ? "Saving..." : "Save Changes"}
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline"
                          className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                          onClick={() => openEditDraft(detailThesis)}>
                          <FileText className="size-3" />
                          Edit Details
                        </Button>
                      )}
                    </div>
                    <Button size="sm" variant="outline"
                      className="h-8 rounded-lg text-xs text-red-500 hover:text-red-600"
                      onClick={() => { confirmAndDeleteThesis(detailThesis.id); setDetailThesis(null); setEditing(false); setReplacementFile(null); setRemovingFile(false) }}>
                      <Trash2 className="size-3" />
                      Move to Trash Bin
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {showThesisTrash ? (
        <ThesisTrashPanel model={model} onBack={() => setShowThesisTrash(false)} />
      ) : (
        <Panel
          title="Thesis Records"
          actions={
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="grow [&>div]:!max-w-none">
                <SearchBox
                  value={query}
                  onChange={setQuery}
                  placeholder="Search title, author, adviser, or keyword"
                />
              </div>
              {role === "admin" && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowThesisUploadForm((current) => !current)}
                    className="h-10 gap-2 rounded-lg px-5 text-sm font-semibold"
                  >
                    <Plus className="size-4" />
                    Upload Thesis
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowThesisTrash(true)}
                    className="h-10 gap-2 rounded-lg px-5 text-sm font-semibold"
                  >
                    <Trash2 className="size-4" />
                    Trash Bin
                  </Button>
                </div>
              )}
              <div className="flex shrink-0 gap-2">
                <Select
                  value={thesisYearFilter}
                  onChange={setThesisYearFilter}
                  options={years}
                />
                <Select
                  value={thesisCategoryFilter}
                  onChange={setThesisCategoryFilter}
                  options={categories}
                />
              </div>
            </div>
          }
        >

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTheses.map((thesis) => (
              <article
                key={thesis.id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:ring-1 hover:ring-primary/20"
                onClick={() => setDetailThesis(thesis)}
              >
                <div className="flex h-full flex-col p-5">
                  <div className="flex flex-1 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10">
                      <FileIcon className="size-5" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={thesis.category} />
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {thesis.year}
                        </span>
                      </div>
                      <h4 className="mt-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {thesis.title}
                      </h4>
                      <p className="mt-1.5 grow truncate text-sm text-foreground/60">{thesis.authors}</p>
                      <div className="flex items-center justify-between gap-2 pt-4">
                        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{thesis.adviser}</span>
                          {thesis.tags.length > 0 && (
                            <span className="hidden sm:inline-flex items-center gap-1">
                              <span className="size-1 rounded-full bg-muted-foreground/40" />
                              {thesis.tags.slice(0, 2).join(", ")}
                              {thesis.tags.length > 2 && <span className="text-muted-foreground/50">+{thesis.tags.length - 2}</span>}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {thesis.pdfUrl && (
                        <>
                          <button type="button"
                            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); window.open(thesis.pdfUrl, "_blank") }}
                            title="Open PDF">
                            <ExternalLink className="size-3.5" />
                          </button>
                          <button type="button"
                            className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const res = await fetch(thesis.pdfUrl)
                                const blob = await res.blob()
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement("a")
                                a.href = url
                                a.download = thesis.fileName || `${thesis.title}.pdf`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                              } catch { window.open(thesis.pdfUrl, "_blank") }
                            }}
                            title="Download PDF">
                            <Download className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </article>
            ))}
          </div>

          {filteredTheses.length === 0 ? (
            <div className="mt-4">
              <EmptyState text="No thesis records match the current filters." />
            </div>
          ) : null}
        </Panel>
      )}
    </div>
  )
}
