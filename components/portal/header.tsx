"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, Check, ChevronDown, GraduationCap, LogOut, Megaphone, MessageSquareWarning, Moon, Sun, User, UserCircle, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useDashboardProfile, useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  icon: typeof Bell
  title: string
  description: string
  time: string
  read: boolean
}

const sampleNotifications: Notification[] = [
  {
    id: "notif-1",
    icon: Megaphone,
    title: "New Announcement",
    description: "Midterm grade updates are now available.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "notif-2",
    icon: MessageSquareWarning,
    title: "Feedback Update",
    description: "Your ticket FB-1001 has been marked as In Progress.",
    time: "Yesterday",
    read: false,
  },
  {
    id: "notif-3",
    icon: Check,
    title: "Grade Posted",
    description: "CS311 final grade has been posted.",
    time: "2 days ago",
    read: true,
  },
]

function ProfileModal({
  profile,
  open,
  onClose,
  onLogout,
}: {
  profile: { name: string; role: string }
  open: boolean
  onClose: () => void
  onLogout: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirming(false)
    }
  }, [open])

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirming) setConfirming(false)
        else onClose()
      }
    }
    if (open) document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose, confirming])

  if (!open) return null

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>
        <div className="bg-gradient-to-br from-abyss to-lapis p-8 text-center text-white dark:from-primary dark:to-glacier dark:text-abyss">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
            {initials}
          </div>
          <h2 className="mt-4 text-xl font-bold">{profile.name}</h2>
          <p className="mt-1 text-sm capitalize opacity-80">{profile.role}</p>
        </div>
        <div className="space-y-2 p-5">
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium text-foreground">{profile.name}</span>
            </div>
            <div className="mt-2 flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium capitalize text-foreground">{profile.role}</span>
            </div>
          </div>
          {confirming ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">Are you sure you want to logout?</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
                >
                  Yes, Logout
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function PortalHeader() {
  const { theme, toggleTheme } = useTheme()
  const profile = useDashboardProfile()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [notifications, setNotifications] = useState(sampleNotifications)
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const handleLogout = useCallback(() => {
    setProfileModalOpen(false)
    setProfileOpen(false)
    router.push("/")
  }, [router])

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-abyss to-lapis text-white shadow-sm dark:from-quartz dark:to-glacier dark:text-abyss">
            <GraduationCap className="size-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold leading-tight text-foreground">
              ComSite Student Portal
            </h1>
            <p className="text-[11px] leading-tight text-muted-foreground">
              ISPSC Computing Studies Unit
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/about"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            About Us
          </Link>

          <div className="mx-1 h-5 w-px bg-border" />

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            {notifOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close"
                />
                <div
                  className={cn(
                    "absolute right-0 top-full z-20 mt-1.5 w-80 origin-top-right overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-black/5"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = notif.icon
                        return (
                          <button
                            key={notif.id}
                            type="button"
                            className={cn(
                              "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                              !notif.read && "bg-accent/50"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                notif.read
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-abyss text-white dark:bg-primary dark:text-abyss"
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">{notif.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{notif.description}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground/70">{notif.time}</p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? (
                <Moon className="size-[18px]" suppressHydrationWarning />
              ) : (
                <Sun className="size-[18px]" suppressHydrationWarning />
              )}
            </button>

          {profile.name ? (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent"
                >
                  <UserCircle className="size-[22px] text-muted-foreground" />
                  <div className="hidden text-left lg:block">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {profile.name}
                    </p>
                    <p className="text-[11px] leading-tight capitalize text-muted-foreground">
                      {profile.role}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform",
                      profileOpen && "rotate-180"
                    )}
                  />
                </button>
                {profileOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileOpen(false)}
                      aria-label="Close"
                    />
                    <div
                      className={cn(
                        "absolute right-0 top-full z-20 mt-1.5 w-48 origin-top-right overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-black/5"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false)
                          setProfileModalOpen(true)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
                      >
                        <User className="size-4" />
                        Profile
                      </button>
                      <div className="border-t border-border" />
                      <button
                        type="button"
                        onClick={() => { setProfileOpen(false); setProfileModalOpen(true) }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <ProfileModal
        profile={{ name: profile.name, role: profile.role }}
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onLogout={handleLogout}
      />
    </header>
  )
}
