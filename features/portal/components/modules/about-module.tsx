"use client"

import { CalendarDays, Camera, Users } from "lucide-react"

import { Panel } from "../shared/dashboard-ui"
import Image from "next/image"

const teamMembers = [
  {
    name: "KYLA CABLAY",
    role: "Data Analyst",
    details: "Manages system logic, database flow, and backend integration.",
    image: "/team/kyla.jpg"
  },
  {
    name: "ALYSSA FAYE QUIDANGEN",
    role: "Project Manager",
    details: "Leads planning, coordination, and overall project execution.",
    image: "/images/team/al.png",
  },
  {
    name: "HEZRON GAGARIN",
    role: "Tech Lead",
    details:  "Leads technical development and ensures system consistency.",
    image: "/images/team/he.png",
  },
  {
    name: "CHRISTIAN GALINATO",
    role: "Quality Assurance Lead",
    details: "Leads testing and ensures the system works correctly.",
    image: "/images/team/chr.png",
  },
]

export function AboutModule() {
  return (
    <div className="space-y-5">
      <Panel title="About Us" eyebrow="Team profile">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Team Name
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              Placeholder Team Name
            </h3>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Team Description
            </p>
            <p className="mt-2 text-sm leading-7 text-foreground/80">
              This section contains a short overview of the team, its purpose,
              project contribution, and overall mission in developing the
              ComSite Student Portal. Replace this placeholder text with your
              actual team description.
            </p>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-muted p-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Date Developed
                </p>
                <p className="text-sm text-foreground/80">Placeholder Date</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">
              Team Picture
            </p>
            <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-border bg-muted text-center text-foreground/70">
              <div>
                <Camera className="mx-auto size-10 text-foreground/60" />
                <p className="mt-3 text-sm font-medium">
                  Team picture placeholder
                </p>
                <p className="mt-1 text-xs text-foreground/60">
                  Replace with your actual team photo
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Team Members and Roles" eyebrow="Member directory">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Member Profiles
            </h3>
            <p className="text-sm text-foreground/70">
              Individual picture placeholders and role descriptions
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article
              key={member.name}
              className="rounded-3xl border border-border bg-card p-4 shadow-sm"
            >
            <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-muted">
              <div className="relative h-[180px] w-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

              <h4 className="text-base font-semibold text-foreground">
                {member.name}
              </h4>
              <p className="mt-1 text-sm font-medium text-foreground/80">
                {member.role}
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground/75">
                {member.details}
              </p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}