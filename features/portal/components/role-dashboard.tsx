"use client"

import {
  Clock3,
  GraduationCap,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Role } from "../data/portal-data"
import { usePortalDashboardModel } from "../hooks/use-portal-dashboard-model"
import { AcademicModule } from "./modules/academic-module"
import { AnnouncementManagerModule } from "./modules/announcement-manager-module"
import { AuditModule } from "./modules/audit-module"
import { AvailabilityModule } from "./modules/availability-module"
import { ClassesModule } from "./modules/classes-module"
import { CsoModule } from "./modules/cso-module"
import { CurriculumModule } from "./modules/curriculum-module"
import { FeedbackModule } from "./modules/feedback-module"
import { GradesModule } from "./modules/grades-module"
import { InstructorsModule } from "./modules/instructors-module"
import { OverviewModule } from "./modules/overview-module"
import { QuickLinksModule } from "./modules/quick-links-module"
import { SchedulePanel } from "./modules/schedule-panel"
import { SeminarsModule } from "./modules/seminars-module"
import { TemplatesModule } from "./modules/templates-module"
import { ThesisLibraryModule } from "./modules/thesis-library-module"
import { UsersModule } from "./modules/users-module"

export function RoleDashboard({ role }: { role: Role }) {
  const model = usePortalDashboardModel(role)

  function renderModule() {
    if (model.activeModule === "overview") return <OverviewModule model={model} />
    if (model.activeModule === "grades") return <GradesModule model={model} />
    if (model.activeModule === "thesis") return <ThesisLibraryModule model={model} />
    if (model.activeModule === "announcements") {
      return <AnnouncementManagerModule model={model} />
    }
    if (model.activeModule === "feedback") return <FeedbackModule model={model} />
    if (model.activeModule === "seminars") return <SeminarsModule model={model} />
    if (model.activeModule === "availability") {
      return <AvailabilityModule model={model} />
    }
    if (model.activeModule === "instructors") {
      return <InstructorsModule model={model} />
    }
    if (model.activeModule === "cso") return <CsoModule />
    if (model.activeModule === "schedule") return <SchedulePanel />
    if (model.activeModule === "curriculum") return <CurriculumModule />
    if (model.activeModule === "quick-links") return <QuickLinksModule />
    if (model.activeModule === "users") return <UsersModule model={model} />
    if (model.activeModule === "academic") return <AcademicModule />
    if (model.activeModule === "templates") return <TemplatesModule model={model} />
    if (model.activeModule === "classes") return <ClassesModule model={model} />
    if (model.activeModule === "audit") return <AuditModule />
    return <OverviewModule model={model} />
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="flex min-h-screen">
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            {role === "admin" ? (
              <ShieldCheck className="size-6 text-sky-700" />
            ) : (
              <GraduationCap className="size-6 text-sky-700" />
            )}
            <span className="font-semibold capitalize">{role} Portal</span>
          </div>
          <button
            type="button"
            onClick={() => model.setSidebarOpen((open) => !open)}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {model.sidebarOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {model.sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
            onClick={() => model.setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0",
            model.sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-sky-700 text-white">
                {role === "admin" ? (
                  <ShieldCheck className="size-5" />
                ) : (
                  <GraduationCap className="size-5" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-slate-950">ComSite</h1>
                <p className="text-sm capitalize text-slate-500">
                  {role} workspace
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-950">
                {model.profile.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {model.profile.title}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {model.navigation.map((item) => {
              const Icon = item.icon
              const active = item.id === model.activeModule
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => model.selectModule(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-sky-700 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={model.handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 md:p-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                {role === "admin"
                  ? "Academic operations"
                  : role === "faculty"
                    ? "Instructor management"
                    : "Student services"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 md:text-3xl">
                {model.currentTitle}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => model.selectModule(role === "student" ? "feedback" : "audit")}
              >
                <Clock3 className="size-4" />
                Activity
              </Button>
              <Button onClick={() => model.selectModule(role === "admin" ? "users" : "availability")}>
                {role === "admin" ? (
                  <Plus className="size-4" />
                ) : (
                  <UserCircle className="size-4" />
                )}
                {role === "admin" ? "Add Account" : "Update Status"}
              </Button>
            </div>
          </header>

          {renderModule()}
        </section>
      </div>
    </main>
  )
}
