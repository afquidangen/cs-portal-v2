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

export type NavItem = {
  id: ModuleId
  label: string
  icon: LucideIcon
}
