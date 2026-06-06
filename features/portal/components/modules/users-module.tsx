"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
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
import type { UserRecord } from "../../data/portal-data"
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
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [addRole, setAddRole] = useState("student")

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  )

  const curriculumOptions = Array.from(
    new Set(curricula.map((c) => c.name))
  )

  const sectionOptions = useMemo(() => {
    const label = YEAR_LABELS[newUser.year]
    if (!label) return []
    const entry = yearSections.find((ys) => ys.year === label)
    return entry?.sections ?? []
  }, [newUser.year, yearSections])

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
    handleUpdateUser({ ...editUser, name: fullName || editUser.name })
    if (editUser.password) {
      try {
        const key = "comsite-custom-accounts"
        const existing = JSON.parse(window.localStorage.getItem(key) || "[]") as Array<Record<string, string>>
        const idx = existing.findIndex((a) => a.id === editUser.id)
        if (idx !== -1) {
          existing[idx].password = editUser.password
        } else {
          const routeMap: Record<string, string> = { student: "/student", faculty: "/faculty", admin: "/admin" }
          existing.push({
            email: editUser.email,
            password: editUser.password,
            role: editUser.role,
            name: fullName || editUser.name,
            title: editUser.role === "student"
              ? `BSCS ${editUser.year ?? ""}${editUser.section ?? ""} - ${editUser.studentType ?? "Regular"} Student`
              : editUser.role === "faculty"
                ? `Instructor - Computer Science`
                : "System Administrator - CS Department",
            id: editUser.id,
            route: routeMap[editUser.role] || "/student",
          })
        }
        window.localStorage.setItem(key, JSON.stringify(existing))
      } catch { /* ignore */ }
    }
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Total Accounts", value: stats.total, icon: Users },
          { label: "Active", value: stats.active, icon: UserCheck },
          { label: "Inactive", value: stats.inactive, icon: UserX },
          { label: "Students", value: stats.students, icon: ShieldCheck },
          { label: "Faculty", value: stats.faculty, icon: Users },
          { label: "Admins", value: stats.admins, icon: ShieldCheck },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
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
        title={`Users (${filteredUsers.length})`}
        eyebrow="Search and filter"
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchBox
              value={query}
              onChange={(v) => {
                setQuery(v)
                setPage(1)
              }}
              placeholder="Search name, email, or ID"
            />
            <Select
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v)
                setPage(1)
              }}
              options={["All", "student", "faculty", "admin"]}
            />
            <Button
              type="button"
              onClick={() => {
                setAddRole("student")
                setAddOpen(true)
              }}
              className="rounded-2xl"
            >
              <Plus className="size-4" />
              Add Account
            </Button>
          </div>
        }
      >
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
                <div key={user.id} className="rounded-2xl border border-border bg-card p-4">
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
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-border">
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
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
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
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Password *</p>
                  <Input
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((current) => ({
                        ...current,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter password"
                    type="text"
                    required
                  />
                </div>
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
              </div>

              {addRole === "student" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-sm font-medium text-foreground">Year</p>
                      <Select
                        value={newUser.year}
                        onChange={(value) =>
                          setNewUser((current) => ({ ...current, year: value }))
                        }
                        options={["1", "2", "3", "4"]}
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
                        onChange={(value) =>
                          setNewUser((current) => ({
                            ...current,
                            curriculum: value,
                          }))
                        }
                        options={curriculumOptions}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {addRole === "faculty" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faculty Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                        placeholder="BSCS 3A"
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
                    <div>
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
                <Input
                  value={editUser.password ?? ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, password: e.target.value })
                  }
                  placeholder="Leave blank to keep current"
                  type="text"
                />
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
                      <p className="mb-1.5 text-sm font-medium text-foreground">Year</p>
                      <Select
                        value={String(editUser.year ?? "1")}
                        onChange={(value) =>
                          setEditUser({ ...editUser, year: Number(value) })
                        }
                        options={["1", "2", "3", "4"]}
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
                        value={editUser.curriculum ?? "Old Curriculum"}
                        onChange={(value) =>
                          setEditUser({ ...editUser, curriculum: value })
                        }
                        options={curriculumOptions}
                      />
                    </div>
                  </div>
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
                    <div className="sm:col-span-2">
                      <p className="mb-1.5 text-sm font-medium text-foreground">Advisory class</p>
                      <Input
                        value={editUser.advisoryClass ?? ""}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            advisoryClass: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
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
