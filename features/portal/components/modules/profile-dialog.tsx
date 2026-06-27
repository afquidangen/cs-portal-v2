"use client"

import { Camera, Eye, EyeOff, KeyRound, Save, UserCircle } from "lucide-react"
import { useState } from "react"

import { Alert } from "@/components/ui/alert"
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
import { validatePassword } from "@/lib/validators"
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
    handleSaveProfile,
    handleChangePassword,
  } = model

  const [draft, setDraft] = useState(profileDetails)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" })
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const passwordInputClass =
    "pr-10 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-primary dark:border-[#1d3858] dark:bg-[#071224] dark:text-white dark:placeholder:text-white/45"

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

  async function handleSave() {
    try {
      await handleSaveProfile(draft)
      setSaved(true)
      setSaveError(false)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    }
  }

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profileDetails)

  async function handlePasswordSave() {
    setPasswordError("")
    setPasswordSuccess(false)
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      setPasswordError("All fields are required.")
      return
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError("New password and confirm password do not match.")
      return
    }
    const validationError = validatePassword(passwordForm.newPass)
    if (validationError) {
      setPasswordError(validationError)
      return
    }
    try {
      await handleChangePassword(passwordForm.current, passwordForm.newPass)
      setPasswordSuccess(true)
      setPasswordForm({ current: "", newPass: "", confirm: "" })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch {
      setPasswordError("Failed to update password. Check your current password.")
    }
  }

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

                <div className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm">
                  <StatusBadge value={role === "faculty" ? "Faculty" : role === "csso_officer" ? "CSSO Officer" : role} />
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

        <div className="mx-4 mb-6 border border-border bg-muted/30 p-4 dark:border-[#1d3858] dark:bg-[#071224]/70 sm:mx-8 sm:p-6">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <KeyRound className="size-4" /> Change Password
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your account password (min 8 characters, must contain letter + number)
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="Current password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
              className={passwordInputClass}
            />
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="New password"
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPass: e.target.value }))}
              minLength={8}
              className={passwordInputClass}
            />
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="Confirm new password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
              minLength={8}
              className={passwordInputClass}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={handlePasswordSave}>
              <KeyRound className="mr-1.5 size-4" /> Update Password
            </Button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowPasswords((p) => !p)}
            >
              {showPasswords ? <EyeOff className="inline size-4 mr-1" /> : <Eye className="inline size-4 mr-1" />}
              {showPasswords ? "Hide" : "Show"} passwords
            </button>
            {passwordError ? (
              <Alert variant="error">{passwordError}</Alert>
            ) : passwordSuccess ? (
              <Alert variant="success">Password updated successfully</Alert>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-8">
          {saveError ? (
            <Alert variant="error">Failed to save profile. Please try again.</Alert>
          ) : saved ? (
            <Alert variant="success">Profile saved successfully</Alert>
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
