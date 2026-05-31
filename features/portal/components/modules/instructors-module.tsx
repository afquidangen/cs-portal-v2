"use client"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function InstructorsModule({ model }: PortalModuleProps) {
  const { faculty } = model

  return (
    <div className="space-y-5">
      <Panel title="Instructor Information" eyebrow="Faculty profiles">
        <div className="grid gap-4 lg:grid-cols-2">
          {faculty.map((member) => (
            <article
              key={member.id}
              className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-abyss text-sm font-semibold text-quartz dark:bg-quartz dark:text-abyss">
                  {`${member.firstName?.[0] ?? "?"}${member.lastName?.[0] ?? "?"}`}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-abyss dark:text-quartz">
                    {member.firstName} {member.lastName}
                  </h4>
                  <p className="text-sm text-slate-blue dark:text-glacier">{member.position}</p>
                  <p className="mt-2 text-sm text-slate-blue dark:text-glacier">
                    {member.education}
                  </p>
                  <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                    {member.email}
                  </p>
                  {member.title ? (
                    <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                      Title: {member.title}
                    </p>
                  ) : null}
                  {member.facultyType ? (
                    <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                      {member.facultyType}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
