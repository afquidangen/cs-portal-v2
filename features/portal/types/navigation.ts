import type { LucideIcon } from "lucide-react"

export type ModuleId =
  | "overview"
  | "grades"
  | "thesis"
  | "announcements"
  | "feedback"
  | "availability"
  | "instructors"
  | "cso"
  | "schedule"
  | "curriculum"
  | "users"
  | "academic"
  | "classes"
  | "audit"

export type NavItem = {
  id: ModuleId
  label: string
  icon: LucideIcon
}
