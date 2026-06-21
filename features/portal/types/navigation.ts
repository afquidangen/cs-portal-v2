import type { LucideIcon } from "lucide-react"

export type ModuleId =
  | "overview"
  | "my-classes"
  | "grades"
  | "thesis"
  | "announcements"
  | "feedback"
  | "seminars"
  | "availability"
  | "instructors"
  | "cso"
  | "schedule"
  | "curriculum"
  | "quick-links"
  | "grade-history"
  | "users"
  | "academic"
  | "profile"
  | "templates"
  | "classes"
  | "audit"
  | "irregular-students"
  | "student-roster"
  | "manage-grades"
  | "grading-admin"
  | "semester-admin"
  | "semester-history"
  | "admin-semester-archive"
  | "faculty-semester-archive"

export type NavItem = {
  id: ModuleId
  label: string
  icon: LucideIcon
}
