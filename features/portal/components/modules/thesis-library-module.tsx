"use client"

import { useState } from "react"
import { Download, Plus, Trash2 } from "lucide-react"

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
    downloadThesisPdf,
    filteredTheses,
    handleCreateThesis,
    query,
    role,
    setQuery,
    setThesisCategoryFilter,
    setThesisDraft,
    setThesisYearFilter,
    theses,
    thesisCategoryFilter,
    thesisDraft,
    thesisYearFilter,
    showUploadThesis,
    setShowUploadThesis,
    deleteThesis,
  } = model

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
      {role === "admin" || role === "faculty" ? (
        <div className="flex justify-end">
          <Button onClick={() => setShowUploadThesis(!showUploadThesis)}>
            <Plus className="size-4" />
            {showUploadThesis ? "Cancel" : "Upload Thesis"}
          </Button>
        </div>
      ) : null}

      {showUploadThesis ? (
        <Panel title="Upload Thesis Manuscript" eyebrow="PDF format only">
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
              className="h-9 rounded-lg"
              required
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
              className="h-9 rounded-lg"
              required
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
              className="h-9 rounded-lg"
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
              className="h-9 rounded-lg"
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
              className="h-9 rounded-lg"
            />
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf"
                className="h-9 rounded-lg"
              />
              <Button type="submit" size="sm">
                <Plus className="size-4" />
                Upload
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
        title="Thesis Manuscripts"
        eyebrow="Search and filter"
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
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
              className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-abyss dark:text-quartz">
                    {thesis.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                    {thesis.authors} - {thesis.year}
                  </p>
                </div>
                <StatusBadge value={thesis.category} />
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-blue dark:text-glacier">
                {thesis.abstract}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {thesis.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-glacier/50 px-2 py-1 text-xs font-medium text-abyss dark:bg-lapis/50 dark:text-quartz"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => downloadThesisPdf(thesis)}>
                  <Download className="size-4" />
                  Download PDF
                </Button>
                {role === "admin" || role === "faculty" ? (
                  <div className="flex gap-2">
                    {confirmDelete === thesis.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            deleteThesis(thesis.id)
                            setConfirmDelete(null)
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() => setConfirmDelete(thesis.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {filteredTheses.length === 0 ? (
          <EmptyState text="No thesis records match the current filters." />
        ) : null}
      </Panel>
    </div>
  )
}
