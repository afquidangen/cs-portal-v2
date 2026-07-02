"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { ArrowRight, Database, Eye, EyeOff, Lock, Mail } from "lucide-react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
    <main className="login-shell relative min-h-screen overflow-hidden bg-[#eaf2ff] text-[#08142c]">
      <div className="login-circuit login-circuit-left" />
      <div className="login-circuit login-circuit-right" />
      <div className="login-halftone login-halftone-top" />
      <div className="login-halftone login-halftone-bottom" />

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-5xl items-center gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(340px,380px)_1px_minmax(340px,380px)] lg:justify-center lg:gap-10 lg:px-8">
        <section className="flex flex-col items-center text-center">
          <Image
            src={portalLogo}
            alt="ComScite Portal logo"
            width={340}
            height={340}
            className="h-auto w-44 max-w-[68vw] object-contain drop-shadow-[0_24px_38px_rgb(28_96_190_/_0.22)] sm:w-56 lg:w-72"
            priority
          />
          <div className="mt-6 h-px w-44 bg-[linear-gradient(90deg,transparent,#2a73cf,transparent)] sm:w-52" />
          <p className="mt-5 text-base font-bold tracking-normal text-[#184f9e] sm:text-lg">
            Code, Connect, Conquer
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-0 overflow-hidden rounded-lg border border-white/70 bg-white/58 text-xs font-bold text-[#164a95] shadow-[0_10px_26px_rgb(38_93_168_/_0.1)] backdrop-blur-md sm:text-sm">
            <div className="flex h-9 items-center gap-2 px-3">
              <span className="size-2 rounded-full bg-[#1ecb96] shadow-[0_0_0_4px_rgb(30_203_150_/_0.14)]" />
              Online
            </div>
            <div className="h-5 w-px bg-[#bfd1e8]" />
            <div className="flex h-9 items-center gap-2 px-3">
              <Database className="size-3.5 text-[#1b68cf]" />
              Production
            </div>
            <div className="h-5 w-px bg-[#bfd1e8]" />
            <div className="flex h-9 items-center px-3">v26</div>
          </div>
        </section>

        <div className="hidden h-[28rem] w-px bg-[#c8d5e8] lg:block" />

        <Card className="mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl border border-white/70 bg-white/80 text-[#08142c] shadow-[0_22px_56px_rgb(44_93_151_/_0.16)] backdrop-blur-xl">
          <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center gap-3 border-b border-[#d9e4f1] pb-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e6eef9] text-[#176ac9] shadow-inner">
                <Lock className="size-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-2xl font-extrabold leading-tight tracking-normal text-[#08142c]">
                  Greetings, CStizen.
                </CardTitle>
                <CardDescription className="mt-1 text-sm font-semibold leading-5 text-[#68778f]">
                  Sign in to continue to{" "}
                  <span className="block font-extrabold text-[#145fb9] sm:inline">ComScite Portal</span>
                </CardDescription>
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-extrabold text-[#172741] sm:text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#67778e]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@gmail.com"
                    className="h-12 rounded-lg border-[#d8e0ea] bg-white/70 pl-11 text-sm font-semibold text-[#08142c] shadow-[0_8px_18px_rgb(72_101_140_/_0.08)] placeholder:text-[#738197] focus-visible:border-[#1f6fe5] focus-visible:ring-[#1f6fe5]/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-extrabold text-[#172741] sm:text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#67778e]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-12 rounded-lg border-[#d8e0ea] bg-white/70 pl-11 pr-11 text-sm font-semibold text-[#08142c] shadow-[0_8px_18px_rgb(72_101_140_/_0.08)] placeholder:text-[#738197] focus-visible:border-[#1f6fe5] focus-visible:ring-[#1f6fe5]/20"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#67778e] transition hover:bg-[#e6eef9] hover:text-[#08142c]"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs font-semibold sm:text-sm">
                <label className="flex items-center gap-2 text-[#5f6675]">
                  <Checkbox id="remember" className="size-4 rounded-md border-[#b8c4d4] bg-white" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="font-extrabold text-[#164c9c] transition hover:text-[#08142c] disabled:opacity-50"
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
                className="mt-1 h-12 w-full rounded-lg bg-[linear-gradient(135deg,#0e48b8_0%,#2078ee_100%)] text-sm font-extrabold text-white shadow-[0_14px_28px_rgb(22_104_207_/_0.25)] transition hover:brightness-105"
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
