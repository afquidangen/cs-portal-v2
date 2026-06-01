"use client"

import { Camera, UserCircle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { Select, StatusBadge } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

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
    handleProfilePhotoChange,
    profile,
    profileDetails,
    role,
    setProfileDetails,
  } = model

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-5xl border border-border bg-card p-0 text-foreground shadow-2xl">
        <div className="border-b border-border bg-card px-8 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              User Profile
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="bg-background px-8 py-8">
          <div className="mx-auto grid w-full max-w-4xl items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-28 items-center justify-center border border-dashed border-border bg-muted text-foreground/60">
                  {profileDetails.photoUrl ? (
                    <div
                      aria-label={profile.name}
                      className="size-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${profileDetails.photoUrl})`,
                      }}
                    />
                  ) : (
                    <UserCircle className="size-16" />
                  )}
                </div>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
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
                <p className="mt-1 text-sm text-foreground/70">
                  {profile.title}
                </p>

                <div className="mt-3">
                  <StatusBadge value={role === "faculty" ? "Faculty" : role} />
                </div>
              </div>
            </div>

            <div className="border border-border bg-card p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-foreground">
                  Personal Information
                </h3>
                <p className="mt-1 text-sm text-foreground/70">
                  Editable profile details
                </p>
              </div>

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
                  className="h-10 rounded-none"
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
                  className="h-10 rounded-none"
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
                  className="h-10 rounded-none"
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
                  className="h-10 rounded-none"
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
                  className="h-10 rounded-none"
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
                  className="h-10 rounded-none"
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
                  className="h-10 rounded-none md:col-span-2"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
