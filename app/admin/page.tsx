"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  FolderKanban,
  UserCircle,
  Plus,
  Menu,
  X,
  Search,
  LogOut,
  School,
  ShieldCheck,
  BookMarked,
} from "lucide-react"

const adminFeatures = [
  {
    title: "User Management",
    description:
      "Manage admin, faculty, and student accounts with sorting and search features.",
    icon: Users,
  },
  {
    title: "Semester Management",
    description:
      "Manage active semesters, school years, and enrollment periods.",
    icon: CalendarDays,
  },
  {
    title: "Subjects Management",
    description:
      "Add, edit, and organize academic subjects and schedules.",
    icon: BookOpen,
  },
  {
    title: "Curriculum Courses",
    description:
      "Create and update curriculum structures and academic programs.",
    icon: FolderKanban,
  },
  {
    title: "Classes Management",
    description:
      "View schedules, instructors, sections, and room assignments.",
    icon: GraduationCap,
  },
  {
    title: "Online Thesis Management",
    description:
      "Upload, archive, and organize thesis and capstone documents.",
    icon: BookMarked,
  },
  {
    title: "Profile",
    description:
      "Manage administrator account information and preferences.",
    icon: UserCircle,
  },
]

const users = [
  {
    name: "Juan Dela Cruz",
    role: "Student",
    email: "juan@student.edu",
  },
  {
    name: "Maria Santos",
    role: "Faculty",
    email: "maria@faculty.edu",
  },
  {
    name: "Admin Reyes",
    role: "Admin",
    email: "admin@portal.edu",
  },
]

export default function AdminDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const router = useRouter()

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    )

    if (confirmLogout) {
      router.push("/")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <div className="flex min-h-screen">

        {/* Mobile Navbar */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />

            <span className="font-bold text-slate-800">
              Admin Portal
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 hover:bg-slate-100"
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
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
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
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  Admin Portal
                </h1>

                <p className="text-sm text-slate-500">
                  MERN Student System
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

          {/* Admin Profile */}
          <div className="px-4 py-5">
            <Card className="rounded-3xl border-0 bg-blue-600 text-white shadow-xl">
              <CardContent className="p-5 space-y-4">

                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <UserCircle className="h-8 w-8" />
                  </div>

                  <div>
                    <h2 className="font-bold text-lg">
                      Alyssa Admin
                    </h2>

                    <p className="text-sm text-blue-100">
                      System Administrator
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    <span>CS Department</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Full Administrative Access</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-6 space-y-2 overflow-y-auto">
            {adminFeatures.map((feature) => {
              const Icon = feature.icon

              return (
                <button
                  key={feature.title}
                  className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-700 transition-all hover:bg-blue-600 hover:text-white"
                >
                  <Icon className="h-5 w-5" />

                  <span className="font-medium">
                    {feature.title}
                  </span>
                </button>
              )
            })}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-600 transition-all hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-5 w-5" />

              <span className="font-medium">
                Logout
              </span>
            </button>

          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-6 pt-24 md:p-10 md:pt-10 overflow-y-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                Welcome back, Alyssa 👋
              </h2>

              <p className="text-slate-500 mt-1">
                Manage academic records, users, schedules, and portal operations.
              </p>
            </div>

            <Button className="rounded-2xl h-11 px-5 text-base shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>

          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Total Students
                </p>

                <h3 className="text-3xl font-bold text-slate-800 mt-2">
                  1,245
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Faculty Members
                </p>

                <h3 className="text-3xl font-bold text-slate-800 mt-2">
                  54
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Active Subjects
                </p>

                <h3 className="text-3xl font-bold text-slate-800 mt-2">
                  72
                </h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl bg-white/90">
              <CardContent className="p-6">
                <p className="text-sm text-slate-500">
                  Thesis Uploaded
                </p>

                <h3 className="text-3xl font-bold text-slate-800 mt-2">
                  320
                </h3>
              </CardContent>
            </Card>

          </div>

          {/* User Management */}
          <Card className="rounded-3xl border-0 shadow-xl bg-white/90 mb-8">

            <CardHeader>
              <CardTitle className="text-2xl text-slate-800">
                List of Users
              </CardTitle>

              <CardDescription>
                Search and manage students, faculty, and administrators.
              </CardDescription>
            </CardHeader>

            <CardContent>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                <Input
                  placeholder="Search by username or email..."
                  className="pl-10 h-11 rounded-2xl"
                />
              </div>

              {/* Users */}
              <div className="space-y-4">

                {users.map((user) => (
                  <div
                    key={user.email}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-100 p-5 hover:bg-slate-50 transition-all"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {user.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">

                      <span className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">
                        {user.role}
                      </span>

                      <Button
                        variant="outline"
                        className="rounded-xl"
                      >
                        View
                      </Button>

                    </div>
                  </div>
                ))}

              </div>

            </CardContent>
          </Card>

        </section>
      </div>
    </main>
  )
}