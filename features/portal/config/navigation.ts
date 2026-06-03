import {
  Bell,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Database,
  FileArchive,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Link as LinkIcon,
  Megaphone,
  MessageSquareWarning,
  Network,
  UserCircle,
  Settings,
  Users,
  Calendar,
} from "lucide-react"

import type { Role } from "../data/portal-data"
import type { ModuleId, NavItem } from "../types/navigation"

export const roleNavigation: Record<Role, NavItem[]> = {
  student: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "my-classes", label: "My Classes", icon: Calendar },
    { id: "grades", label: "Grades & Report", icon: FileSpreadsheet },
    { id: "thesis", label: "Thesis Library", icon: BookOpen },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "feedback", label: "Feedback Tickets", icon: MessageSquareWarning },
    { id: "profile", label: "Profile", icon: UserCircle },
    { id: "availability", label: "Teacher Status", icon: CheckCircle2 },
    { id: "instructors", label: "Instructor Info", icon: Network },
    { id: "cso", label: "CSSO Records", icon: FileArchive },
    { id: "curriculum", label: "Curriculum", icon: GraduationCap },
    { id: "quick-links", label: "Quick Links", icon: LinkIcon },
  ],
  faculty: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "schedule", label: "Class Schedule", icon: CalendarDays },
    { id: "availability", label: "My Status", icon: CheckCircle2 },
    { id: "instructors", label: "Instructor Info", icon: Network },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "feedback", label: "Feedback Inbox", icon: MessageSquareWarning },
    { id: "cso", label: "CSSO Records", icon: FileArchive },
    { id: "quick-links", label: "Quick Links", icon: LinkIcon },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Admin Profile", icon: UserCircle },
    { id: "users", label: "User Management", icon: Users },
    { id: "academic", label: "Academic Setup", icon: Settings },
    { id: "classes", label: "Classes", icon: GraduationCap },
    { id: "thesis", label: "Thesis Management", icon: BookMarked },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "feedback", label: "Feedback Inbox", icon: MessageSquareWarning },
    { id: "availability", label: "Teacher Status", icon: CheckCircle2 },
    { id: "cso", label: "CSSO Reports", icon: FileArchive },
    { id: "audit", label: "Audit Logs", icon: Database },
  ],
}

export const initialModule: Record<Role, ModuleId> = {
  student: "overview",
  faculty: "overview",
  admin: "overview",
}
