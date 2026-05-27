"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import type { Role } from "../../data/portal-data"
import {
  Panel,
  SearchBox,
  Select,
  StatusBadge,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function UsersModule({ model }: PortalModuleProps) {
  const {
    filteredUsers,
    handleAddUser,
    newUser,
    query,
    roleFilter,
    setNewUser,
    setQuery,
    setRoleFilter,
    setUsers,
  } = model

  return (
    <div className="space-y-5">
      <Panel title="Add Account" eyebrow="Role-based registration">
        <form onSubmit={handleAddUser} className="grid gap-3 md:grid-cols-4">
          <Input
            value={newUser.name}
            onChange={(event) =>
              setNewUser((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Full name"
            className="h-9 rounded-lg"
          />
          <Input
            value={newUser.email}
            onChange={(event) =>
              setNewUser((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="Email"
            type="email"
            className="h-9 rounded-lg"
          />
          <Select
            value={newUser.role}
            onChange={(value) =>
              setNewUser((current) => ({
                ...current,
                role: value as Role,
              }))
            }
            options={["student", "faculty", "admin"]}
          />
          <Button type="submit">
            <Plus className="size-4" />
            Add Account
          </Button>
        </form>
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
              options={["All", "student", "faculty", "admin"]}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {user.name}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{user.email}</td>
                  <td className="py-3 pr-4 capitalize text-slate-600">
                    {user.role}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge value={user.status} />
                  </td>
                  <td className="py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setUsers((current) =>
                          current.map((item) =>
                            item.id === user.id
                              ? {
                                  ...item,
                                  status:
                                    item.status === "Active"
                                      ? "Inactive"
                                      : "Active",
                                }
                              : item
                          )
                        )
                      }
                    >
                      Toggle
                    </Button>
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
