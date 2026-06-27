"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#fcfeff_0%,#f4fbff_52%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(189,231,255,0.36),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-full bg-[linear-gradient(0deg,rgba(234,247,255,0.72),transparent)]" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] lg:gap-14 lg:px-8">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Image
            src={portalLogo}
            alt="ComScite Portal logo"
            width={260}
            height={260}
            className="h-auto w-36 max-w-[62vw] object-contain drop-shadow-[0_20px_42px_rgb(24_71_159_/_0.18)] sm:w-48 lg:w-56"
            priority
          />
          <h1 className="login-terminal mt-6" aria-label="ComScite Portal startup status">
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

        <Card className="w-full overflow-hidden rounded-lg border border-[#d7e8fb] bg-white/95 text-[#071224] shadow-[0_18px_50px_rgb(24_71_159_/_0.12)] backdrop-blur">
          <CardHeader className="space-y-3 border-b border-[#e3eef9] px-5 py-5 sm:px-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight text-[#071224]">Sign In</CardTitle>
              <CardDescription className="text-sm font-medium text-[#5f7187]">
                Greetings, CStizen.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1f3350]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7c99]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@gmail.com"
                    className="h-11 rounded-md border-[#d7e8fb] bg-white pl-9 text-sm text-[#071224] shadow-sm placeholder:text-[#7d94ab] focus-visible:border-[#1f6fe5] focus-visible:ring-[#1f6fe5]/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#1f3350]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5f7c99]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter test password"
                    className="h-11 rounded-md border-[#d7e8fb] bg-white pl-9 pr-10 text-sm text-[#071224] shadow-sm placeholder:text-[#7d94ab] focus-visible:border-[#1f6fe5] focus-visible:ring-[#1f6fe5]/20"
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
                className="h-11 w-full rounded-md bg-[#18479f] font-semibold text-white shadow-sm transition hover:bg-[#1f6fe5]"
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
