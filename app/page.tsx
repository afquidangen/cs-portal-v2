"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { GraduationCap, Lock, Mail } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulated login process
setTimeout(() => {
  console.log("Login:", { email, password })

  if (email.includes("admin")) {
    router.push("/admin")
  } else if (email.includes("faculty")) {
    router.push("/faculty")
  } else if (email.includes("student")) {
    router.push("/student")
  } else {
    router.push("/")
  }

  setLoading(false)
}, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl border-0">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
            <GraduationCap className="h-8 w-8" />
          </div>

          <div>
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-800">
              Student Portal
            </CardTitle>
            <CardDescription className="text-slate-500 mt-2 text-base">
              Sign in to access your dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Student Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="student@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="cursor-pointer text-slate-600">
                  Remember me
                </Label>
              </div>

              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Need help? Contact your school administrator.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
