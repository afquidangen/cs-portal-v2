"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

import type { CsoInfoRecord } from "@/lib/types"
import { Alert } from "@/components/ui/alert"
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

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [portalLogo, setPortalLogo] = useState("/portal-logo.svg")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/portal/cso-info")
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data?.portalLogoUrl) setPortalLogo(json.data.portalLogoUrl)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove("dark")
  }, [])

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.account?.role) {
          router.push(`/${data.account.role}`)
        }
      })
      .catch(() => {})
  }, [router])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json.error ?? "Invalid email or password.")
        setLoading(false)
        return
      }

      const { account } = json
      router.push(account.route)
    } catch {
      setMessage("Unable to connect. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_26%,rgba(189,231,255,0.34),transparent_30%),radial-gradient(circle_at_82%_72%,rgba(139,211,255,0.18),transparent_34%),linear-gradient(135deg,#fcfeff_0%,#f4fbff_50%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[44%] bg-[linear-gradient(180deg,rgba(189,231,255,0.20),rgba(241,249,255,0.16)_58%,transparent)]" />
      <div className="pointer-events-none absolute inset-x-6 top-6 h-px bg-[linear-gradient(90deg,transparent,#8bd3ff_18%,#1f6fe5_50%,#8bd3ff_82%,transparent)] opacity-70" />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-[linear-gradient(90deg,transparent,#cfe7fb_18%,#8bd3ff_50%,#cfe7fb_82%,transparent)] opacity-80" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full border border-[#8bd3ff]/35 bg-[#eaf7ff]/35 blur-sm" />
      <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full border border-[#cfe7fb]/70 bg-white/30 blur-sm" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,211,255,0.12),transparent_62%)]" />
      <div className="pointer-events-none absolute left-8 top-20 hidden w-44 rounded-xl border border-[#cfe7fb] bg-white/70 px-3 py-2 font-mono text-[11px] font-semibold text-[#225688] shadow-sm backdrop-blur lg:block">
        <div className="mb-1 flex items-center gap-1.5 text-[#18479f]">
          <span className="size-1.5 rounded-full bg-[#28a7f2]" />
          API ONLINE
        </div>
        <div className="text-[#5f7c99]">latency: 12ms</div>
      </div>
      <div className="pointer-events-none absolute right-10 bottom-24 hidden w-48 rounded-xl border border-[#cfe7fb] bg-white/70 px-3 py-2 font-mono text-[11px] font-semibold text-[#225688] shadow-sm backdrop-blur lg:block">
        <div className="text-[#18479f]">module.auth()</div>
        <div className="mt-1 text-[#5f7c99]">session: encrypted</div>
      </div>
      <div className="pointer-events-none absolute left-[8%] top-[34%] hidden h-24 w-24 border-l border-t border-[#8bd3ff]/70 lg:block">
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#1f6fe5]" />
      </div>
      <div className="pointer-events-none absolute bottom-[30%] right-[8%] hidden h-28 w-28 border-b border-r border-[#8bd3ff]/70 lg:block">
        <span className="absolute -bottom-1 -left-1 size-2 rounded-full bg-[#28a7f2]" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-5xl items-center gap-8 px-4 py-8 sm:py-10 md:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] md:gap-10 md:px-8">
        <section className="relative flex flex-col items-center text-center md:items-start md:text-left">
          <div className="pointer-events-none absolute -inset-x-8 -inset-y-10 rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.42),rgba(234,247,255,0.16))] opacity-80" />
          <Image
            src={portalLogo}
            alt="ComScite Portal logo"
            width={260}
            height={260}
            className="relative h-auto w-40 max-w-[68vw] object-contain drop-shadow-[0_28px_52px_rgb(24_71_159_/_0.28)] sm:w-52 md:w-64"
            priority
          />
          <h1 className="login-terminal relative mt-6" aria-label="ComScite Portal startup status">
            <span className="login-terminal-line login-terminal-line-command">
              $ npm run start:comscite
            </span>
            <span className="login-terminal-line login-terminal-line-welcome">
              Welcome to ComScite Portal v26      </span>
            <span className="login-terminal-line login-terminal-line-quote">
              Code, Connect, Conquer
            </span>
            <span className="login-terminal-line login-terminal-line-status">
              Status: Online | Environment: Ready
            </span>
          </h1>
        </section>

        <Card className="relative w-full overflow-hidden rounded-2xl border border-[#d7e8fb] bg-white/95 shadow-[0_28px_80px_rgb(24_71_159_/_0.16)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(31,111,229,0.045)_1px,transparent_1px),linear-gradient(rgba(31,111,229,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="relative h-1.5 bg-[linear-gradient(90deg,#18479f_0%,#1f6fe5_58%,#28a7f2_100%)]" />
          <CardHeader className="relative space-y-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between rounded-xl border border-[#cfe7fb] bg-[#f5fbff] px-3 py-2">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-[#18479f]" />
                <span className="size-2 rounded-full bg-[#1f6fe5]" />
                <span className="size-2 rounded-full bg-[#8bd3ff]" />
              </div>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#225688]">
                auth.session
              </span>
            </div>
            <div className="space-y-1">
              <CardTitle className="font-mono text-2xl font-bold tracking-tight text-[#071224]">Sign In</CardTitle>
              <CardDescription className="font-mono text-sm font-bold tracking-[0.04em] text-[#18479f]">
                Greetings, CStizen.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative px-5 pb-5 sm:px-6 sm:pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1f3350]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7c99]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@gmail.com"
                    className="h-11 rounded-xl border-[#d7e8fb] bg-[#f8fbff] pl-9 font-mono text-sm text-[#071224] placeholder:text-[#7d94ab] focus-visible:border-[#1f6fe5] focus-visible:ring-[#1f6fe5]/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1f3350]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7c99]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter test password"
                    className="h-11 rounded-xl border-[#d7e8fb] bg-[#f8fbff] pl-9 pr-10 font-mono text-sm text-[#071224] placeholder:text-[#7d94ab] focus-visible:border-[#1f6fe5] focus-visible:ring-[#1f6fe5]/20"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f7c99] hover:text-[#071224]"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-[#5f7187]">
                  <Checkbox id="remember" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="font-semibold text-[#18479f] hover:text-[#071224] disabled:opacity-50"
                  disabled={forgotLoading || forgotSent}
                  onClick={async () => {
                    if (!email.trim()) {
                      setMessage("Enter your email first.")
                      return
                    }
                    setForgotLoading(true)
                    setMessage("")
                    try {
                      const res = await fetch("/api/auth/forgot-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      })
                      await res.json()
                      setForgotSent(true)
                      setMessage("If that email is registered, a reset link has been sent.")
                    } catch {
                      setMessage("Unable to send reset email. Please try again.")
                    } finally {
                      setForgotLoading(false)
                    }
                  }}
                >
                  {forgotLoading ? "Sending..." : forgotSent ? "Email sent" : "Forgot password?"}
                </button>
              </div>

              {message ? (
                <Alert variant="warning">{message}</Alert>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-[linear-gradient(90deg,#18479f_0%,#1f6fe5_62%,#28a7f2_100%)] font-semibold text-white shadow-[0_14px_34px_rgb(31_111_229_/_0.28)] transition hover:brightness-105"
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
