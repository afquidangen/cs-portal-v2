"use client"

import { useState } from "react"
import { AlertTriangle, Bell, CalendarDays, Edit, Megaphone, Plus, Radio, Trash2, User, Users, X } from "lucide-react"

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

export function AnnouncementsPanel({ model }: PortalModuleProps) {
  const {
    announcements,
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

  const filtered = announcements.filter((a) => {
    if (role === "admin") return (a.audience === "All Users" || a.audience === "Students" || a.audience === "Faculty") && !a.classSection && (!a.classSections?.length)
    if (role === "student") return a.audience === "All Users" || a.audience === "Students" || a.audience?.split(", ").includes(profileSection) || (a.classSections?.includes(profileSection) ?? false) || a.classSection === profileSection
    return a.audience === "All Users" || a.audience === "Faculty" || a.audience?.split(", ").some((s) => facultyClassSections.includes(s)) || (a.classSections?.some((s) => facultyClassSections.includes(s)) ?? false) || (a.classSection && facultyClassSections.includes(a.classSection)) || a.createdBy === profile.name
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
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-5 sm:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
                <Radio className="size-8" />
              </div>
              <div className="min-w-0">
                <h3 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
                  THE SOURCE CODE
                </h3>
                <p className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground sm:justify-start">
                  <Bell className="size-4" />
                  CS News and Announcements
                </p>
              </div>
              </div>
              <div className="grid w-full grid-cols-3 gap-2 lg:max-w-sm">
                {[
                  { label: "High", value: priorityTotals.high },
                  { label: "Medium", value: priorityTotals.medium },
                  { label: "Low", value: priorityTotals.low },
                ].map((item) => {
                  const priorityStyles = getPriorityStyles(item.label as Announcement["priority"])

                  return (
                  <div key={item.label} className={`rounded-xl border bg-card/80 px-3 py-2 text-center shadow-sm ${priorityStyles.ring}`}>
                    <p className={`text-lg font-black tabular-nums ${priorityStyles.text}`}>{item.value}</p>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${priorityStyles.text}`}>
                      {item.label}
                    </p>
                  </div>
                  )
                })}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-10 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No announcements yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Published department updates will appear here.
              </p>
            </div>
          ) : (
            <>
              {role !== "student" ? (
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(true)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/35"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/35 text-foreground transition group-hover:border-primary/30 group-hover:text-primary">
                    <Plus className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-foreground">Add Announcement</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                      Compose a new CS update, choose the audience, and set its priority.
                    </span>
                  </span>
                </button>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                {leadAnnouncement ? (
                  <article className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm ${getPriorityStyles(leadAnnouncement.priority).ring}`}>
                    <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${getPriorityStyles(leadAnnouncement.priority).rail}`} />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${getPriorityStyles(leadAnnouncement.priority).icon}`}>
                          <Megaphone className="size-7" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/35 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                              Latest Bulletin
                            </span>
                            <StatusBadge value={leadAnnouncement.priority} />
                          </div>
                          <h4 className="mt-4 text-2xl font-black leading-tight tracking-tight text-foreground">
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
                                {leadAnnouncement.createdBy} - Faculty
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
                              {announcement.createdBy} - Faculty
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
        <DialogContent className="max-w-xl">
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
              Are you sure you want to delete this announcement? This action cannot be undone.
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
                if (deletingAnnId) handleDeleteAnnouncement(deletingAnnId)
                setDeletingAnnId(null)
              }}
            >
              <Trash2 className="mr-1.5 size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
