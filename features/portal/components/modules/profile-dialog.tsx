"use client"

import { Camera, Save, UserCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"
import type { ProfileDetails } from "../../data/portal-data"

export function ProfileDialog({
  open,
  onOpenChange,
  model,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: PortalModuleProps["model"]
}) {
  const {
    profile,
    profileDetails,
    role,
    setProfileDetails,
  } = model

  const [draft, setDraft] = useState(profileDetails)
  const [saved, setSaved] = useState(false)

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

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profileDetails)

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) setDraft(profileDetails)
      onOpenChange(o)
    }}>
      <DialogContent className="w-full max-w-5xl p-0">
        <div className="border-b border-border px-6 py-4 sm:px-8 sm:py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              User Profile
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto grid w-full max-w-4xl items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="border border-border bg-muted/30 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-28 items-center justify-center border border-dashed border-border bg-muted text-muted-foreground">
                  {draft.photoUrl ? (
                    <div
                      aria-label={profile.name}
                      className="size-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${draft.photoUrl})`,
                      }}
                    />
                  ) : (
                    <UserCircle className="size-16" />
                  )}
                </div>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
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
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.title}
                </p>

                <div className="mt-3">
                  <StatusBadge value={role === "faculty" ? "Faculty" : role} />
                </div>
              </div>
            </div>

            <div className="border border-border bg-muted/30 p-4 sm:p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">
                  Personal Information
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Editable profile details
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="First name"
                  value={draft.firstName}
                  onChange={(event) =>
                    setDraft((current: ProfileDetails) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
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
                  className="sm:col-span-2"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-8">
          {saved ? (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Profile saved successfully
            </span>
          ) : null}
          <DialogClose asChild>
            <Button variant="ghost" className="w-full sm:w-auto">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="w-full sm:w-auto"
          >
            <Save className="mr-1.5 size-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
