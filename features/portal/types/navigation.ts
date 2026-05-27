import type { LucideIcon } from "lucide-react"

export type ModuleId =
  | "overview"
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
  | "users"
  | "academic"
  | "templates"
  | "classes"
  | "audit"

export type NavItem = {
  id: ModuleId
  label: string
  icon: LucideIcon
}
