"use client"

import { Camera, UserCircle } from "lucide-react"

import { Input } from "@/components/ui/input"

import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function ProfileModule({ model }: PortalModuleProps) {
  const {
    handleProfilePhotoChange,
    profile,
    profileDetails,
    role,
    setProfileDetails,
  } = model

  const roleLabel =
    role === "admin"
      ? "Admin"
      : role === "faculty"
        ? "Faculty"
        : "Student"

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title={roleLabel + " Profile"} eyebrow="Account details">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-28 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-foreground/60">
            {profileDetails.photoUrl ? (
              <div
                aria-label={profile.name}
                className="size-full rounded-2xl bg-cover bg-center"
                style={{
                  backgroundImage: `url(${profileDetails.photoUrl})`,
                }}
              />
            ) : (
              <UserCircle className="size-16" />
            )}
          </div>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
            <Camera className="size-4" />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              className="hidden"
            />
          </label>

          <h4 className="mt-4 text-lg font-semibold text-foreground">
            {profile.name}
          </h4>
          <p className="mt-1 text-sm text-foreground/70">{profile.title}</p>

          <div className="mt-3">
            <StatusBadge value={roleLabel} />
          </div>
        </div>
      </Panel>

      <Panel title="Personal Information" eyebrow="Editable profile fields">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="First name"
            value={profileDetails.firstName}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Middle name"
            value={profileDetails.middleName}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                middleName: event.target.value,
              }))
            }
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Last name"
            value={profileDetails.lastName}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Email"
            value={profileDetails.email}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Contact number"
            value={profileDetails.contactNumber}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                contactNumber: event.target.value,
              }))
            }
            className="h-10 rounded-2xl"
          />

          <Select
            value={profileDetails.sex}
            onChange={(value) =>
              setProfileDetails((current) => ({
                ...current,
                sex: value,
              }))
            }
            options={["Female", "Male", "Prefer not to say"]}
          />

          <Input
            type="date"
            value={profileDetails.birthday}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                birthday: event.target.value,
              }))
            }
            className="h-10 rounded-2xl"
          />
          <Input
            placeholder="Address"
            value={profileDetails.address}
            onChange={(event) =>
              setProfileDetails((current) => ({
                ...current,
                address: event.target.value,
              }))
            }
            className="h-10 rounded-2xl md:col-span-2"
          />
        </div>
      </Panel>
    </div>
  )
}
