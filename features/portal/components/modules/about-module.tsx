"use client"

import Image from "next/image"
import { CalendarDays, Camera, Code2, Heart, Users } from "lucide-react"

import { Panel } from "../shared/dashboard-ui"

const teamMembers = [
  {
    name: "KYLA G. CABLAY",
    role: "Data Analyst",
    details: "Manages system logic, database flow, and backend integration.",
    image: "",
  },
  {
    name: "ALYSSA FAYE S. QUIDANGEN",
    role: "Project Manager",
    details: "Leads planning, coordination, and overall project execution.",
    image: "",
  },
  {
    name: "HEZRON R. GAGARIN",
    role: "Tech Lead",
    details:  "Leads technical development and ensures system consistency.",
    image: "",
  },
  {
    name: "CHRISTIAN M. GALINATO",
    role: "Quality Assurance Lead",
    details: "Leads testing and ensures the system works correctly.",
    image: "",
  },
]

const projectFacts = [
  { label: "Portal focus", value: "Academic records, announcements, and student services", icon: Code2 },
  { label: "Primary users", value: "Students, faculty, and administrators", icon: Users },
  { label: "Development year", value: "2026", icon: CalendarDays },
]

const pastContributors = [
  { name: "JEDRICK S. KARGANILLA", role: "System Architect", image: "/contributors/jedrick_karganilla.jpg" },
  { name: "JOSE S. GIRONELLA", role: "Main Developer", image: "/contributors/jose_gironella.jpg" },
  { name: "SEAN KELLY T. DAUSEN", role: "Project Manager", image: "/contributors/sean_dausen.jpg" },
  { name: "ELLA SHANE R. PAGLINAWAN", role: "Main Developer", image: "/contributors/ella_paglinawan.jpg" },
  { name: "BRIGITTE MAE E. IBENG", role: "QA Tester", image: "/contributors/brigitte_ibeng.jpg" },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
}

export function AboutModule() {
  return (
    <div className="space-y-5">
      <Panel title="About ComScite Portal" eyebrow="Project profile">
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] p-6 shadow-sm">
            <div className="flex items-start gap-4">

              <div className="min-w-0 flex-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  DEV TEAM 
                </p>
                <h3 className="mx-auto mt-2 max-w-xl text-3xl font-semibold tracking-tight text-foreground">
                  GIT LOST
                </h3>
                <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-foreground/80">
Developed by a team of incoming fourth-year student interns during the 2025–2026 academic year at ISPSC, the ComScite Portal was designed as a unified academic workspace. The platform streamlines student records, faculty workflows, official announcements, feedback collection, and administrative monitoring.                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="edu-bg-soft-glacier flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--edu-border-glacier)] text-center">
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
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {projectFacts.map((fact) => {
            const Icon = fact.icon
            return (
              <div key={fact.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
      </Panel>

      <Panel title="Team Members and Roles" eyebrow="Member directory">
        <div className="mb-5 flex items-center gap-3">
          <div className="edu-bg-soft-glacier edu-ring-glacier flex size-11 items-center justify-center rounded-xl border text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Member Profiles
            </h3>
            <p className="text-sm text-foreground/70">
              Role ownership and contribution areas
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="group overflow-hidden rounded-xl border border-[var(--edu-border-lapis)] bg-card shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="edu-bg-soft-glacier relative flex h-[220px] items-center justify-center overflow-hidden border-b border-border">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="edu-lapis flex size-24 items-center justify-center rounded-full text-2xl font-semibold shadow-sm">
                    {initials(member.name)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-base font-semibold text-foreground">
                  {member.name}
                </h4>
                <p className="mt-1 text-sm font-medium text-primary">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground/75">
                  {member.details}
                </p>
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
          <p className="text-sm leading-7 text-foreground/80">
This project stands on the foundation built by the initial contributors of CCIS Portal v1, whose early concepts made this portal possible.          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {pastContributors.map((contributor, index) => (
            <article
              key={`${contributor.name}-${index}`}
              className="rounded-xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="edu-bg-soft-glacier mx-auto mb-3 flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--edu-border-glacier)] sm:max-w-[116px] xl:max-w-[104px]">
                {contributor.image ? (
                  <Image
                    src={contributor.image}
                    alt={contributor.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="size-7 text-primary" />
                )}
              </div>
              <h4 className="text-sm font-semibold leading-5 text-foreground">{contributor.name}</h4>
              <p className="mt-1 text-xs font-medium leading-5 text-primary">{contributor.role}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
