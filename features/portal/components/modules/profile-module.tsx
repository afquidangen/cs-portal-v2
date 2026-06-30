"use client"

import { CalendarDays, Eye, EyeOff, Loader2, Lock, Mail, MapPin, Save, Trash2, Undo2, Upload, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Select } from "../shared/dashboard-ui"
import { ImageCropDialog } from "../shared/image-crop-dialog"
import { cn } from "@/lib/utils"
import { validatePassword } from "@/lib/validators"
import type { PortalModuleProps } from "./types"
import type { ProfileDetails } from "../../data/portal-data"

export function ProfileModule({ model }: PortalModuleProps) {
  const {
    profile,
    profileDetails,
    role,
    handleSaveProfile,
    handleChangePassword,
  } = model

  const [draft, setDraft] = useState(profileDetails)
  useEffect(() => {
    queueMicrotask(() => setDraft(profileDetails))
  }, [profileDetails])
  const [savingProfile, setSavingProfile] = useState(false)

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeSection, setActiveSection] = useState<"personal" | "password">("personal")
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" })
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const passwordInputClass =
    "h-11 rounded-md border-slate-200 bg-white pr-10 text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-100"

  const roleLabel =
    role === "admin"
      ? "Administrator"
      : role === "faculty"
        ? "Faculty"
        : role === "csso_officer"
          ? "CSSO Officer"
          : "Student"
  const roleTitle =
    role === "admin"
      ? "Portal Administrator"
      : role === "faculty"
        ? profile.title || "Instructor - BSCS"
        : role === "csso_officer"
          ? "CSSO Officer"
          : profile.title || "Student"
  const initials = (profile.name || roleLabel)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
  const fieldClass = "h-11 rounded-md border-slate-200 bg-white text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-100"
  const labelClass = "text-xs font-semibold text-slate-700"

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : ""
      if (dataUrl) {
        setCropImageSrc(dataUrl)
        setCropDialogOpen(true)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleCropConfirm(croppedDataUrl: string) {
    setDraft((prev: typeof profileDetails) => ({
      ...prev,
      photoUrl: croppedDataUrl,
    }))
    setCropDialogOpen(false)
    setCropImageSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleCropCancel() {
    setCropDialogOpen(false)
    setCropImageSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave() {
    setSavingProfile(true)
    try {
      const result = await handleSaveProfile(draft)
      if (result) setDraft(result)
      toast.success("Profile saved successfully")
    } catch {
      toast.error("Failed to save profile. Please try again.")
    } finally {
      setSavingProfile(false)
    }
  }

  function handleCancel() {
    setDraft(profileDetails)
  }

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profileDetails)

  async function handlePasswordSave() {
    setPasswordError("")
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
    setUpdatingPassword(true)
    try {
      await handleChangePassword(passwordForm.current, passwordForm.newPass)
      toast.success("Password updated successfully")
      setPasswordForm({ current: "", newPass: "", confirm: "" })
    } catch {
      toast.error("Failed to update password. Check your current password.")
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <>
      <div className="space-y-4 pb-6 pt-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Profile</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your account information and preferences.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center">
                <div className="flex size-28 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-4xl font-semibold text-blue-600">
                  {draft.photoUrl ? (
                    <div aria-label={profile.name} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${draft.photoUrl})` }} />
                  ) : (
                    initials
                  )}
                </div>
                <h2 className="mt-6 text-lg font-semibold text-slate-950">{profile.name || roleLabel}</h2>
                <span className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm">{roleLabel}</span>

                <label className="mt-7 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  <Upload className="size-4 text-blue-600" />
                  Upload Photo
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>

                {draft.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setDraft((prev: typeof profileDetails) => ({ ...prev, photoUrl: "" }))}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Trash2 className="size-4 text-red-500" />
                    Remove Photo
                  </button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardContent className="p-3">
                <button
                  type="button"
                  onClick={() => setActiveSection("personal")}
                  className={cn(
                    "flex h-11 w-full items-center gap-3 rounded-md px-4 text-sm font-semibold transition",
                    activeSection === "personal"
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <User className="size-4" />
                  Personal Information
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("password")}
                  className={cn(
                    "mt-2 flex h-11 w-full items-center gap-3 rounded-md px-4 text-sm font-semibold transition",
                    activeSection === "password"
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Lock className="size-4" />
                  Change Password
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {activeSection === "personal" && (<>
              <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader className="px-6 pb-0 pt-6">
                <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-950">
                  <User className="size-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <p className="pt-1 text-sm text-slate-500">Update your personal details and contact information.</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-7">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className={labelClass}>First Name</span>
                    <Input className={fieldClass} placeholder="First name" value={draft.firstName} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, firstName: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Middle Name</span>
                    <Input className={fieldClass} placeholder="Middle name" value={draft.middleName} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, middleName: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Last Name</span>
                    <Input className={fieldClass} placeholder="Last name" value={draft.lastName} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, lastName: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Email Address</span>
                    <div className="relative">
                      <Input className={cn(fieldClass, "pl-10")} placeholder="Email address" value={draft.email} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, email: event.target.value }))} />
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Contact Number</span>
                    <Input className={fieldClass} placeholder="Contact number" value={draft.contactNumber} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, contactNumber: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Gender</span>
                    <Select value={draft.sex} onChange={(value) => setDraft((current: ProfileDetails) => ({ ...current, sex: value }))} options={["Female", "Male", "Prefer not to say"]} />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClass}>Date of Birth</span>
                    <div className="relative">
                      <Input className={cn(fieldClass, "pr-10")} type="date" value={draft.birthday} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, birthday: event.target.value }))} />
                      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className={labelClass}>Address</span>
                    <div className="relative">
                      <Input className={cn(fieldClass, "pl-10")} placeholder="Address" value={draft.address} onChange={(event) => setDraft((current: ProfileDetails) => ({ ...current, address: event.target.value }))} />
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {hasChanges ? (
                    <Button variant="outline" className="h-10 rounded-md border-slate-200" onClick={handleCancel}>
                      <Undo2 className="mr-1.5 size-4" />
                      Reset
                    </Button>
                  ) : null}
                  <Button className="h-10 rounded-md bg-blue-600 px-5 text-white hover:bg-blue-700" onClick={handleSave} disabled={!hasChanges || savingProfile}>
                    {savingProfile ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {role === "student" && (
              <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
                <CardHeader className="px-6 pb-0 pt-6">
                  <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-950">
                    <Eye className="size-5 text-slate-700" />
                    Privacy
                  </CardTitle>
                  <p className="pt-1 text-sm text-slate-500">Control how your information appears in Dean's List rankings.</p>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-7">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">Dean's List Ranking Visibility</p>
                      <p className="text-xs text-slate-500">
                        {draft.deansListVisibility === "public"
                          ? "Your name and GWA will be visible in published Dean's List rankings."
                          : "Your rank will be preserved but your name will be hidden as 'Private Student'."}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-semibold", draft.deansListVisibility === "private" ? "text-slate-400" : "text-blue-600")}>Public</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draft.deansListVisibility === "private"}
                        onClick={() => setDraft((prev) => ({
                          ...prev,
                          deansListVisibility: prev.deansListVisibility === "public" ? "private" : "public",
                        }))}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          draft.deansListVisibility === "private" ? "bg-slate-300" : "bg-blue-600"
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none inline-block size-5 rounded-full bg-white shadow ring-0 transition-transform",
                          draft.deansListVisibility === "private" ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                      <span className={cn("text-xs font-semibold", draft.deansListVisibility === "public" ? "text-slate-400" : "text-blue-600")}>Private</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            </>)}

            {activeSection === "password" && (
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader className="px-6 pb-0 pt-6">
                <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-950">
                  <Lock className="size-5 text-slate-700" />
                  Change Password
                </CardTitle>
                <p className="pt-1 text-sm text-slate-500">Update your account password (min 8 characters, must contain letter + number)</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-7">
                <div className="grid gap-5 lg:grid-cols-3">
                  {[
                    ["Current Password", "current", "Enter current password"],
                    ["New Password", "newPass", "Enter new password"],
                    ["Confirm New Password", "confirm", "Confirm new password"],
                  ].map(([label, key, placeholder]) => (
                    <label key={key} className="space-y-2">
                      <span className={labelClass}>{label}</span>
                      <div className="relative">
                        <Input
                          type={showPasswords ? "text" : "password"}
                          placeholder={placeholder}
                          value={passwordForm[key as keyof typeof passwordForm]}
                          onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))}
                          minLength={key === "current" ? undefined : 8}
                          className={passwordInputClass}
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPasswords((p) => !p)} aria-label={showPasswords ? "Hide passwords" : "Show passwords"}>
                          {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {passwordError ? <span className="text-sm font-semibold text-red-600">{passwordError}</span> : null}
                  <Button className="h-10 rounded-md bg-blue-600 px-5 text-white hover:bg-blue-700" onClick={handlePasswordSave} disabled={updatingPassword}>
                    {updatingPassword ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Lock className="mr-1.5 size-4" />}
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>

      {cropImageSrc ? (
        <ImageCropDialog
          imageSrc={cropImageSrc}
          open={cropDialogOpen}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      ) : null}
    </>
  )
}
