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
  } = model

  const [editUser, setEditUser] = useState<UserRecord | null>(null)
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
    new Set(curricula.map((c) => c.major))
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
    handleUpdateUser({ ...editUser, name: fullName || editUser.name })
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
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Account
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Role
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                      Details
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
                      <td className="px-4 py-3 text-foreground/80">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 capitalize text-foreground/80">
                        {user.role}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-foreground/80">
                        {user.role === "student"
                          ? `${user.year ?? "-"}${user.section ?? ""} \u00B7 ${user.studentType ?? "Regular"} \u00B7 ${user.curriculum ?? "N/A"}`
                          : `${user.academicTitle ?? "N/A"} \u00B7 ${user.employmentType ?? "Regular"} \u00B7 ${user.advisoryClass ?? "No advisory"}`}
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
        <DialogContent className="max-w-lg">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground">Add Account</DialogTitle>
              <DialogDescription className="pt-1 text-muted-foreground">
                Create a new user account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select
                  value={addRole}
                  onChange={(value) => {
                    setAddRole(value)
                    setNewUser((current) => ({ ...current, role: value as "student" | "faculty" | "admin" }))
                  }}
                  options={["student", "faculty", "admin"]}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">First name *</label>
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Middle name</label>
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Last name *</label>
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email *</label>
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password *</label>
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

              {addRole === "student" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Year</label>
                    <Select
                      value={newUser.year}
                      onChange={(value) =>
                        setNewUser((current) => ({ ...current, year: value }))
                      }
                      options={["1", "2", "3", "4"]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Section</label>
                    <Input
                      value={newUser.section}
                      onChange={(e) =>
                        setNewUser((current) => ({
                          ...current,
                          section: e.target.value,
                        }))
                      }
                      placeholder="BSCS 3A"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Student type</label>
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Curriculum</label>
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
              ) : null}

              {addRole === "faculty" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Advisory class</label>
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Employment type</label>
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Academic title</label>
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
              ) : null}
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                <Plus className="mr-1.5 size-4" /> Save Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Edit User</DialogTitle>
            <DialogDescription className="pt-1 text-muted-foreground">
              Update account details for {editUser?.name}
            </DialogDescription>
          </DialogHeader>

          {editUser ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">First name</label>
                  <Input
                    value={editUser.firstName ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Middle name</label>
                  <Input
                    value={editUser.middleName ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, middleName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Last name</label>
                  <Input
                    value={editUser.lastName ?? ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    value={editUser.email}
                    onChange={(e) =>
                      setEditUser({ ...editUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Status</label>
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
                {editUser.role === "student" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Year</label>
                      <Select
                        value={String(editUser.year ?? "1")}
                        onChange={(value) =>
                          setEditUser({ ...editUser, year: Number(value) })
                        }
                        options={["1", "2", "3", "4"]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Section</label>
                      <Input
                        value={editUser.section ?? ""}
                        onChange={(e) =>
                          setEditUser({ ...editUser, section: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Student type</label>
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
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Curriculum</label>
                      <Input
                        value={editUser.curriculum ?? ""}
                        onChange={(e) =>
                          setEditUser({
                            ...editUser,
                            curriculum: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                ) : editUser.role === "faculty" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Academic title</label>
                      <Select
                        value={editUser.academicTitle ?? "MIT"}
                        onChange={(value) =>
                          setEditUser({ ...editUser, academicTitle: value })
                        }
                        options={["PhD", "MIT", "DIT", "LPT"]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Employment type</label>
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
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Advisory class</label>
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
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteUserId}
        onOpenChange={(o) => !o && setDeleteUserId(null)}
      >
        <DialogContent className="max-w-sm">
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
        <DialogContent className="max-w-sm">
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
