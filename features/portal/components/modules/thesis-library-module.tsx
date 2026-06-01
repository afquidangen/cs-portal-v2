"use client"

import { Download, Plus } from "lucide-react"

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
import type { PortalModuleProps } from "./types"

export function ThesisLibraryModule({ model }: PortalModuleProps) {
  const {
    confirmAndDeleteThesis,
    filteredTheses,
    handleCreateThesis,
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
  } = model

  
  const categories = [
    "All",
    ...Array.from(new Set(theses.map((thesis) => thesis.category))),
  ]

  const years = [
    "All",
    ...Array.from(new Set(theses.map((thesis) => String(thesis.year)))),
  ]

  return (
    <div className="space-y-5">
      {role === "admin" && showThesisUploadForm ? (
        <Panel title="Upload Thesis PDF" eyebrow="Repository management">
          <form onSubmit={handleCreateThesis} className="grid gap-3 lg:grid-cols-2">
            <Input
              value={thesisDraft.title}
              onChange={(event) =>
                setThesisDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Thesis title"
              className="h-10 rounded-2xl"
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
              className="h-10 rounded-2xl"
            />

            <Input
              value={thesisDraft.category}
              onChange={(event) =>
                setThesisDraft((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              placeholder="Category"
              className="h-10 rounded-2xl"
            />

            <Input
              value={thesisDraft.adviser}
              onChange={(event) =>
                setThesisDraft((current) => ({
                  ...current,
                  adviser: event.target.value,
                }))
              }
              placeholder="Adviser"
              className="h-10 rounded-2xl"
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
              className="h-10 rounded-2xl"
            />

            <div className="flex items-center gap-2">
<Input
  type="file"
  accept="application/pdf,.pdf"
  className="h-10 rounded-2xl"
  onChange={(event) => {
    const file = event.target.files?.[0]

    if (!file) return
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      window.alert("Please upload a PDF manuscript.")
      event.target.value = ""
      return
    }

    setThesisDraft((current) => ({
      ...current,
      pdfUrl: URL.createObjectURL(file),
      fileName: file.name,
    }))
  }}
/>
              <Button type="submit" size="sm" className="rounded-2xl">
                <Plus className="size-4" />
                Save
              </Button>
            </div>

            <div className="lg:col-span-2">
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
          </form>
        </Panel>
      ) : null}

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
                className="rounded-2xl"
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

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTheses.map((thesis) => (
            <article
              key={thesis.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {thesis.title}
                  </h4>
                  <p className="mt-1 text-sm text-foreground/70">
                    {thesis.authors} - {thesis.year}
                  </p>
                </div>
                <StatusBadge value={thesis.category} />
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80">
                {thesis.abstract}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {thesis.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xl border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
<Button
  asChild
  size="sm"
  className="rounded-2xl"
>
  <a
    href={thesis.pdfUrl}
    download={thesis.fileName || `${thesis.title}.pdf`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <Download className="size-4" />
    Download PDF
  </a>
</Button>

                {role === "admin" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => confirmAndDeleteThesis(thesis.id)}
                  >
                    Delete
                  </Button>
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
