"use client"

import Image from "next/image"
import {
  Camera,
  CalendarDays,
  Code2,
  Heart,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

type Member = {
  name: string
  role: string
  details: string
  imageUrl?: string
  cloudinaryPublicId?: string
}

type Contributor = {
  name: string
  role: string
  imageUrl?: string
  cloudinaryPublicId?: string
}

type ProjectFact = {
  label: string
  value: string
}

const defaultMembers: Member[] = [
  {
    name: "KYLA G. CABLAY",
    role: "Data Analyst | Documentation",
    details: "Manages system logic, database flow, and backend integration.",
  },
  {
    name: "ALYSSA FAYE S. QUIDANGEN",
    role: "Project Manager | Frontend Developer",
    details: "Leads planning, coordination, and overall project execution.",
  },
  {
    name: "HEZRON R. GAGARIN",
    role: "Tech Lead | Backend Developer",
    details: "Leads technical development and ensures system consistency.",
  },
  {
    name: "CHRISTIAN M. GALINATO",
    role: "Quality Assurance Lead | Backend Developer",
    details: "Leads testing and ensures the system works correctly.",
  },
]

const defaultFacts: ProjectFact[] = [
  { label: "Portal focus", value: "Academic records, announcements, and student services" },
  { label: "Primary users", value: "Students, faculty, and administrators" },
  { label: "Development year", value: "2026" },
]

const defaultContributors: Contributor[] = [
  { name: "JEDRICK S. KARGANILLA", role: "System Architect", imageUrl: "/contributors/jedrick_karganilla.jpg" },
  { name: "JOSE S. GIRONELLA", role: "Main Developer", imageUrl: "/contributors/jose_gironella.jpg" },
  { name: "SEAN KELLY T. DAUSEN", role: "Project Manager", imageUrl: "/contributors/sean_dausen.jpg" },
  { name: "ELLA SHANE R. PAGLINAWAN", role: "Main Developer", imageUrl: "/contributors/ella_paglinawan.jpg" },
  { name: "BRIGITTE MAE E. IBENG", role: "QA Tester", imageUrl: "/contributors/brigitte_ibeng.jpg" },
]

type AboutData = {
  teamName: string
  description: string
  acknowledgment: string
  teamPictureUrl?: string
  teamPicturePublicId?: string
  teamMembers: Member[]
  projectFacts: ProjectFact[]
  pastContributors: Contributor[]
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

export function AboutModule({ model }: PortalModuleProps) {
  const isAdmin = model.role === "admin"
  const [data, setData] = useState<AboutData>({
    teamName: "GIT LOST",
    description:
      "Developed by a team of incoming fourth-year student interns during the 2025\u20132026 academic year at ISPSC, the ComScite Portal was designed as a unified academic workspace.",
    acknowledgment:
      "This project stands on the foundation built by the initial contributors of CCIS Portal v1, whose early concepts made this portal possible.",
    teamPictureUrl: undefined,
    teamPicturePublicId: undefined,
    teamMembers: defaultMembers,
    projectFacts: defaultFacts,
    pastContributors: defaultContributors,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "teamPicture" | "member" | "contributor"
    index?: number
  } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [fileTarget, setFileTarget] = useState<{
    type: "teamPicture" | "member" | "contributor"
    index?: number
  } | null>(null)

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await fetch("/api/portal/about")
        if (!res.ok) return
        const json = await res.json()
        const apiData = json.data
        if (apiData) {
          setData((prev) => ({
            ...prev,
            teamName: apiData.teamName ?? prev.teamName,
            description: apiData.description ?? prev.description,
            acknowledgment: apiData.acknowledgment ?? prev.acknowledgment,
            teamPictureUrl: apiData.teamPictureUrl ?? undefined,
            teamPicturePublicId: apiData.teamPicturePublicId ?? undefined,
            teamMembers: apiData.teamMembers?.length ? apiData.teamMembers : prev.teamMembers,
            projectFacts: apiData.projectFacts?.length ? apiData.projectFacts : prev.projectFacts,
            pastContributors: apiData.pastContributors?.length
              ? apiData.pastContributors
              : prev.pastContributors,
          }))
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    void fetchAbout()
  }, [])

  async function saveAbout(updated: AboutData) {
    setSaving(true)
    try {
      const res = await fetch("/api/portal/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      if (!res.ok) return
      const json = await res.json()
      if (json.data) {
        setData((prev) => ({
          ...prev,
          ...json.data,
          teamPictureUrl: json.data.teamPictureUrl ?? undefined,
          teamPicturePublicId: json.data.teamPicturePublicId ?? undefined,
          teamMembers: json.data.teamMembers ?? prev.teamMembers,
          projectFacts: json.data.projectFacts ?? prev.projectFacts,
          pastContributors: json.data.pastContributors ?? prev.pastContributors,
        }))
      }
    } catch {
    } finally {
      setSaving(false)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !fileTarget) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const updated = { ...data }
      if (fileTarget.type === "teamPicture") {
        updated.teamPictureUrl = base64
        updated.teamPicturePublicId = undefined
      } else if (fileTarget.type === "member" && fileTarget.index !== undefined) {
        updated.teamMembers = updated.teamMembers.map((m, i) =>
          i === fileTarget.index ? { ...m, imageUrl: base64, cloudinaryPublicId: undefined } : m
        )
      } else if (fileTarget.type === "contributor" && fileTarget.index !== undefined) {
        updated.pastContributors = updated.pastContributors.map((c, i) =>
          i === fileTarget.index ? { ...c, imageUrl: base64, cloudinaryPublicId: undefined } : c
        )
      }
      void saveAbout(updated)
    }
    reader.readAsDataURL(f)
    e.target.value = ""
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const updated = { ...data }
    if (deleteTarget.type === "teamPicture") {
      updated.teamPictureUrl = undefined
      updated.teamPicturePublicId = undefined
    } else if (deleteTarget.type === "member" && deleteTarget.index !== undefined) {
      updated.teamMembers = updated.teamMembers.map((m, i) =>
        i === deleteTarget.index ? { ...m, imageUrl: undefined, cloudinaryPublicId: undefined } : m
      )
    } else if (deleteTarget.type === "contributor" && deleteTarget.index !== undefined) {
      updated.pastContributors = updated.pastContributors.map((c, i) =>
        i === deleteTarget.index
          ? { ...c, imageUrl: undefined, cloudinaryPublicId: undefined }
          : c
      )
    }
    void saveAbout(updated)
    setDeleteTarget(null)
  }

  function triggerUpload(type: "teamPicture" | "member" | "contributor", index?: number) {
    setFileTarget({ type, index })
    fileRef.current?.click()
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      <section className="relative overflow-hidden rounded-xl border border-primary/15 bg-[linear-gradient(120deg,#f8fbff_0%,#eef7ff_56%,#f7fbff_100%)] p-5 shadow-sm dark:border-[#1d3858] dark:bg-[linear-gradient(120deg,#071224_0%,#0b2038_58%,#123768_100%)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(36,120,255,0.08)_1px,transparent_1px),linear-gradient(rgba(36,120,255,0.06)_1px,transparent_1px)] bg-[size:38px_38px] opacity-50 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)]" />

        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[260px] flex-col justify-center text-center xl:text-left">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-white/80 text-primary shadow-sm dark:border-[#8bd3ff]/25 dark:bg-white/10 dark:text-[#8bd3ff] xl:mx-0">
              <Users className="size-7" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary dark:text-[#8bd3ff]">
              About ComScite Portal
            </p>
            <h2 className="mt-3 font-heading text-[2.6rem] font-black uppercase leading-tight tracking-[0.03em] text-foreground sm:text-[3.25rem]">
              Meet the Team
            </h2>
            <p className="mt-2 text-lg font-semibold text-foreground/90 sm:text-xl">
              {data.teamName}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base xl:mx-0">
              {data.description}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-primary dark:text-[#8bd3ff] xl:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
                <Sparkles className="size-3.5" />
                Student-built portal
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white/70 px-3 py-1.5 dark:border-[#8bd3ff]/20 dark:bg-white/10">
                <Code2 className="size-3.5" />
                Academic workspace
              </span>
            </div>
          </div>

          <div className="relative rounded-xl border border-primary/15 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-[#8bd3ff]/20 dark:bg-white/10">
            <div className="edu-bg-soft-glacier flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-[var(--edu-border-glacier)] text-center">
              {data.teamPictureUrl ? (
                <div className="relative h-full min-h-[260px] w-full">
                  <Image
                    src={data.teamPictureUrl}
                    alt="Team picture"
                    fill
                    className="rounded-xl object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="px-6">
                  <div className="edu-lapis mx-auto flex size-14 items-center justify-center rounded-xl shadow-sm">
                    <Camera className="size-7" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    Team picture placeholder
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Add the final group photo here when available.
                  </p>
                </div>
              )}
            </div>
            {isAdmin ? (
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-xs"
                  onClick={() => triggerUpload("teamPicture")}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  {data.teamPictureUrl ? "Change" : "Upload"}
                </Button>
                {data.teamPictureUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg text-xs text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget({ type: "teamPicture" })}
                    disabled={saving}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 md:grid-cols-3">
          {data.projectFacts.map((fact) => {
            const icons = [Code2, Users, CalendarDays] as const
            const Icon = icons[data.projectFacts.indexOf(fact)] ?? Code2
            return (
              <div key={fact.label} className="rounded-xl border border-primary/15 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-[#8bd3ff]/20 dark:bg-white/10">
                <div className="flex items-start gap-3">
                  <span className="edu-bg-soft-glacier edu-ring-glacier flex size-10 shrink-0 items-center justify-center rounded-lg border text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{fact.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{fact.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <Panel title="Team Members and Roles" eyebrow="Member directory">
        <div className="mb-5 flex items-center gap-3">
          <div className="edu-bg-soft-glacier edu-ring-glacier flex size-11 items-center justify-center rounded-xl border text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Member Profiles</h3>
            <p className="text-sm text-foreground/70">Role ownership and contribution areas</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.teamMembers.map((member, index) => (
            <article
              key={member.name}
              className="group relative overflow-hidden rounded-xl border border-[var(--edu-border-lapis)] bg-card shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="edu-bg-soft-glacier relative flex h-[220px] items-center justify-center overflow-hidden border-b border-border">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    unoptimized
                  />
                ) : (
                  <div className="edu-lapis flex size-24 items-center justify-center rounded-full text-2xl font-semibold shadow-sm">
                    {initials(member.name)}
                  </div>
                )}
                {isAdmin ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition hover:bg-white"
                      onClick={() => triggerUpload("member", index)}
                      disabled={saving}
                      title="Upload photo"
                    >
                      {saving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Pencil className="size-4" />
                      )}
                    </button>
                    {member.imageUrl ? (
                      <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-white"
                        onClick={() => setDeleteTarget({ type: "member", index })}
                        disabled={saving}
                        title="Delete photo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <h4 className="text-base font-semibold text-foreground">{member.name}</h4>
                <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                <p className="mt-3 text-sm leading-6 text-foreground/75">{member.details}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Acknowledgments" eyebrow="Initial contributors">
        <div className="mb-5 flex items-center gap-3">
          <div className="edu-bg-soft-glacier edu-ring-glacier flex size-11 items-center justify-center rounded-xl border text-primary">
            <Heart className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Credit and Acknowledgment</h3>
            <p className="text-sm text-foreground/70">Past contributors and foundation</p>
          </div>
        </div>

        <div className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] p-6 shadow-sm">
          <p className="text-sm leading-7 text-foreground/80">{data.acknowledgment}</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {data.pastContributors.map((contributor, index) => (
            <article
              key={`${contributor.name}-${index}`}
              className="group relative rounded-xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="edu-bg-soft-glacier mx-auto mb-3 flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--edu-border-glacier)] sm:max-w-[116px] xl:max-w-[104px]">
                {contributor.imageUrl ? (
                  <Image
                    src={contributor.imageUrl}
                    alt={contributor.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Camera className="size-7 text-primary" />
                )}
                {isAdmin ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition hover:bg-white"
                      onClick={() => triggerUpload("contributor", index)}
                      disabled={saving}
                      title="Upload photo"
                    >
                      {saving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Pencil className="size-3.5" />
                      )}
                    </button>
                    {contributor.imageUrl && !contributor.imageUrl.startsWith("/contributors/") ? (
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow transition hover:bg-white"
                        onClick={() => setDeleteTarget({ type: "contributor", index })}
                        disabled={saving}
                        title="Delete photo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <h4 className="text-sm font-semibold leading-5 text-foreground">{contributor.name}</h4>
              <p className="mt-1 text-xs font-medium leading-5 text-primary">{contributor.role}</p>
            </article>
          ))}
        </div>
      </Panel>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? It will also be removed from Cloudinary."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}
