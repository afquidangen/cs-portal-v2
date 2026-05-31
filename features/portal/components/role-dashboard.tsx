"use client"

import { useEffect, useState } from "react"
import {
  GraduationCap,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useDashboardProfile } from "@/components/providers/theme-provider"

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
import { SchedulePanel } from "./modules/schedule-panel"
import { ThesisLibraryModule } from "./modules/thesis-library-module"
import { UsersModule } from "./modules/users-module"

export function RoleDashboard({ role }: { role: Role }) {
  const model = usePortalDashboardModel(role)
  const { setProfile } = useDashboardProfile()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setProfile(model.profile.name, role)
  }, [model.profile.name, role, setProfile])

  function renderModule() {
    if (model.activeModule === "overview") return <OverviewModule model={model} />
    if (model.activeModule === "grades") return <GradesModule model={model} />
    if (model.activeModule === "thesis") return <ThesisLibraryModule model={model} />
    if (model.activeModule === "announcements") {
      return <AnnouncementManagerModule model={model} />
    }
    if (model.activeModule === "feedback") return <FeedbackModule model={model} />
    if (model.activeModule === "availability") {
      return <AvailabilityModule model={model} />
    }
    if (model.activeModule === "instructors") {
      return <InstructorsModule model={model} />
    }
    if (model.activeModule === "cso") return <CsoModule />
    if (model.activeModule === "schedule") return <SchedulePanel />
    if (model.activeModule === "curriculum") return <CurriculumModule />
    if (model.activeModule === "users") return <UsersModule model={model} />
    if (model.activeModule === "academic") return <AcademicModule />
    if (model.activeModule === "classes") return <ClassesModule model={model} />
    if (model.activeModule === "audit") return <AuditModule />
    return <OverviewModule model={model} />
  }

  return (
    <main className="min-h-screen bg-quartz text-abyss dark:bg-abyss dark:text-quartz">
      <div className="flex min-h-screen">
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-glacier bg-white px-4 py-3 dark:border-lapis dark:bg-abyss md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-abyss text-quartz dark:bg-quartz dark:text-abyss">
              <GraduationCap className="size-4" />
            </div>
            <span className="font-semibold capitalize text-abyss dark:text-quartz">{role} Portal</span>
          </div>
          <button
            type="button"
            onClick={() => model.setSidebarOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-blue hover:bg-glacier/50 dark:text-glacier dark:hover:bg-lapis/50"
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
            className="fixed inset-0 z-30 bg-abyss/40 dark:bg-abyss/80 md:hidden"
            onClick={() => model.setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-glacier bg-white transition-all md:static dark:border-lapis dark:bg-abyss",
            collapsed ? "w-16" : "w-72",
            model.sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex items-center justify-end border-b border-glacier p-3 dark:border-lapis">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-lg p-1.5 text-slate-blue transition hover:bg-glacier/50 md:block dark:text-glacier dark:hover:bg-lapis/50"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
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
                    collapsed ? "justify-center" : "",
                    active
                      ? "bg-abyss text-quartz dark:bg-quartz dark:text-abyss"
                      : "text-slate-blue hover:bg-glacier/50 hover:text-abyss dark:text-glacier dark:hover:bg-lapis/50 dark:hover:text-quartz"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-glacier p-2 dark:border-lapis" />
        </aside>

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 md:p-8">
          {model.activeModule !== "overview" ? (
            <header className="mb-6">
              <h2 className="text-2xl font-semibold text-abyss dark:text-quartz md:text-3xl">
                {model.currentTitle}
              </h2>
            </header>
          ) : null}

          {renderModule()}
        </section>
      </div>
    </main>
  )
}
