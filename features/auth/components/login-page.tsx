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
  }, [])

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
    window.setTimeout(() => {
      router.push(account.route)
    }, 450)
  }

  return (
    <main className="min-h-screen bg-[#f0f5f4] px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#a9cbe0] bg-white px-3 py-2 text-sm font-medium text-[#225688] shadow-sm">
            <GraduationCap className="size-4" />
            ComSite Academic Portal
          </div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-normal text-[#092c56] md:text-5xl">
              Code Innovation, Connect Education, Conquer Excellence.
            </h1>
            <p className="mt-4 text-base leading-7 text-[#225688]">
              Access grade updates, thesis records, announcements, feedback
              tickets, seminar enlistment, teacher availability, and department
              reports from the correct role workspace. MongoDB Atlas with Google
              Cloud is planned for the backend; this build uses local test
              accounts only.
            </p>
          </div>
        </section>

        <Card className="rounded-lg border-[#a9cbe0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-[#092c56]">Sign In</CardTitle>
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
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student1@gmail.com"
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
                    placeholder="Enter test password"
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
                  className="font-medium text-[#225688] hover:text-[#092c56]"
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
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {message}
                </p>
              ) : null}

              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-[#a9cbe0] bg-[#f0f5f4] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#668ca9]">
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
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-slate-700 transition hover:bg-[#a9cbe0]/30 hover:text-[#092c56]"
                  >
                    <span>{account.email}</span>
                    <span className="text-xs capitalize text-[#668ca9]">
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
