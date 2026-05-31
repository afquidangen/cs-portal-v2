"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
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

const demoAccounts = [
  {
    label: "Student",
    email: "juan@student.edu",
    route: "/student",
  },
  {
    label: "Faculty",
    email: "maria@faculty.edu",
    route: "/faculty",
  },
  {
    label: "Admin",
    email: "admin@portal.edu",
    route: "/admin",
  },
]

export function LoginPage() {
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
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-glacier bg-white px-5 py-3 shadow-sm dark:border-lapis dark:bg-abyss/50">
            <div className="flex size-12 items-center justify-center rounded-xl bg-abyss text-quartz dark:bg-quartz dark:text-abyss">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-abyss dark:text-quartz">
                ComSite Student Portal
              </p>
              <p className="text-xs text-slate-blue dark:text-glacier">
                ISPSC Computing Studies Unit
              </p>
            </div>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-abyss dark:text-quartz md:text-5xl">
              Code Innovation,
              <br />
              Connect Education,
              <br />
              Conquer Excellence.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-blue dark:text-glacier">
              Access grade updates, thesis records, announcements, feedback
              tickets, and department reports from the correct role workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email)
                  setPassword("demo1234")
                  setMessage("")
                }}
                className="rounded-lg border border-glacier bg-white px-4 py-2 text-sm font-medium text-abyss shadow-sm transition hover:bg-glacier/50 dark:border-lapis dark:bg-abyss/50 dark:text-quartz dark:hover:bg-lapis/50"
              >
                {account.label} Demo
              </button>
            ))}
          </div>
        </section>

        <Card className="rounded-xl border-glacier shadow-sm dark:border-lapis dark:bg-abyss/50">
          <CardHeader>
            <CardTitle className="text-2xl text-abyss dark:text-quartz">Sign In</CardTitle>
            <CardDescription className="text-slate-blue dark:text-glacier">
              Enter your credentials to access the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-abyss dark:text-quartz">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-blue" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@school.edu"
                    className="h-10 rounded-lg border-glacier pl-9 dark:border-lapis dark:bg-abyss/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-abyss dark:text-quartz">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-blue" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="demo1234"
                    className="h-10 rounded-lg border-glacier pl-9 dark:border-lapis dark:bg-abyss/50"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-blue dark:text-glacier">
                  <Checkbox id="remember" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-lapis hover:text-abyss dark:text-glacier dark:hover:text-quartz"
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

              <Button
                type="submit"
                className="h-10 w-full bg-abyss text-quartz hover:bg-lapis dark:bg-quartz dark:text-abyss dark:hover:bg-glacier"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
