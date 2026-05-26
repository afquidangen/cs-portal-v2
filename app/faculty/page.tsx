"use client"

import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
  GraduationCap,
  ClipboardCheck,
  CalendarDays,
  FileSpreadsheet,
  Download,
  UserCircle,
  Users,
  Network,
  CheckCircle2,
  LogOut,
} from "lucide-react"

const facultyFeatures = [
  {
    title: "Manage Class",
    description:
      "Enroll students through checklist verification and manage class records.",
    icon: ClipboardCheck,
  },
  {
    title: "Class Schedule",
    description:
      "View assigned schedules, sections, rooms, and subjects handled.",
    icon: CalendarDays,
  },
  {
    title: "Manage Grades",
    description:
      "Input Midterm and Final Term grades and compute final grades.",
    icon: FileSpreadsheet,
  },
  {
    title: "Download Grade Template",
    description:
      "Download official grading sheet templates for encoding student grades.",
    icon: Download,
  },
  {
    title: "Profile",
    description:
      "Manage faculty account settings and instructor profile information.",
    icon: UserCircle,
  },
  {
    title: "Teacher Availability",
    description:
      "View faculty availability status, consultation hours, and schedules.",
    icon: CheckCircle2,
  },
  {
    title: "Instructor Information",
    description:
      "Access instructor profiles and department organizational charts.",
    icon: Network,
  },
]

export default function FacultyDashboardPage() {
  const router = useRouter()

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out?"
    )

    if (!confirmLogout) return

    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden md:flex w-72 flex-col border-r border-slate-200 bg-white/90 backdrop-blur-xl shadow-xl">

          <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Faculty Portal
              </h1>
              <p className="text-sm text-slate-500">
                Instructor Management System
              </p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {facultyFeatures.map((feature) => {
              const Icon = feature.icon

              return (
                <button
                  key={feature.title}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-700 transition-all hover:bg-blue-600 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{feature.title}</span>
                </button>
              )
            })}

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-600 transition-all hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                Faculty Dashboard
              </h2>

              <p className="text-slate-500 mt-1">
                Manage classes, schedules, grades, and faculty information.
              </p>
            </div>

            <Button className="rounded-2xl h-11 px-5 text-base shadow-lg">
              <Users className="h-4 w-4 mr-2" />
              Faculty Access
            </Button>

          </div>

        </section>
      </div>
    </main>
  )
}