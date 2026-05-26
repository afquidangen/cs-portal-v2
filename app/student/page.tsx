"use client"

import { useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

import {
  GraduationCap,
  BookOpen,
  Bell,
  MessageSquareWarning,
  Presentation,
  CalendarDays,
  Clock3,
  FileText,
  Download,
  Globe,
  UserCircle,
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
  School,
  IdCard,
  Layers3,
  LogOut,
} from "lucide-react"

const studentFeatures = [
  {
    title: "Online Thesis Library",
    icon: BookOpen,
  },
  {
    title: "Announcements & CS Updates",
    icon: Bell,
  },
  {
    title: "Feedback & Complaint System",
    icon: MessageSquareWarning,
  },
  {
    title: "Seminars & Webinars",
    icon: Presentation,
  },
  {
    title: "Teacher Availability",
    icon: CheckCircle2,
  },
  {
    title: "Weekly Schedule",
    icon: Clock3,
  },
  {
    title: "Calendar & Events",
    icon: CalendarDays,
  },
  {
    title: "Current Curriculum",
    icon: GraduationCap,
  },
  {
    title: "Curriculum Plan & Grade Guide",
    icon: FileText,
  },
  {
    title: "Download Grade Report",
    icon: Download,
  },
  {
    title: "Quick Links",
    icon: Globe,
  },
  {
    title: "Profile",
    icon: UserCircle,
  },
]

export default function StudentDashboardPage() {
    const router = useRouter()

const handleLogout = () => {
  const confirmLogout = window.confirm("Are you sure you want to log out?")
  if (!confirmLogout) return

  router.push("/")
}

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sample Student Data
  const student = {
    name: "Juan Dela Cruz",
    studentId: "2024-001245",
    section: "BSCS 3A",
    course: "Bachelor of Science in Computer Science",
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="flex min-h-screen">

        {/* Mobile Navbar */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />

            <span className="font-bold text-slate-800">
              Student Portal
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 hover:bg-slate-100 transition-all"
          >
            {sidebarOpen ? (
              <X className="h-6 w-6 text-slate-700" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

<aside
  className={`
    fixed md:static z-40 top-0 left-0 h-full w-72
    transform border-r border-slate-200
    bg-white/90 backdrop-blur-xl shadow-xl
    transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <GraduationCap className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  Student Portal
                </h1>

                <p className="text-sm text-slate-500">
                  MERN Academic System
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden rounded-lg p-2 hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Student Info */}
          <div className="px-4 py-5">
            <Card className="rounded-3xl border-0 bg-blue-600 text-white shadow-xl">
              <CardContent className="p-5 space-y-4">

                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <UserCircle className="h-8 w-8" />
                  </div>

                  <div>
                    <h2 className="font-bold text-lg">
                      {student.name}
                    </h2>

                    <p className="text-sm text-blue-100">
                      {student.course}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">

                  <div className="flex items-center gap-2 text-sm">
                    <IdCard className="h-4 w-4" />

                    <span>
                      Student ID: {student.studentId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Layers3 className="h-4 w-4" />

                    <span>
                      Section: {student.section}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <School className="h-4 w-4" />

                    <span>
                      Status: Regular Student
                    </span>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
{/* Navigation */}
<nav className="flex-1 px-4 pb-6 space-y-2 overflow-y-auto">
  {studentFeatures.map((feature) => {
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

  {/* Logout Button (outside map) */}
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
        <section className="flex-1 p-6 pt-24 md:p-10 md:pt-10 overflow-y-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                Welcome back, {student.name} 👋
              </h2>

              <p className="text-slate-500 mt-1">
                Here's your latest academic overview and updates.
              </p>
            </div>

          </div>

          {/* Student Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Current Semester
                </p>

                <h3 className="text-2xl font-bold text-slate-800 mt-2">
                  2nd Semester
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Enrolled Subjects
                </p>

                <h3 className="text-2xl font-bold text-slate-800 mt-2">
                  7 Subjects
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Current Section
                </p>

                <h3 className="text-2xl font-bold text-slate-800 mt-2">
                  BSCS 3A
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Upcoming Events
                </p>

                <h3 className="text-2xl font-bold text-slate-800 mt-2">
                  4 Events
                </h3>
              </CardContent>
            </Card>

          </div>

          {/* Weekly Schedule + Notifications */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">

            {/* Weekly Schedule */}
            <Card className="xl:col-span-2 rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800">
                  Weekly Class Schedule
                </CardTitle>

                <CardDescription>
                  Your enrolled classes this week
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">

                {[
                  {
                    subject: "Web Systems",
                    day: "Monday",
                    time: "8:00 AM - 10:00 AM",
                    room: "Lab 203",
                  },
                  {
                    subject: "Data Structures",
                    day: "Tuesday",
                    time: "10:00 AM - 12:00 PM",
                    room: "Room 301",
                  },
                  {
                    subject: "Software Engineering",
                    day: "Wednesday",
                    time: "1:00 PM - 3:00 PM",
                    room: "Room 205",
                  },
                  {
                    subject: "Database Systems",
                    day: "Thursday",
                    time: "9:00 AM - 11:00 AM",
                    room: "Lab 204",
                  },
                ].map((schedule) => (
                  <div
                    key={schedule.subject}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 hover:bg-slate-50 transition-all"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800">
                        {schedule.subject}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {schedule.day} • {schedule.time}
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">
                      {schedule.room}
                    </div>
                  </div>
                ))}

              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-800">
                  Notifications
                </CardTitle>

                <CardDescription>
                  Latest updates and reminders
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">

                {[
                  "Midterm examination starts next week.",
                  "Capstone orientation scheduled on Friday.",
                  "Grade reports are now available online.",
                  "Seminar registration closes tomorrow.",
                ].map((notification, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700"
                  >
                    {notification}
                  </div>
                ))}

              </CardContent>
            </Card>

          </div>

          {/* Announcements */}
          <Card className="rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur">

            <CardHeader>
              <CardTitle className="text-slate-800">
                Announcements & CS Updates
              </CardTitle>

              <CardDescription>
                Latest department announcements and events
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              {[
                {
                  title: "Hackathon 2026 Registration",
                  content:
                    "Students are encouraged to participate in the upcoming university hackathon competition.",
                },
                {
                  title: "System Maintenance",
                  content:
                    "The student portal will undergo maintenance this Saturday from 8 PM to 10 PM.",
                },
                {
                  title: "AI Webinar Event",
                  content:
                    "A free Artificial Intelligence webinar will be conducted next Wednesday via Zoom.",
                },
              ].map((announcement) => (
                <div
                  key={announcement.title}
                  className="rounded-2xl border border-slate-100 p-5 hover:bg-slate-50 transition-all"
                >
                  <h3 className="font-semibold text-slate-800">
                    {announcement.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {announcement.content}
                  </p>
                </div>
              ))}

            </CardContent>
          </Card>

        </section>
      </div>
    </main>
  )
}