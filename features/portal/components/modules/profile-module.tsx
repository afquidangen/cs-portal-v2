"use client"

import { Camera, UserCircle } from "lucide-react"

import { Input } from "@/components/ui/input"

import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function ProfileModule({ model }: PortalModuleProps) {
  const { profile } = model

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Admin Profile" eyebrow="Account details">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-28 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-foreground/60">
            <UserCircle className="size-16" />
          </div>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
            <Camera className="size-4" />
            Upload Photo
            <input type="file" accept="image/*" className="hidden" />
          </label>

          <h4 className="mt-4 text-lg font-semibold text-foreground">
            {profile.name}
          </h4>
          <p className="mt-1 text-sm text-foreground/70">{profile.title}</p>

          <div className="mt-3">
            <StatusBadge value="Admin" />
          </div>
        </div>
      </Panel>

      <Panel title="Personal Information" eyebrow="Editable profile fields">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="First name"
            defaultValue="Admin"
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Middle name"
            defaultValue="Test"
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Last name"
            defaultValue="One"
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Email"
            defaultValue={profile.email}
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Contact number"
            defaultValue="0917 000 0000"
            className="h-10 rounded-2xl"
          />

          <Select
            value="Female"
            onChange={() => {}}
            options={["Female", "Male", "Prefer not to say"]}
          />

          <Input type="date" className="h-10 rounded-2xl" />
          <Input
            placeholder="Address"
            defaultValue="Candon City, Ilocos Sur"
            className="h-10 rounded-2xl md:col-span-2"
          />
        </div>
      </Panel>
    </div>
  )
}