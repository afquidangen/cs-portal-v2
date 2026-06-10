"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Invalid reset link. No token provided.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.")
      return
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setMessage("Password must contain at least one letter and one number.")
      return
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error ?? "Failed to reset password.")
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setMessage("Unable to connect. Please try again.")
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <KeyRound className="mx-auto size-12 text-emerald-500" />
        <h2 className="text-xl font-semibold text-foreground">Password Reset Successful</h2>
        <p className="text-sm text-muted-foreground">
          You can now sign in with your new password.
        </p>
        <Button onClick={() => router.push("/")} className="rounded-xl">
          Go to Login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters, letter + number"
            className="h-10 rounded-xl pl-9 pr-10"
            minLength={8}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((p) => !p)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm New Password</Label>
        <Input
          id="confirm"
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter new password"
          className="h-10 rounded-xl"
          minLength={8}
          required
        />
      </div>
      {message ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </p>
      ) : null}
      <Button type="submit" className="h-10 w-full rounded-xl" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-2xl border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Reset Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
            <ResetForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
