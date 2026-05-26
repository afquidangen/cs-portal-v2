"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Lock, Mail, ShieldCheck, UserCheck } from "lucide-react"

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

const demoAccounts = [
  {
    label: "Student",
    email: "juan@student.edu",
    helper: "Student services, grades, thesis library, events",
    icon: GraduationCap,
    route: "/student",
  },
  {
    label: "Faculty",
    email: "maria@faculty.edu",
    helper: "Class lists, grade encoding, status updates",
    icon: UserCheck,
    route: "/faculty",
  },
  {
    label: "Admin",
    email: "admin@portal.edu",
    helper: "Users, records, announcements, reports",
    icon: ShieldCheck,
    route: "/admin",
  },
]

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  function resolveRoute(value: string) {
    const match = demoAccounts.find((account) =>
      value.toLowerCase().includes(account.label.toLowerCase())
    )
    return match?.route
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    const route = resolveRoute(email)
    if (!route) {
      setMessage("Use a student, faculty, or admin email to enter the portal.")
      return
    }

    if (password.length < 4) {
      setMessage("Enter at least 4 characters for the demo password.")
      return
    }

    setLoading(true)
    window.setTimeout(() => {
      router.push(route)
    }, 450)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <GraduationCap className="size-4 text-sky-700" />
            ComSite Academic Portal
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-normal text-slate-950 md:text-5xl">
              One working portal for students, faculty, and administrators.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Access grade updates, thesis records, announcements, feedback
              tickets, seminar enlistment, teacher availability, and department
              reports from the correct role workspace.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {demoAccounts.map((account) => {
              const Icon = account.icon
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword("demo1234")
                    setMessage("")
                  }}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <Icon className="mb-3 size-5 text-sky-700" />
                  <p className="font-semibold text-slate-950">
                    {account.label}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {account.helper}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        <Card className="rounded-lg border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Pick a demo role or type an email containing student, faculty, or
              admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@school.edu"
                    className="h-10 rounded-lg pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="demo1234"
                    className="h-10 rounded-lg pl-9"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <Checkbox id="remember" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-sky-700 hover:text-sky-800"
                  onClick={() =>
                    setMessage(
                      "Demo reset flow noted. Full email reset API is part of the backend sprint."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              {message ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {message}
                </p>
              ) : null}

              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
