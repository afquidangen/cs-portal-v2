"use client"

import { Camera, Save, Undo2, UserCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Panel, Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { ProfileDetails } from "../../data/portal-data"

export function ProfileModule({ model }: PortalModuleProps) {
  const {
    profile,
    profileDetails,
    role,
    setProfileDetails,
  } = model

  const [draft, setDraft] = useState(profileDetails)
  const [saved, setSaved] = useState(false)

  const roleLabel =
    role === "admin"
      ? "Admin"
      : role === "faculty"
        ? "Faculty"
        : "Student"

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setDraft((prev: typeof profileDetails) => ({
        ...prev,
        photoUrl: typeof reader.result === "string" ? reader.result : prev.photoUrl,
      }))
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    setProfileDetails(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCancel() {
    setDraft(profileDetails)
  }

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profileDetails)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title={roleLabel + " Profile"} eyebrow="Account details">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-28 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-foreground/60">
              {draft.photoUrl ? (
                <div
                  aria-label={profile.name}
                  className="size-full rounded-2xl bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${draft.photoUrl})`,
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
                onChange={handlePhotoChange}
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
              value={draft.firstName}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              className="h-10 rounded-2xl"
            />
            <Input
              placeholder="Middle name"
              value={draft.middleName}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  middleName: event.target.value,
                }))
              }
              className="h-10 rounded-2xl"
            />
            <Input
              placeholder="Last name"
              value={draft.lastName}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              className="h-10 rounded-2xl"
            />
            <Input
              placeholder="Email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="h-10 rounded-2xl"
            />
            <Input
              placeholder="Contact number"
              value={draft.contactNumber}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  contactNumber: event.target.value,
                }))
              }
              className="h-10 rounded-2xl"
            />

            <Select
              value={draft.sex}
              onChange={(value) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  sex: value,
                }))
              }
              options={["Female", "Male", "Prefer not to say"]}
            />

            <Input
              type="date"
              value={draft.birthday}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  birthday: event.target.value,
                }))
              }
              className="h-10 rounded-2xl"
            />
            <Input
              placeholder="Address"
              value={draft.address}
              onChange={(event) =>
                setDraft((current: ProfileDetails) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              className="h-10 rounded-2xl md:col-span-2"
            />
          </div>
        </Panel>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved ? (
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Profile saved successfully
          </span>
        ) : null}
        {hasChanges ? (
          <Button
            variant="outline"
            onClick={handleCancel}
            className="rounded-2xl border-border"
          >
            <Undo2 className="mr-1.5 size-4" />
            Reset
          </Button>
        ) : null}
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="rounded-2xl"
        >
          <Save className="mr-1.5 size-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
