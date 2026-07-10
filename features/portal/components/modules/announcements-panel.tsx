"use client"

import { useState } from "react"
import { AlertTriangle, Bell, CalendarDays, Edit, Megaphone, Plus, Trash2, User, Users, X } from "lucide-react"

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

import type { Announcement } from "../../data/portal-data"
import { Panel, Select, StatusBadge, Textarea } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

function getPriorityStyles(priority: Announcement["priority"]) {
  if (priority === "High") {
    return {
      rail: "bg-red-400/75",
      icon: "border-red-200/70 bg-red-50/70 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200",
      chip: "border-red-200/70 bg-red-50/70 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200",
      ring: "border-red-200/65 dark:border-red-500/25",
      text: "text-red-700 dark:text-red-200",
    }
  }

  if (priority === "Medium") {
    return {
      rail: "bg-amber-300/80",
      icon: "border-amber-200/70 bg-amber-50/70 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
      chip: "border-amber-200/70 bg-amber-50/70 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
      ring: "border-amber-200/65 dark:border-amber-500/25",
      text: "text-amber-800 dark:text-amber-100",
    }
  }

  return {
    rail: "bg-sky-300/80",
    icon: "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100",
    chip: "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100",
    ring: "border-sky-200/65 dark:border-sky-500/25",
    text: "text-sky-700 dark:text-sky-100",
  }
}

type AnnouncementsPanelProps = PortalModuleProps & {
  onShowTrash?: () => void
}

export function AnnouncementsPanel({ model, onShowTrash }: AnnouncementsPanelProps) {
  const {
    filteredAnnouncements,
    handleDeleteAnnouncement,
    handleUpdateAnnouncement,
    role,
    setShowAnnouncementForm,
    facultyClassSections,
    profileSection,
    profile,
  } = model

  function getAudienceLabel(a: Announcement): string {
    const standard = ["All Users", "Students", "Faculty"]
    if (standard.includes(a.audience)) return a.audience
    const sections = a.classSections?.length ? a.classSections : a.classSection ? [a.classSection] : a.audience?.split(", ") ?? []
    const filtered = sections.filter((s) => !standard.includes(s))
    if (filtered.length <= 1) return filtered[0] ?? a.audience
    return `${filtered.length} Sections`
  }

  const filtered = filteredAnnouncements.filter((a) => {
    if (role === "admin") return a.audience === "All Users"
    if (role === "student") return a.audience === "All Users" || a.audience === "Students" || a.audience?.split(", ").includes(profileSection) || (a.classSections?.includes(profileSection) ?? false) || a.classSection === profileSection
    return a.audience === "All Users" || a.audience === "Faculty" || a.createdBy === profile.name
  })

  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null)
  const [deletingAnnId, setDeletingAnnId] = useState<string | null>(null)
  const leadAnnouncement = filtered[0]
  const remainingAnnouncements = filtered.slice(1)
  const priorityTotals = {
    high: filtered.filter((announcement) => announcement.priority === "High").length,
    medium: filtered.filter((announcement) => announcement.priority === "Medium").length,
    low: filtered.filter((announcement) => announcement.priority === "Low").length,
  }

  return (
    <>
      <Panel
        title="CS Updates and Announcements"
        className="[&>div:first-child]:hidden"
      >
        <div className="space-y-4 pb-6 pt-4">
          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Announcements</h1>
              <p className="mt-2 text-sm text-slate-600">Read department updates, class bulletins, and campus notices.</p>
            </div>
              <div className="grid w-full grid-cols-3 gap-2 lg:max-w-sm">
                {[
                  { label: "High", value: priorityTotals.high },
                  { label: "Medium", value: priorityTotals.medium },
                  { label: "Low", value: priorityTotals.low },
                ].map((item) => {
                  const priorityStyles = getPriorityStyles(item.label as Announcement["priority"])

                  return (
                  <div key={item.label} className={`rounded-lg border bg-white px-3 py-2 text-center shadow-sm ${priorityStyles.ring}`}>
                    <p className={`text-lg font-semibold tabular-nums ${priorityStyles.text}`}>{item.value}</p>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${priorityStyles.text}`}>
                      {item.label}
                    </p>
                  </div>
                  )
                })}
              </div>
          </div>

          {role !== "student" ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="rounded-md border-slate-200"
                onClick={onShowTrash}
              >
                <Trash2 className="mr-1.5 size-4" />
                Trash Bin
              </Button>
            </div>
          ) : null}

          {role !== "student" ? (
            <button
              type="button"
              onClick={() => setShowAnnouncementForm(true)}
              className="group flex w-full items-center gap-4 rounded-lg border border-dashed border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:bg-slate-50"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Plus className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-slate-950">Add Announcement</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Compose a new CS update, choose the audience, and set its priority.
                </span>
              </span>
            </button>
          ) : null}

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white py-10 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No announcements yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Published department updates will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                {leadAnnouncement ? (
                  <article className={`relative overflow-hidden rounded-lg border bg-white p-5 shadow-sm ${getPriorityStyles(leadAnnouncement.priority).ring}`}>
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${getPriorityStyles(leadAnnouncement.priority).rail}`} />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg border shadow-sm ${getPriorityStyles(leadAnnouncement.priority).icon}`}>
                          <Megaphone className="size-7" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/35 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                              Latest Bulletin
                            </span>
                            <StatusBadge value={leadAnnouncement.priority} />
                          </div>
                          <h4 className="mt-4 text-xl font-semibold leading-tight tracking-tight text-slate-950">
                            {leadAnnouncement.title}
                          </h4>
                          <p className="mt-3 max-w-4xl text-sm leading-7 text-foreground/80">
                            {leadAnnouncement.content}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/25 px-2.5 py-1.5">
                              <CalendarDays className="size-3.5" />
                              {leadAnnouncement.date}
                            </span>
                            {leadAnnouncement.createdBy ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/25 px-2.5 py-1.5">
                                <User className="size-3.5" />
                                {leadAnnouncement.classSection || leadAnnouncement.classSections?.length ? leadAnnouncement.createdBy : "ADMIN"}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/25 px-2.5 py-1.5">
                              <Users className="size-3.5" />
                              {getAudienceLabel(leadAnnouncement)}
                            </span>
                            {(leadAnnouncement.classSections?.length ? leadAnnouncement.classSections : leadAnnouncement.classSection ? [leadAnnouncement.classSection] : leadAnnouncement.audience?.split(", ") ?? []).filter((s) => s !== "All Users" && s !== "Students" && s !== "Faculty").map((s) => (
                              <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-primary">
                                <Megaphone className="size-3.5" />
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {role === "admin" || (role === "faculty" && ((leadAnnouncement.classSections?.some((s) => facultyClassSections.includes(s)) ?? false) || (leadAnnouncement.classSection && facultyClassSections.includes(leadAnnouncement.classSection)))) ? (
                        <div className="flex shrink-0 items-center gap-2 self-start">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => setEditingAnn(leadAnnouncement)}
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-red-500 hover:text-red-600"
                            onClick={() => setDeletingAnnId(leadAnnouncement.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ) : null}

                <div className="rounded-2xl border border-border bg-muted/15 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">
                        Announcement Feed
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sorted by latest posted update
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {filtered.length} total
                    </span>
                  </div>

                  <div className="space-y-3">
                {remainingAnnouncements.map((announcement) => {
                  const priorityStyles = getPriorityStyles(announcement.priority)
                  const PriorityIcon = announcement.priority === "High" ? AlertTriangle : Bell

                  return (
                    <article
                      key={announcement.id}
                      className={`group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition hover:border-foreground/20 hover:shadow-md ${priorityStyles.ring}`}
                    >
                      <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${priorityStyles.rail}`} />
                      <div className="flex gap-4 pl-2">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${priorityStyles.icon}`}>
                          <PriorityIcon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-lg font-extrabold leading-tight tracking-tight text-foreground">
                                {announcement.title}
                              </h4>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${priorityStyles.chip}`}>
                                  {announcement.priority} Priority
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                  <Users className="size-3.5" />
                                  {getAudienceLabel(announcement)}
                                </span>
                                {(announcement.classSections?.length ? announcement.classSections : announcement.classSection ? [announcement.classSection] : announcement.audience?.split(", ") ?? []).filter((s) => s !== "All Users" && s !== "Students" && s !== "Faculty").map((s) => (
                                  <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                                    <Megaphone className="size-3" />
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {role === "admin" || (role === "faculty" && ((announcement.classSections?.some((s) => facultyClassSections.includes(s)) ?? false) || (announcement.classSection && facultyClassSections.includes(announcement.classSection)))) ? (
                              <div className="flex shrink-0 items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg"
                                  onClick={() => setEditingAnn(announcement)}
                                >
                                  <Edit className="size-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg text-red-500 hover:text-red-600"
                                  onClick={() => setDeletingAnnId(announcement.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-foreground/78">
                            {announcement.content}
                          </p>
                          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            {announcement.date}
                          </p>
                          {announcement.createdBy ? (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <User className="size-3.5" />
                              {announcement.classSection || announcement.classSections?.length ? announcement.createdBy : "ADMIN"}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editingAnn} onOpenChange={(o) => { if (!o) setEditingAnn(null) }}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85dvh] overflow-y-auto">
          {editingAnn ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!editingAnn.title.trim() || !editingAnn.content.trim()) return
                handleUpdateAnnouncement(editingAnn)
                setEditingAnn(null)
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground">Edit Announcement</DialogTitle>
                <DialogDescription className="pt-1 text-muted-foreground">
                  Update announcement details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Input
                  value={editingAnn.title}
                  onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                  placeholder="Announcement title"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Audience</label>
                    {role === "faculty" && (editingAnn.classSections?.length || editingAnn.classSection || (editingAnn.audience && editingAnn.audience !== "All Users" && editingAnn.audience !== "Students" && editingAnn.audience !== "Faculty")) ? (
                      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        {(editingAnn.classSections?.length ? editingAnn.classSections : editingAnn.classSection ? [editingAnn.classSection] : editingAnn.audience?.split(", ") ?? []).filter((s) => s !== "All Users" && s !== "Students" && s !== "Faculty").map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <Select
                        value={editingAnn.audience}
                        onChange={(value) => setEditingAnn({ ...editingAnn, audience: value })}
                        options={["All Users", "Students", "Faculty"]}
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Priority</label>
                    <Select
                      value={editingAnn.priority}
                      onChange={(value) => setEditingAnn({ ...editingAnn, priority: value as Announcement["priority"] })}
                      options={["High", "Medium", "Low"]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Content</label>
                  <Textarea
                    value={editingAnn.content}
                    onChange={(value) => setEditingAnn({ ...editingAnn, content: value })}
                    placeholder="Announcement details"
                    rows={6}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    <X className="mr-1.5 size-4" /> Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">
                  <Edit className="mr-1.5 size-4" /> Save Changes
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={!!deletingAnnId} onOpenChange={(o) => { if (!o) setDeletingAnnId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Announcement</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              This announcement will be moved to the trash bin. You can restore it later from the Trash Bin.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deletingAnnId) handleDeleteAnnouncement(deletingAnnId, profile?.name)
                setDeletingAnnId(null)
              }}
            >
              <Trash2 className="mr-1.5 size-4" /> Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
