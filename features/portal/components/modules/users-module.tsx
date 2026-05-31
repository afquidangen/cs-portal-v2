"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  type Role,
  type StudentStatus,
  type UserRecord,
  studentStatusOptions,
} from "../../data/portal-data"
import {
  Panel,
  SearchBox,
  Select,
  StatusBadge,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

const yearOptions = ["1", "2", "3", "4"]
const sectionOptions = ["A", "B", "C", "D"]
const curriculumOptions = [
  { value: "1", label: "Old Curriculum (CMO No. 25 s. 2015)" },
  { value: "2", label: "New Curriculum - Embedded Systems and AI" },
  { value: "3", label: "New Curriculum - Secure Software Engineering" },
]

const facultyTypeOptions = ["Regular", "Part Time"]
const titleOptions = ["", "PhD", "MIT", "DIT", "LPT"]
const sexOptions = ["Male", "Female"]

const advisoryClassOptions = [
  "BSCS 1A", "BSCS 1B", "BSCS 1C", "BSCS 1D",
  "BSCS 2A", "BSCS 2B", "BSCS 2C", "BSCS 2D",
  "BSCS 3A", "BSCS 3B", "BSCS 3C",
  "BSCS 4A", "BSCS 4B", "BSCS 4C",
]

function UserFormModal({
  editingUser,
  newUser,
  setNewUser,
  onSubmit,
  onClose,
}: {
  editingUser: UserRecord | null
  newUser: {
    firstName: string
    middleName: string
    lastName: string
    email: string
    role: Role
    year: string
    section: string
    studentStatus: StudentStatus
    curriculumId: string
    major: string
    facultyType: string
    title: string
    advisoryClass: string
    contactNumber: string
    sex: string
    birthday: string
    address: string
  }
  setNewUser: (fn: (prev: typeof newUser) => typeof newUser) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {editingUser ? "Edit user" : "New account"}
            </p>
            <h2 className="text-lg font-bold text-foreground">
              {editingUser ? "Edit User Account" : "Add New Account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={newUser.firstName}
              onChange={(e) => setNewUser((c) => ({ ...c, firstName: e.target.value }))}
              placeholder="First Name"
              className="h-9 rounded-lg"
              required
            />
            <Input
              value={newUser.middleName}
              onChange={(e) => setNewUser((c) => ({ ...c, middleName: e.target.value }))}
              placeholder="Middle Name"
              className="h-9 rounded-lg"
            />
            <Input
              value={newUser.lastName}
              onChange={(e) => setNewUser((c) => ({ ...c, lastName: e.target.value }))}
              placeholder="Last Name"
              className="h-9 rounded-lg"
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={newUser.email}
              onChange={(e) => setNewUser((c) => ({ ...c, email: e.target.value }))}
              placeholder={newUser.role === "student" ? "Email (@gmail)" : "Email (@ispsc.edu.ph)"}
              type="email"
              className="h-9 rounded-lg"
              required
            />
            <Select
              value={newUser.role}
              onChange={(value) => setNewUser((c) => ({ ...c, role: value as Role }))}
              options={["student", "faculty"]}
            />
            <Select
              value={newUser.sex}
              onChange={(value) => setNewUser((c) => ({ ...c, sex: value }))}
              options={sexOptions}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={newUser.contactNumber}
              onChange={(e) => setNewUser((c) => ({ ...c, contactNumber: e.target.value }))}
              placeholder="Contact Number"
              className="h-9 rounded-lg"
            />
            <Input
              value={newUser.birthday}
              onChange={(e) => setNewUser((c) => ({ ...c, birthday: e.target.value }))}
              placeholder="Birthday (YYYY-MM-DD)"
              className="h-9 rounded-lg"
            />
            <Input
              value={newUser.address}
              onChange={(e) => setNewUser((c) => ({ ...c, address: e.target.value }))}
              placeholder="Address"
              className="h-9 rounded-lg"
            />
          </div>
          {newUser.role === "student" ? (
            <div className="grid gap-3 md:grid-cols-4">
              <Select
                value={newUser.year}
                onChange={(value) => setNewUser((c) => ({ ...c, year: value }))}
                options={yearOptions}
              />
              <Select
                value={newUser.section}
                onChange={(value) => setNewUser((c) => ({ ...c, section: value }))}
                options={sectionOptions}
              />
              <Select
                value={newUser.studentStatus}
                onChange={(value) => setNewUser((c) => ({ ...c, studentStatus: value as StudentStatus }))}
                options={studentStatusOptions}
              />
              <Select
                value={newUser.curriculumId}
                onChange={(value) =>
                  setNewUser((c) => ({
                    ...c,
                    curriculumId: value,
                    major: value === "1" ? "" : curriculumOptions.find((o) => o.value === value)?.label.includes("AI") ? "Embedded Systems and AI Specialization" : "Secure Software Engineering Specialization",
                  }))
                }
                options={curriculumOptions.map((c) => c.value)}
              />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <Select
                value={newUser.facultyType}
                onChange={(value) => setNewUser((c) => ({ ...c, facultyType: value }))}
                options={facultyTypeOptions}
              />
              <Select
                value={newUser.title}
                onChange={(value) => setNewUser((c) => ({ ...c, title: value }))}
                options={titleOptions}
              />
              <Select
                value={newUser.advisoryClass}
                onChange={(value) => setNewUser((c) => ({ ...c, advisoryClass: value }))}
                options={advisoryClassOptions}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="size-4" />
              {editingUser ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UsersModule({ model }: PortalModuleProps) {
  const {
    filteredUsers,
    handleAddUser,
    handleUpdateUser,
    newUser,
    query,
    roleFilter,
    setNewUser,
    setQuery,
    setRoleFilter,
    handleUserStatusToggle,
    deleteUser,
    showAddUser,
    setShowAddUser,
    editingUser,
    setEditingUser,
  } = model

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<string | null>(null)

  function getFullName(user: typeof filteredUsers[0]) {
    return `${user.firstName} ${user.middleName} ${user.lastName}`
  }

  function openEdit(user: UserRecord) {
    setEditingUser(user)
    setNewUser(() => ({
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      year: String(user.year ?? "1"),
      section: user.section ?? "A",
      studentStatus: (user.studentStatus ?? "Regular") as StudentStatus,
      curriculumId: user.curriculumId ?? "1",
      major: user.major ?? "",
      facultyType: user.facultyType ?? "Regular",
      title: user.title ?? "",
      advisoryClass: user.advisoryClass ?? "",
      contactNumber: user.contactNumber ?? "",
      sex: user.sex ?? "Male",
      birthday: user.birthday ?? "",
      address: user.address ?? "",
    }))
    setShowAddUser(true)
  }

  return (
    <div className="space-y-5">
      {(showAddUser && editingUser) ? (
        <UserFormModal
          editingUser={editingUser}
          newUser={newUser}
          setNewUser={setNewUser}
          onSubmit={handleUpdateUser}
          onClose={() => { setShowAddUser(false); setEditingUser(null) }}
        />
      ) : showAddUser ? (
        <UserFormModal
          editingUser={null}
          newUser={newUser}
          setNewUser={setNewUser}
          onSubmit={handleAddUser}
          onClose={() => setShowAddUser(false)}
        />
      ) : null}
      <Panel
        title="List of Users"
        eyebrow="Search and manage users"
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
            <Button size="sm" onClick={() => {
              setEditingUser(null)
              setNewUser((prev) => ({
                ...prev,
                firstName: "", middleName: "", lastName: "", email: "",
                role: "student", year: "1", section: "A",
                studentStatus: "Regular" as StudentStatus, curriculumId: "1", major: "",
                facultyType: "Regular", title: "", advisoryClass: "",
                contactNumber: "", sex: "Male", birthday: "", address: "",
              }))
              setShowAddUser(true)
            }}>
              <Plus className="size-4" />
              Add Account
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-glacier text-xs uppercase text-slate-blue dark:border-lapis">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Year/Section</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glacier dark:divide-lapis">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 pr-4 font-medium text-abyss dark:text-quartz">
                    {user.id}
                  </td>
                  <td className="py-3 pr-4 text-abyss dark:text-quartz">
                    {getFullName(user)}
                  </td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                    {user.email}
                  </td>
                  <td className="py-3 pr-4 capitalize text-slate-blue dark:text-glacier">
                    {user.role}
                  </td>
                  <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                    {user.role === "student" ? `Year ${user.year} - ${user.section}` : user.advisoryClass || "-"}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge value={user.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      {confirmToggle === user.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-blue dark:text-glacier">Toggle?</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleUserStatusToggle(user.id)
                              setConfirmToggle(null)
                            }}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmToggle(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmToggle(user.id)}
                        >
                          Toggle
                        </Button>
                      )}
                      {confirmDelete === user.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-rose-600">Delete?</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              deleteUser(user.id)
                              setConfirmDelete(null)
                            }}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => setConfirmDelete(user.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
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
