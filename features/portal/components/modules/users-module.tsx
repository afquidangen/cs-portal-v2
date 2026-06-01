"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Panel,
  SearchBox,
  Select,
  StatusBadge,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function UsersModule({ model }: PortalModuleProps) {
  const {
    confirmAndDeleteUser,
    confirmAndToggleUserStatus,
    curricula,
    filteredUsers,
    handleAddUser,
    newUser,
    query,
    roleFilter,
    selectedUserType,
    setNewUser,
    setQuery,
    setRoleFilter,
    setSelectedUserType,
    setShowAddUserForm,
    showAddUserForm,
  } = model

  const visibleUsers = filteredUsers.filter((user) => user.role !== "admin")

  const curriculumOptions = Array.from(
    new Set(curricula.map((curriculum) => curriculum.major))
  )

  return (
    <div className="space-y-5">
      <Panel title="Account Sections" eyebrow="Student and faculty only">
        <div className="flex flex-wrap gap-2">
          {(["student", "faculty"] as const).map((roleName) => (
            <Button
              key={roleName}
              type="button"
              variant={selectedUserType === roleName ? "default" : "outline"}
              onClick={() => {
                setSelectedUserType(roleName)
                setRoleFilter(roleName)
                setNewUser((current) => ({ ...current, role: roleName }))
                setShowAddUserForm(false)
              }}
              className="rounded-xl"
            >
              {roleName === "student" ? "Students" : "Faculty"}
            </Button>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddUserForm((current) => !current)}
            className="rounded-xl"
          >
            <Plus className="size-4" />
            Add {selectedUserType === "student" ? "Student" : "Faculty"}
          </Button>
        </div>

        {showAddUserForm ? (
          <form onSubmit={handleAddUser} className="mt-4 grid gap-3 md:grid-cols-3">
            <Input
              value={newUser.firstName}
              onChange={(event) =>
                setNewUser((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              placeholder="First name"
              className="h-10 rounded-2xl"
            />

            <Input
              value={newUser.middleName}
              onChange={(event) =>
                setNewUser((current) => ({
                  ...current,
                  middleName: event.target.value,
                }))
              }
              placeholder="Middle name"
              className="h-10 rounded-2xl"
            />

            <Input
              value={newUser.lastName}
              onChange={(event) =>
                setNewUser((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              placeholder="Last name"
              className="h-10 rounded-2xl"
            />

            <Input
              value={newUser.email}
              onChange={(event) =>
                setNewUser((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder={
                selectedUserType === "student"
                  ? "student@gmail.com"
                  : "faculty@ispsc.edu"
              }
              type="email"
              className="h-10 rounded-2xl"
            />

            {selectedUserType === "student" ? (
              <>
                <Select
                  value={newUser.year}
                  onChange={(value) =>
                    setNewUser((current) => ({ ...current, year: value }))
                  }
                  options={["1", "2", "3", "4"]}
                />

                <Input
                  value={newUser.section}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      section: event.target.value,
                    }))
                  }
                  placeholder="Section"
                  className="h-10 rounded-2xl"
                />

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
              </>
            ) : (
              <>
                <Input
                  value={newUser.advisoryClass}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      advisoryClass: event.target.value,
                    }))
                  }
                  placeholder="Advisory class"
                  className="h-10 rounded-2xl"
                />

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
              </>
            )}

            <Button type="submit" className="rounded-2xl">
              <Plus className="size-4" />
              Save Account
            </Button>
          </form>
        ) : null}
      </Panel>

      <Panel
        title="List of Users"
        eyebrow="Search and sort by role"
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search username or email"
            />
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              options={["All", "student", "faculty"]}
            />
          </div>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  Name
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
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-card">
              {visibleUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{user.email}</td>
                  <td className="px-4 py-3 capitalize text-foreground/80">
                    {user.role}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {user.role === "student"
                      ? `${user.year ?? "-"}${user.section ?? ""} - ${user.studentType ?? "Regular"} - ${user.curriculum ?? "No curriculum"}`
                      : `${user.academicTitle ?? "Title"} - ${user.employmentType ?? "Regular"} - ${user.advisoryClass ?? "No advisory"}`}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={user.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => confirmAndToggleUserStatus(user.id)}
                      >
                        Toggle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => confirmAndDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}