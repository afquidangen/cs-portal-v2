"use client"

import { useState } from "react"
import { BookOpen, Calendar, Download, FileText, LibraryBig, Loader2, Plus, Search, Tags, FileIcon, ExternalLink, Bookmark, User, Tag, Users, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  EmptyState,
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
    theses,
    thesisCategoryFilter,
    thesisDraft,
    thesisYearFilter,
    setTheses,
  } = model

  
  const categories = [
    "All",
    ...Array.from(new Set(theses.map((thesis) => thesis.category))),
  ]

  const years = [
    "All",
    ...Array.from(new Set(theses.map((thesis) => String(thesis.year)))),
  ]

  const [uploading, setUploading] = useState(false)

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
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Repository Records", value: String(theses.length), note: "Total manuscripts", icon: BookOpen },
          { label: "Visible Results", value: String(filteredTheses.length), note: "After search and filters", icon: FileText },
          { label: "Categories", value: String(Math.max(0, categories.length - 1)), note: "Research groupings", icon: Tags },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                </div>
                <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </div>
          )
        })}
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

      <Panel
        title={role === "admin" ? "Thesis Records" : "Online Thesis Library"}
        eyebrow="Search and filter"
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            {role === "admin" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowThesisUploadForm((current) => !current)}
                className="rounded-lg"
              >
                <Plus className="size-4" />
                Upload Thesis
              </Button>
            ) : null}

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
        }
      >
        <div className="mb-4">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search title, author, adviser, or keyword"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {filteredTheses.map((thesis) => (
            <article
              key={thesis.id}
              className="group rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg"
            >
              <div className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <Bookmark className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge value={thesis.category} />
                    </div>
                    <h4 className="mt-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground">
                      {thesis.title}
                    </h4>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-foreground/70">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Users className="size-3" />
                    </span>
                    <span className="truncate font-medium text-foreground/80">{thesis.authors}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <User className="size-3" />
                    </span>
                    <span className="truncate">{thesis.adviser}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Calendar className="size-3" />
                    </span>
                    <span>{thesis.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/70">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Tag className="size-3" />
                    </span>
                    <span className="truncate">{thesis.category}</span>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-foreground/70">
                  {thesis.abstract}
                </p>

                {thesis.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {thesis.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground/60 dark:bg-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto pt-4">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <FileIcon className="size-6 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {thesis.fileName || `${thesis.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`}
                      </p>
                      <p className="text-xs text-muted-foreground">PDF &middot; Manuscript File</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-1.5 rounded-lg px-3 text-xs"
                        title="Open in new tab"
                        onClick={() => window.open(thesis.pdfUrl, "_blank")}
                      >
                        <ExternalLink className="size-3.5" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 gap-1.5 rounded-lg px-3 text-xs"
                        title="Download PDF"
                        onClick={async () => {
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
                          } catch {
                            window.open(thesis.pdfUrl, "_blank")
                          }
                        }}
                      >
                        <Download className="size-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                {role === "admin" ? (
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-8 text-xs"
                      onClick={() => confirmAndDeleteThesis(thesis.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ) : null}
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
    </div>
  )
}
