"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { GraduationCap, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  authenticateTestAccount,
  testAccounts,
  testSessionStorageKey,
} from "../data/test-accounts"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    document.documentElement.classList.remove("dark")
    const existing = window.localStorage.getItem(testSessionStorageKey)
    if (existing) {
      try {
        const session = JSON.parse(existing) as { role?: string; route?: string }
        if (session.role && session.route) {
          router.replace(session.route)
        }
      } catch { }
    }
  }, [router])

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const account = authenticateTestAccount(email, password)
    if (!account) {
      setMessage("Use one of the listed test accounts and its matching password.")
      return
    }

    setLoading(true)
    window.localStorage.setItem(
      testSessionStorageKey,
      JSON.stringify({
        email: account.email,
        role: account.role,
        name: account.name,
        title: account.title,
        id: account.id,
      })
    )
    router.push(account.route)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(var(--edu-lapis)/0.06),transparent_40%)]" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-[var(--edu-glacier)] opacity-[0.06] blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-[var(--edu-lapis)] opacity-[0.04] blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col items-center justify-center gap-10 px-4 py-8 lg:flex-row lg:gap-16">
        <section className="max-w-xl space-y-6 text-center lg:text-left">
          <div className="edu-glacier inline-flex items-center gap-2 rounded-xl border border-[var(--edu-border-glacier)] px-4 py-2 text-sm font-medium shadow-sm">
            <GraduationCap className="size-4" />
            ComSite Academic Portal
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--edu-abyss)] md:text-5xl lg:text-6xl">
            Code Innovation, Connect Education, Conquer Excellence.
          </h1>
          <p className="text-base leading-7 text-[var(--edu-lapis)]">
            Access grade updates, thesis records, announcements, feedback
            tickets, seminar enlistment, teacher availability, and department
            reports from the correct role workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Students", "Faculty", "Admin"].map((r) => (
              <span
                key={r}
                className="edu-slate rounded-lg border border-[var(--edu-border-slate)] px-3 py-1.5 text-xs font-medium uppercase tracking-wide shadow-sm"
              >
                {r}
              </span>
            ))}
          </div>
        </section>

        <Card className="w-full max-w-md rounded-2xl border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Sign In</CardTitle>
            <CardDescription>
              Use the temporary test credentials while database integration is
              pending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student1@gmail.com"
                    className="h-10 rounded-xl pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter test password"
                    className="h-10 rounded-xl pl-9"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <Checkbox id="remember" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-[var(--edu-lapis)] hover:text-[var(--edu-abyss)]"
                  onClick={() =>
                    setMessage(
                      "Password reset will be added with the MongoDB-backed auth flow."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              {message ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {message}
                </p>
              ) : null}

              <Button type="submit" className="h-10 w-full rounded-xl" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <div className="mt-5 rounded-xl border border-border bg-muted/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Test Accounts
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                {testAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword(account.password)
                      setMessage("")
                    }}
                    className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2.5 text-left text-foreground/80 shadow-sm transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium">{account.email}</span>
                    <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                      {account.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
