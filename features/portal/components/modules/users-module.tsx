"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  History,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import {
  Panel,
  SearchBox,
  Select,
  StatusBadge,
} from "../shared/dashboard-ui"
import type { GradeHistoryEntry, UserRecord } from "../../data/portal-data"
import type { PortalModuleProps } from "./types"

const PAGE_SIZE = 8

const YEAR_LABELS: Record<string, string> = {
  "1": "First Year",
  "2": "Second Year",
  "3": "Third Year",
  "4": "Fourth Year",
}

export function UsersModule({ model }: PortalModuleProps) {
  const {
    curricula,
    filteredUsers,
    handleAddUser,
    handleChangeCurriculum,
    handleAddGradeHistory,
    handleRemoveGradeHistory,
    handleUpdateGradeHistory,
    newUser,
    query,
    roleFilter,
    setNewUser,
    setQuery,
    setRoleFilter,
    toggleUserStatus,
    deleteUser,
    handleUpdateUser,
    users,
    yearSections,
  } = model

  const [editUser, setEditUser] = useState<(UserRecord & { password?: string }) | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [toggleUserId, setToggleUserId] = useState<string | null>(null)
  const [changeCurriculumUser, setChangeCurriculumUser] = useState<{
    user: UserRecord
    newCurriculumId: string
    newYearLevel: string
    newSemester: string
  } | null>(null)
  const [gradeHistoryUser, setGradeHistoryUser] = useState<UserRecord | null>(null)
  const [gradeHistoryEntry, setGradeHistoryEntry] = useState({
    subjectCode: "",
    subjectName: "",
    finalPercentile: 0,
    transmutedGrade: 0,
    remarks: "FAILED",
    curriculumId: "",
    yearLevel: "",
    semester: "",
    section: "",
    units: 3,
  })
  const [editGradeHistoryIndex, setEditGradeHistoryIndex] = useState<number | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [addRole, setAddRole] = useState("student")
  const [studentYearFilter, setStudentYearFilter] = useState("All Years")
  const [studentSectionFilter, setStudentSectionFilter] = useState("All Sections")
  const [facultyFilter, setFacultyFilter] = useState("All Faculty")

  const curriculumOptions = curricula.map(
    (c) => `${c.id} - ${c.name} - ${c.major}`
  )

  const semesterOptions = ["First Semester", "Second Semester", "Midyear"]

  function subjectsForTerm(
    curriculumId: string,
    yearLevel: string,
    semester: string
  ) {
    const curr = curricula.find((c) => c.id === curriculumId)
    if (!curr) return null
    const term = curr.terms.find(
      (t) => t.year === yearLevel && t.semester === semester
    )
    return term ?? null
  }

  const sectionOptions = useMemo(() => {
    const label = YEAR_LABELS[newUser.year]
    if (!label) return []
    const entry = yearSections.find((ys) => ys.year === label)
    return entry?.sections ?? []
  }, [newUser.year, yearSections])

  const studentYearOptions = useMemo(
    () => ["All Years", ...yearSections.map((item) => item.year)],
    [yearSections]
  )

  const studentSectionOptions = useMemo(() => {
    const sections =
      studentYearFilter === "All Years"
        ? yearSections.flatMap((item) => item.sections)
        : yearSections.find((item) => item.year === studentYearFilter)?.sections ?? []
    return ["All Sections", ...Array.from(new Set(sections))]
  }, [studentYearFilter, yearSections])

  const visibleUsers = useMemo(() => {
    const hasStudentFilter =
      studentYearFilter !== "All Years" || studentSectionFilter !== "All Sections"
    const hasFacultyFilter = facultyFilter !== "All Faculty"

    return filteredUsers.filter((user) => {
      if (hasStudentFilter) {
        if (user.role !== "student") return false
        const yearLabel = user.currentYearLevel ?? YEAR_LABELS[String(user.year ?? "")]
        const matchesYear = studentYearFilter === "All Years" || yearLabel === studentYearFilter
        const matchesSection = studentSectionFilter === "All Sections" || user.section === studentSectionFilter
        return matchesYear && matchesSection
      }

      if (hasFacultyFilter) {
        if (user.role !== "faculty") return false
        if (facultyFilter === "Regular Faculty") return user.employmentType === "Regular"
        if (facultyFilter === "Part Time Faculty") return user.employmentType === "Part Time"
        if (facultyFilter === "With Advisory") return Boolean(user.advisoryClass)
        if (facultyFilter === "No Advisory") return !user.advisoryClass
      }

      return true
    })
  }, [facultyFilter, filteredUsers, studentSectionFilter, studentYearFilter])

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedUsers = visibleUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      inactive: users.filter((u) => u.status === "Inactive").length,
      students: users.filter((u) => u.role === "student").length,
      faculty: users.filter((u) => u.role === "faculty").length,
      admins: users.filter((u) => u.role === "admin").length,
    }
  }, [users])

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  function handleEditSave() {
    if (!editUser) return
    const fullName = [editUser.firstName, editUser.middleName, editUser.lastName]
      .map((p) => (p ?? "").trim())
      .filter(Boolean)
      .join(" ")
    handleUpdateUser({ ...editUser, email: editUser.email.toLowerCase().trim(), name: fullName || editUser.name })
    setEditUser(null)
  }

  function handleDeleteConfirm() {
    if (!deleteUserId) return
    deleteUser(deleteUserId)
    setDeleteUserId(null)
  }

  function handleToggleConfirm() {
    if (!toggleUserId) return
    toggleUserStatus(toggleUserId)
    setToggleUserId(null)
  }

  function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    handleAddUser(e)
    setAddOpen(false)
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 px-4 py-6 text-left shadow-sm sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)]" />
        <div className="relative flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
            <UserCog className="size-8" />
          </div>
          <div>
            <p className="inline-flex items-center justify-start gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <ShieldCheck className="size-4" />
              Accounts and Access Control
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              User Management
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage portal accounts, roles, status, curriculum assignments, and student grade registry records.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Total Accounts", value: stats.total, icon: Users },
          { label: "Active", value: stats.active, icon: UserCheck },
          { label: "Inactive", value: stats.inactive, icon: UserX },
          { label: "Students", value: stats.students, icon: Search },
          { label: "Faculty", value: stats.faculty, icon: Users },
          { label: "Admins", value: stats.admins, icon: ShieldCheck },
        ].map((stat) => (
          <div
            key={stat.label}
            className="edu-bg-soft-glacier flex items-center gap-3 rounded-xl border border-[var(--edu-border-glacier)] bg-card p-4 shadow-sm"
          >
            <div className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm">
              <stat.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Panel
        title={`Users (${visibleUsers.length})`}
        eyebrow="Search and filter"
        actions={
          <div className="grid w-full max-w-full min-w-0 grid-cols-1 gap-2 rounded-xl border border-border bg-background/80 p-2 shadow-sm sm:grid-cols-2 lg:w-[720px] lg:grid-cols-3 xl:w-[960px] xl:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(120px,1fr))_minmax(132px,auto)]">
            <div className="min-w-0 sm:col-span-2 lg:col-span-3 xl:col-span-1 [&>div]:max-w-none">
              <SearchBox
                value={query}
                onChange={(v) => {
                  setQuery(v)
                  setPage(1)
                }}
                placeholder="Search name, email, or ID"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v)
                setStudentYearFilter("All Years")
                setStudentSectionFilter("All Sections")
                setFacultyFilter("All Faculty")
                setPage(1)
              }}
              options={["All", "student", "faculty", "admin"]}
              className="w-full min-w-0"
            />
            <Select
              value={studentYearFilter}
              onChange={(value) => {
                setStudentYearFilter(value)
                setStudentSectionFilter("All Sections")
                setFacultyFilter("All Faculty")
                setPage(1)
              }}
              options={studentYearOptions}
              className="w-full min-w-0"
            />
            <Select
              value={studentSectionFilter}
              onChange={(value) => {
                setStudentSectionFilter(value)
                setFacultyFilter("All Faculty")
                setPage(1)
              }}
              options={studentSectionOptions}
              className="w-full min-w-0"
            />
            <Select
              value={facultyFilter}
              onChange={(value) => {
                setFacultyFilter(value)
                setStudentYearFilter("All Years")
                setStudentSectionFilter("All Sections")
                setPage(1)
              }}
              options={["All Faculty", "Regular Faculty", "Part Time Faculty", "With Advisory", "No Advisory"]}
              className="w-full min-w-0"
            />
            <Button
              type="button"
              onClick={() => {
                setAddRole("student")
                setAddOpen(true)
              }}
              className="h-11 w-full whitespace-nowrap rounded-lg sm:col-span-2 lg:col-span-1 xl:col-span-1"
            >
              <Plus className="size-4" />
              Add Account
            </Button>
          </div>
        }
      >
        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex h-[74px] min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
            <Filter className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Role View</p>
              <p className="truncate font-medium text-foreground">{roleFilter === "All" ? "All account roles" : roleFilter}</p>
            </div>
          </div>
          <div className="flex h-[74px] min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
            <GraduationCap className="size-4 shrink-0 text-sky-600 dark:text-sky-300" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Student Year</p>
              <p className="truncate font-medium text-foreground">{studentYearFilter}</p>
            </div>
          </div>
          <div className="flex h-[74px] min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
            <Users className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Section</p>
              <p className="truncate font-medium text-foreground">{studentSectionFilter}</p>
            </div>
          </div>
          <div className="flex h-[74px] min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
            <UserCheck className="size-4 shrink-0 text-violet-600 dark:text-violet-300" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Faculty</p>
              <p className="truncate font-medium text-foreground">{facultyFilter}</p>
            </div>
          </div>
        </div>
        {paginatedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="grid gap-3 md:hidden">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 shrink-0 ring-1 ring-border">
                        <AvatarFallback className="bg-muted text-xs text-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.id}</p>
                      </div>
                    </div>
                    <StatusBadge value={user.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize rounded-md bg-muted px-2 py-0.5">{user.role}</span>
                    {user.role === "student"
                      ? `${user.year ?? "-"}${user.section ?? ""} \u00B7 ${user.studentType ?? "Regular"}`
                      : user.academicTitle ? `${user.academicTitle} \u00B7 ${user.employmentType ?? "Regular"}` : null}
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditUser(user)} title="Edit user">
                      <Edit className="size-3.5" />
                    </Button>
                    {user.role === "student" ? (
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setChangeCurriculumUser({ user, newCurriculumId: user.curriculumId ?? "", newYearLevel: user.currentYearLevel ?? YEAR_LABELS[String(user.year ?? "1")], newSemester: user.currentSemester ?? "First Semester" })} title="Change curriculum">
                        <ArrowLeftRight className="size-3.5" />
                      </Button>
                    ) : null}
                    {user.role === "student" ? (
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setGradeHistoryUser(user); setGradeHistoryEntry({ subjectCode: "", subjectName: "", finalPercentile: 0, transmutedGrade: 0, remarks: "Passed", curriculumId: user.curriculumId ?? "", yearLevel: "", semester: "" }) }} title="Grade history">
                        <History className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setToggleUserId(user.id)} title={user.status === "Active" ? "Deactivate" : "Activate"}>
                      {user.status === "Active" ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDeleteUserId(user.id)} title="Delete user">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden overflow-x-auto rounded-xl border border-border shadow-sm md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Account
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Role
                    </th>
                      <th className="hidden xl:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Details
                      </th>
                      <th className="hidden 2xl:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Created
                      </th>
                      <th className="hidden 2xl:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Last Login
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                        Status
                      </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0 ring-1 ring-border">
                            <AvatarFallback className="bg-muted text-xs text-foreground">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-foreground/80">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 capitalize text-foreground/80">
                        {user.role}
                      </td>
                      <td className="hidden xl:table-cell max-w-[200px] truncate px-4 py-3 text-foreground/80">
                        {user.role === "student"
                          ? `${user.year ?? "-"}${user.section ?? ""} \u00B7 ${user.studentType ?? "Regular"} \u00B7 ${user.curriculum ?? "N/A"}`
                          : `${user.academicTitle ?? "N/A"} \u00B7 ${user.employmentType ?? "Regular"} \u00B7 ${user.advisoryClass ?? "No advisory"}`}
                      </td>
                      <td className="hidden 2xl:table-cell px-4 py-3 text-xs text-foreground/60">
                        {user.createdAt ?? "—"}
                      </td>
                      <td className="hidden 2xl:table-cell px-4 py-3 text-xs text-foreground/60">
                        {user.lastLogin ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={user.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setEditUser(user)}
                            title="Edit user"
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          {user.role === "student" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => setChangeCurriculumUser({ user, newCurriculumId: user.curriculumId ?? "", newYearLevel: user.currentYearLevel ?? YEAR_LABELS[String(user.year ?? "1")], newSemester: user.currentSemester ?? "First Semester" })}
                              title="Change curriculum"
                            >
                              <ArrowLeftRight className="size-3.5" />
                            </Button>
                          ) : null}
                          {user.role === "student" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => { setGradeHistoryUser(user); setGradeHistoryEntry({ subjectCode: "", subjectName: "", finalPercentile: 0, transmutedGrade: 0, remarks: "Passed", curriculumId: user.curriculumId ?? "", yearLevel: "", semester: "" }) }}
                              title="Grade history"
                            >
                              <History className="size-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setToggleUserId(user.id)}
                            title={
                              user.status === "Active"
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            {user.status === "Active" ? (
                              <UserX className="size-3.5" />
                            ) : (
                              <UserCheck className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDeleteUserId(user.id)}
                            title="Delete user"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-foreground">
                  Page {safePage} of {totalPages}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    size="sm"
                    variant="outline"
                    className="justify-center rounded-xl border-border bg-card text-foreground shadow-sm hover:bg-muted"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="justify-center rounded-xl border-border bg-card text-foreground shadow-sm hover:bg-muted"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Panel>

      {/* ── Add Account Dialog ── */}
      <Dialog open={addOpen} onOpenChange={(o) => {
        if (!o) setAddOpen(false)
      }}>
        <DialogContent className="flex flex-col w-full sm:max-w-lg md:max-w-xl max-h-[85dvh] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
            <DialogTitle className="text-lg sm:text-xl text-foreground">Add Account</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Create a new user account
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Role</p>
                <Select
                  value={addRole}
                  onChange={(value) => {
                    setAddRole(value)
                    setNewUser((current) => ({ ...current, role: value as "student" | "faculty" | "admin" }))
                  }}
                  options={["student", "faculty", "admin"]}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">First name *</p>
                  <Input
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser((current) => ({
                        ...current,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Middle name</p>
                  <Input
                    value={newUser.middleName}
                    onChange={(e) =>
                      setNewUser((current) => ({
                        ...current,
                        middleName: e.target.value,
                      }))
                    }
                    placeholder="Santos"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Last name *</p>
                  <Input
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser((current) => ({
                        ...current,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Dela Cruz"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">ID Number</p>
                  <Input
                    value={newUser.idNumber}
                    onChange={(e) =>
                      setNewUser((current) => ({
                        ...current,
                        idNumber: e.target.value,
                      }))
                    }
                    placeholder="IS-00-00000"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Sex</p>
                  <Select
                    value={newUser.sex}
                    onChange={(value) =>
                      setNewUser((current) => ({ ...current, sex: value }))
                    }
                    options={["Male", "Female"]}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Email *</p>
                <Input
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((current) => ({
                      ...current,
                      email: e.target.value,
                    }))
                  }
                  placeholder={
                    addRole === "student"
                      ? "student@gmail.com"
                      : addRole === "faculty"
                        ? "faculty@ispsc.edu"
                        : "admin@ispsc.edu"
                  }
                  type="email"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {addRole === "student" && (
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-foreground">Section</p>
                    <Select
                      value={newUser.section}
                      onChange={(value) =>
                        setNewUser((current) => ({ ...current, section: value }))
                      }
                      options={sectionOptions.length > 0 ? sectionOptions : ["A", "B", "C", "D"]}
                    />
                  </div>
                )}
              </div>

              {addRole === "student" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Year Level</p>
                      <Select
                        value={newUser.currentYearLevel}
                        onChange={(value) => {
                          const newYear = String(
                            ["First Year", "Second Year", "Third Year", "Fourth Year"].indexOf(value) + 1
                          )
                          const label = YEAR_LABELS[newYear]
                          const entry = label ? yearSections.find((ys) => ys.year === label) : undefined
                          const firstSection = entry?.sections?.[0] ?? ""
                          setNewUser((current) => ({
                            ...current,
                            currentYearLevel: value,
                            year: newYear,
                            section: firstSection,
                          }))
                        }}
                        options={["First Year", "Second Year", "Third Year", "Fourth Year"]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Student type</p>
                      <Select
                        value={newUser.studentType}
                        onChange={(value) =>
                          setNewUser((current) => ({
                            ...current,
                            studentType: value,
                          }))
                        }
                        options={[
                          "Regular",
                          "Irregular",
                          "Overstayed",
                          "Transferee",
                          "Shifter",
                        ]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Curriculum</p>
                      <Select
                        value={newUser.curriculum}
                        onChange={(value) => {
                          const curr = curricula.find(
                            (c) => `${c.id} - ${c.name} - ${c.major}` === value
                          )
                          setNewUser((current) => ({
                            ...current,
                            curriculum: value,
                            curriculumId: curr?.id ?? "",
                          }))
                        }}
                        options={curriculumOptions}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Semester</p>
                      <Select
                        value={newUser.currentSemester}
                        onChange={(value) =>
                          setNewUser((current) => ({
                            ...current,
                            currentSemester: value,
                          }))
                        }
                        options={semesterOptions}
                      />
                    </div>
                  </div>
                  {(() => {
                    const term = subjectsForTerm(
                      newUser.curriculumId,
                      newUser.currentYearLevel,
                      newUser.currentSemester
                    )
                    if (!term) return null
                    return (
                      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Subjects for {newUser.currentYearLevel} - {newUser.currentSemester}
                        </p>
                        <div className="grid gap-1.5 text-xs text-foreground/80">
                          {term.subjects.map((sub) => (
                            <div key={sub.code} className="flex items-center gap-2">
                              <span className="font-medium">{sub.code}</span>
                              <span>{sub.name}</span>
                              <span className="ml-auto text-muted-foreground">{sub.total} units</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : null}

              {addRole === "faculty" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faculty Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Has advisory class?</p>
                      <Select
                        value={newUser.hasAdvisory ? "Yes" : "No"}
                        onChange={(value) =>
                          setNewUser((current) => ({
                            ...current,
                            hasAdvisory: value === "Yes",
                          }))
                        }
                        options={["Yes", "No"]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Employment type</p>
                      <Select
                        value={newUser.employmentType}
                        onChange={(value) =>
                          setNewUser((current) => ({
                            ...current,
                            employmentType: value,
                          }))
                        }
                        options={["Regular", "Part Time"]}
                      />
                    </div>
                    <div className={newUser.hasAdvisory ? "" : "sm:col-span-2"}>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Academic title</p>
                      <Select
                        value={newUser.academicTitle}
                        onChange={(value) =>
                          setNewUser((current) => ({
                            ...current,
                            academicTitle: value,
                          }))
                        }
                        options={["PhD", "MIT", "DIT", "LPT"]}
                      />
                    </div>
                  </div>
                  {newUser.hasAdvisory ? (
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Advisory class</p>
                      <Input
                        value={newUser.advisoryClass}
                        onChange={(e) =>
                          setNewUser((current) => ({
                            ...current,
                            advisoryClass: e.target.value,
                          }))
                        }
                        placeholder="e.g. BSCS 3A"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <DialogFooter className="shrink-0 px-5 pb-5 pt-4 border-t border-border gap-3 flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="w-full sm:w-auto">
                <Plus className="mr-1.5 size-4" /> Save Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Change Curriculum Dialog ── */}
      <Dialog open={!!changeCurriculumUser} onOpenChange={(o) => { if (!o) setChangeCurriculumUser(null) }}>
        <DialogContent className="flex flex-col w-full sm:max-w-lg md:max-w-xl max-h-[85dvh] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
            <DialogTitle className="text-lg sm:text-xl text-foreground">Change Curriculum</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Update curriculum assignment for {changeCurriculumUser?.user.name}
            </DialogDescription>
          </DialogHeader>

          {changeCurriculumUser ? (
            <div className="overflow-y-auto px-5 py-5 space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1 text-sm">
                <p className="text-xs font-semibold text-muted-foreground">Current</p>
                <p className="text-foreground font-medium">
                  {(() => {
                    const c = curricula.find((cr) => cr.id === changeCurriculumUser.user.curriculumId)
                    return c ? `${c.id} - ${c.name} - ${c.major}` : changeCurriculumUser.user.curriculum ?? "N/A"
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {changeCurriculumUser.user.currentYearLevel ?? YEAR_LABELS[String(changeCurriculumUser.user.year ?? "1")]} &middot; {changeCurriculumUser.user.currentSemester ?? "—"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">New Curriculum</p>
                  <Select
                    value={(() => {
                      const c = curricula.find((cr) => cr.id === changeCurriculumUser.newCurriculumId)
                      return c ? `${c.id} - ${c.name} - ${c.major}` : ""
                    })()}
                    onChange={(value) => {
                      const curr = curricula.find(
                        (c) => `${c.id} - ${c.name} - ${c.major}` === value
                      )
                      if (curr) {
                        setChangeCurriculumUser((prev) =>
                          prev ? { ...prev, newCurriculumId: curr.id } : null
                        )
                      }
                    }}
                    options={curriculumOptions}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Year Level</p>
                  <Select
                    value={changeCurriculumUser.newYearLevel}
                    onChange={(value) =>
                      setChangeCurriculumUser((prev) =>
                        prev ? { ...prev, newYearLevel: value } : null
                      )
                    }
                    options={["First Year", "Second Year", "Third Year", "Fourth Year"]}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Semester</p>
                  <Select
                    value={changeCurriculumUser.newSemester}
                    onChange={(value) =>
                      setChangeCurriculumUser((prev) =>
                        prev ? { ...prev, newSemester: value } : null
                      )
                    }
                    options={semesterOptions}
                  />
                </div>
              </div>

              {(() => {
                const curr = curricula.find((c) => c.id === changeCurriculumUser.newCurriculumId)
                const term = curr?.terms.find(
                  (t) => t.year === changeCurriculumUser.newYearLevel && t.semester === changeCurriculumUser.newSemester
                )
                if (!term) return null
                return (
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subjects for {changeCurriculumUser.newYearLevel} - {changeCurriculumUser.newSemester}
                    </p>
                    <div className="grid gap-1.5 text-xs text-foreground/80">
                      {term.subjects.map((sub) => (
                        <div key={sub.code} className="flex items-center gap-2">
                          <span className="font-medium">{sub.code}</span>
                          <span>{sub.name}</span>
                          <span className="ml-auto text-muted-foreground">{sub.total} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <p className="text-xs text-muted-foreground leading-relaxed">
                Completed terms from the previous curriculum will have their grades recorded as grade history entries for record-keeping.
              </p>
            </div>
          ) : null}

          <DialogFooter className="px-5 pb-5 pt-4 border-t border-border gap-3 flex-col-reverse sm:flex-row">
            <DialogClose asChild>
              <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
              if (!changeCurriculumUser) return
              const isDifferent = changeCurriculumUser.user.curriculumId !== changeCurriculumUser.newCurriculumId
              handleChangeCurriculum(
                changeCurriculumUser.user.id,
                changeCurriculumUser.newCurriculumId,
                changeCurriculumUser.newYearLevel,
                changeCurriculumUser.newSemester,
                isDifferent
              )
              setChangeCurriculumUser(null)
            }} className="w-full sm:w-auto">
              <ArrowLeftRight className="mr-1.5 size-4" /> Change Curriculum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Grade History Dialog ── */}
      <Dialog open={!!gradeHistoryUser} onOpenChange={(o) => { if (!o) setGradeHistoryUser(null) }}>
        <DialogContent className="flex flex-col w-full sm:max-w-2xl max-h-[85dvh] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
            <DialogTitle>Grade History — {gradeHistoryUser?.name}</DialogTitle>
            <DialogDescription>Add or remove past grade entries for this student.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-5 py-4 space-y-4 grow">
            {(() => {
              const student = gradeHistoryUser
              if (!student) return null
              const curriculum = curricula.find((c) => c.id === student.curriculumId)
              const history = student.gradeHistory ?? []

              const subjectOptions: { value: string; label: string; subjectName: string; yearLevel: string; semester: string; units: number }[] = []
              if (curriculum) {
                for (const term of curriculum.terms) {
                  for (const subj of term.subjects) {
                    subjectOptions.push({
                      value: subj.code,
                      label: `${subj.code} - ${subj.name} (${term.year} - ${term.semester})`,
                      subjectName: subj.name,
                      yearLevel: term.year,
                      semester: term.semester,
                      units: subj.total,
                    })
                  }
                }
              }

              return (
                <>
                  {history.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
                            <th className="px-3 py-2">Code</th>
                            <th className="px-3 py-2">Subject</th>
                            <th className="px-3 py-2 text-center">Final %</th>
                            <th className="px-3 py-2 text-center">Trans. Grade</th>
                            <th className="px-3 py-2">Remarks</th>
                            <th className="px-3 py-2">Term</th>
                            <th className="px-3 py-2">Section</th>
                            <th className="px-3 py-2 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((entry, idx) => (
                            <tr key={idx} className="border-t border-border">
                              <td className="px-3 py-2 font-medium text-foreground">{entry.subjectCode}</td>
                              <td className="px-3 py-2 text-foreground/80">{entry.subjectName}</td>
                              <td className="px-3 py-2 text-center text-foreground">{entry.finalPercentile}</td>
                              <td className="px-3 py-2 text-center text-foreground">{entry.transmutedGrade}</td>
                              <td className="px-3 py-2 text-foreground/80">{entry.remarks}</td>
                              <td className="px-3 py-2 text-foreground/60 text-xs">{entry.yearLevel} — {entry.semester}</td>
                              <td className="px-3 py-2 text-foreground/60 text-xs">{entry.section ?? "—"}</td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex justify-center gap-1">
                                  <button
                                    className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
                                    onClick={() => {
                                      setGradeHistoryEntry({
                                        subjectCode: entry.subjectCode,
                                        subjectName: entry.subjectName,
                                        finalPercentile: entry.finalPercentile,
                                        transmutedGrade: entry.transmutedGrade,
                                        remarks: entry.remarks,
                                        curriculumId: entry.curriculumId,
                                        yearLevel: entry.yearLevel,
                                        semester: entry.semester,
                                        section: entry.section ?? "",
                                        units: entry.units ?? 3,
                                      })
                                      setEditGradeHistoryIndex(idx)
                                    }}
                                  >
                                    <Pencil className="size-3.5 inline" />
                                  </button>
                                  <button
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                    onClick={() => handleRemoveGradeHistory(student.id, idx)}
                                  >
                                    <Trash2 className="size-3.5 inline" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No grade history entries yet.</p>
                  )}

                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      {editGradeHistoryIndex !== null ? "Edit Entry" : "Add Entry"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <p className="mb-1 text-xs font-medium text-foreground/70">Subject</p>
                        <Select
                          value={subjectOptions.find((o) => o.value === gradeHistoryEntry.subjectCode)?.label ?? ""}
                          onChange={(label) => {
                            const opt = subjectOptions.find((o) => o.label === label)
                            if (opt) {
                              setGradeHistoryEntry((prev) => ({
                                ...prev,
                                subjectCode: opt.value,
                                subjectName: opt.subjectName,
                                curriculumId: curriculum?.id ?? "",
                                yearLevel: opt.yearLevel,
                                semester: opt.semester,
                                units: opt.units,
                              }))
                            }
                          }}
                          options={subjectOptions.map((o) => o.label)}
                          contentClassName="max-h-48 overflow-y-auto"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Final Percentile</p>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={gradeHistoryEntry.finalPercentile || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setGradeHistoryEntry((prev) => ({
                              ...prev,
                              finalPercentile: val,
                              transmutedGrade: val >= 97 ? 1 : val >= 94 ? 1.25 : val >= 91 ? 1.5 : val >= 88 ? 1.75 : val >= 85 ? 2 : val >= 82 ? 2.25 : val >= 79 ? 2.5 : val >= 76 ? 2.75 : val >= 75 ? 3 : val >= 72 ? 4 : 5,
                            }))
                          }}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Transmuted Grade</p>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          step={0.25}
                          value={gradeHistoryEntry.transmutedGrade || ""}
                          onChange={(e) =>
                            setGradeHistoryEntry((prev) => ({ ...prev, transmutedGrade: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Units</p>
                        <Input
                          type="number"
                          min={0}
                          max={15}
                          value={gradeHistoryEntry.units ?? 3}
                          onChange={(e) => setGradeHistoryEntry((prev) => ({ ...prev, units: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Remarks</p>
                        <Select
                          value={gradeHistoryEntry.remarks}
                          onChange={(value) => setGradeHistoryEntry((prev) => ({ ...prev, remarks: value }))}
                          options={["FAILED", "INC", "DROP", "UNOFFICIALLY DROP"]}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Year Level</p>
                        <Select
                          value={gradeHistoryEntry.yearLevel}
                          onChange={(value) => setGradeHistoryEntry((prev) => ({ ...prev, yearLevel: value }))}
                          options={Object.values(YEAR_LABELS)}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Semester</p>
                        <Select
                          value={gradeHistoryEntry.semester}
                          onChange={(value) => setGradeHistoryEntry((prev) => ({ ...prev, semester: value }))}
                          options={semesterOptions}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-foreground/70">Section</p>
                        <Select
                          value={gradeHistoryEntry.section}
                          onChange={(value) => setGradeHistoryEntry((prev) => ({ ...prev, section: value }))}
                          options={yearSections.find((ys) => ys.year === gradeHistoryEntry.yearLevel)?.sections ?? []}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={!gradeHistoryEntry.subjectCode || !gradeHistoryEntry.finalPercentile}
                        onClick={() => {
                          if (!student) return
                          const entry: GradeHistoryEntry = {
                            subjectCode: gradeHistoryEntry.subjectCode,
                            subjectName: gradeHistoryEntry.subjectName,
                            finalPercentile: gradeHistoryEntry.finalPercentile,
                            transmutedGrade: gradeHistoryEntry.transmutedGrade,
                            remarks: gradeHistoryEntry.remarks,
                            curriculumId: gradeHistoryEntry.curriculumId || (student.curriculumId ?? ""),
                            yearLevel: gradeHistoryEntry.yearLevel,
                            semester: gradeHistoryEntry.semester,
                            section: gradeHistoryEntry.section || undefined,
                            units: gradeHistoryEntry.units,
                          }
                          if (editGradeHistoryIndex !== null) {
                            handleUpdateGradeHistory(student.id, editGradeHistoryIndex, entry)
                            setEditGradeHistoryIndex(null)
                          } else {
                            handleAddGradeHistory(student.id, entry)
                          }
                            setGradeHistoryEntry({ subjectCode: "", subjectName: "", finalPercentile: 0, transmutedGrade: 0, remarks: "Passed", curriculumId: student.curriculumId ?? "", yearLevel: "", semester: "", section: "", units: 3 })
                        }}
                      >
                        {editGradeHistoryIndex !== null ? <Pencil className="mr-1 size-4" /> : <Plus className="mr-1 size-4" />}
                        {editGradeHistoryIndex !== null ? "Update Entry" : "Add Entry"}
                      </Button>
                      {editGradeHistoryIndex !== null ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            setEditGradeHistoryIndex(null)
                          setGradeHistoryEntry({ subjectCode: "", subjectName: "", finalPercentile: 0, transmutedGrade: 0, remarks: "Passed", curriculumId: student.curriculumId ?? "", yearLevel: "", semester: "", section: "", units: 3 })
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
          <DialogFooter className="px-5 pb-5 pt-2 shrink-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="flex flex-col w-full sm:max-w-lg md:max-w-xl max-h-[85dvh] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
            <DialogTitle className="text-lg sm:text-xl text-foreground">Edit User</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Update account details for {editUser?.name}
            </DialogDescription>
          </DialogHeader>

          {editUser ? (
            <div className="overflow-y-auto px-5 py-5 space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Role</p>
                <Select
                  value={editUser.role}
                  onChange={(value) =>
                    setEditUser({ ...editUser, role: value as "student" | "faculty" | "admin" })
                  }
                  options={["student", "faculty", "admin"]}
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Sex</p>
                <Select
                  value={editUser.sex ?? "Male"}
                  onChange={(value) =>
                    setEditUser({ ...editUser, sex: value })
                  }
                  options={["Male", "Female"]}
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">ID Number</p>
                <Input
                  value={editUser.id}
                  onChange={(e) =>
                    setEditUser({ ...editUser, id: e.target.value })
                  }
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Status</p>
                <Select
                  value={editUser.status}
                  onChange={(value) =>
                    setEditUser({
                      ...editUser,
                      status: value as "Active" | "Inactive",
                    })
                  }
                  options={["Active", "Inactive"]}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">First name</p>
                  <Input
                    value={editUser.firstName ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Middle name</p>
                  <Input
                    value={editUser.middleName ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, middleName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Last name</p>
                  <Input
                    value={editUser.lastName ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Email</p>
                <Input
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser({ ...editUser, email: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Contact Number</p>
                  <Input
                    value={editUser.contactNumber ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, contactNumber: e.target.value })
                    }
                    placeholder="0917 000 0000"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Birthday</p>
                  <Input
                    type="date"
                    value={editUser.birthday ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, birthday: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Address</p>
                <Input
                  value={editUser.address ?? ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, address: e.target.value })
                  }
                  placeholder="City, Province"
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-foreground">Password</p>
                <div className="relative">
                  <Input
                    value={editUser.password ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, password: e.target.value })
                    }
                    placeholder="Leave blank to keep current"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    className="pr-10"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Account Created</p>
                  <p className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground/80">
                    {editUser.createdAt ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Last Login</p>
                  <p className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground/80">
                    {editUser.lastLogin ?? "—"}
                  </p>
                </div>
              </div>

              {editUser.role === "student" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Year Level</p>
                      <Select
                        value={editUser.currentYearLevel ?? YEAR_LABELS[String(editUser.year ?? "1")]}
                        onChange={(value) => {
                          const newYear = Number(
                            ["First Year", "Second Year", "Third Year", "Fourth Year"].indexOf(value) + 1
                          )
                          const label = YEAR_LABELS[String(newYear)]
                          const entry = label ? yearSections.find((ys) => ys.year === label) : undefined
                          const firstSection = entry?.sections?.[0] ?? ""
                          setEditUser({
                            ...editUser,
                            currentYearLevel: value,
                            year: newYear,
                            section: firstSection,
                          })
                        }}
                        options={["First Year", "Second Year", "Third Year", "Fourth Year"]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Section</p>
                      <Select
                        value={editUser.section ?? ""}
                        onChange={(value) =>
                          setEditUser({ ...editUser, section: value })
                        }
                        options={(() => {
                          const label = YEAR_LABELS[String(editUser?.year ?? "1")]
                          const entry = label ? yearSections.find((ys) => ys.year === label) : undefined
                          return entry?.sections ?? ["A", "B", "C", "D"]
                        })()}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Student type</p>
                      <Select
                        value={editUser.studentType ?? "Regular"}
                        onChange={(value) =>
                          setEditUser({
                            ...editUser,
                            studentType: value as UserRecord["studentType"],
                          })
                        }
                        options={[
                          "Regular",
                          "Irregular",
                          "Overstayed",
                          "Transferee",
                          "Shifter",
                        ]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Curriculum</p>
                      <Select
                        value={
                          editUser.curriculumId
                            ? (() => {
                                const c = curricula.find((cr) => cr.id === editUser.curriculumId)
                                return c ? `${c.id} - ${c.name} - ${c.major}` : editUser.curriculum ?? ""
                              })()
                            : editUser.curriculum ?? ""
                        }
                        onChange={(value) => {
                          const curr = curricula.find(
                            (c) => `${c.id} - ${c.name} - ${c.major}` === value
                          )
                          setEditUser({
                            ...editUser,
                            curriculum: value,
                            curriculumId: curr?.id ?? "",
                          })
                        }}
                        options={curriculumOptions}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Semester</p>
                      <Select
                        value={editUser.currentSemester ?? "First Semester"}
                        onChange={(value) =>
                          setEditUser({ ...editUser, currentSemester: value })
                        }
                        options={semesterOptions}
                      />
                    </div>
                  </div>
                  {(() => {
                    const term = subjectsForTerm(
                      editUser.curriculumId ?? "",
                      editUser.currentYearLevel ?? YEAR_LABELS[String(editUser.year ?? "1")],
                      editUser.currentSemester ?? "First Semester"
                    )
                    if (!term) return null
                    return (
                      <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Subjects for {editUser.currentYearLevel ?? YEAR_LABELS[String(editUser.year ?? "1")]} - {editUser.currentSemester ?? "First Semester"}
                        </p>
                        <div className="grid gap-1.5 text-xs text-foreground/80">
                          {term.subjects.map((sub) => (
                            <div key={sub.code} className="flex items-center gap-2">
                              <span className="font-medium">{sub.code}</span>
                              <span>{sub.name}</span>
                              <span className="ml-auto text-muted-foreground">{sub.total} units</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : editUser.role === "faculty" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faculty Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Academic title</p>
                      <Select
                        value={editUser.academicTitle ?? "MIT"}
                        onChange={(value) =>
                          setEditUser({ ...editUser, academicTitle: value })
                        }
                        options={["PhD", "MIT", "DIT", "LPT"]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Employment type</p>
                      <Select
                        value={editUser.employmentType ?? "Regular"}
                        onChange={(value) =>
                          setEditUser({
                            ...editUser,
                            employmentType: value as UserRecord["employmentType"],
                          })
                        }
                        options={["Regular", "Part Time"]}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Has advisory class?</p>
                      <Select
                        value={editUser.advisoryClass ? "Yes" : "No"}
                        onChange={(value) =>
                          setEditUser({
                            ...editUser,
                            advisoryClass: value === "Yes" ? (editUser.advisoryClass || "BSCS ") : "",
                          })
                        }
                        options={["Yes", "No"]}
                      />
                    </div>
                  </div>
                  {editUser.advisoryClass ? (
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Advisory class</p>
                      <Input
                        value={editUser.advisoryClass}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            advisoryClass: e.target.value,
                          })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="px-5 pb-5 pt-4 border-t border-border gap-3 flex-col-reverse sm:flex-row">
            <DialogClose asChild>
              <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEditSave} className="w-full sm:w-auto">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteUserId}
        onOpenChange={(o) => !o && setDeleteUserId(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Delete Account</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              This action cannot be undone. The account will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="mr-1.5 size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!toggleUserId}
        onOpenChange={(o) => !o && setToggleUserId(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Confirm Status Change</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              {(() => {
                const user = users.find((u) => u.id === toggleUserId)
                if (!user) return ""
                return user.status === "Active"
                  ? `Deactivate "${user.name}"? They will lose access to the portal.`
                  : `Activate "${user.name}"? They will regain access to the portal.`
              })()}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={users.find((u) => u.id === toggleUserId)?.status === "Active" ? "destructive" : "default"}
              onClick={handleToggleConfirm}
            >
              {users.find((u) => u.id === toggleUserId)?.status === "Active" ? (
                <UserX className="mr-1.5 size-4" />
              ) : (
                <UserCheck className="mr-1.5 size-4" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
