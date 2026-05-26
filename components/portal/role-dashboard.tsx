"use client"

import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Database,
  Download,
  FileArchive,
  FileDown,
  FileSpreadsheet,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Network,
  Plus,
  Presentation,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserCheck,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  type Announcement,
  type AvailabilityStatus,
  type FeedbackTicket,
  type GradeRecord,
  type Role,
  type SeminarRecord,
  type ThesisRecord,
  type TicketStatus,
  type UserRecord,
  announcementsSeed,
  auditLogsSeed,
  availabilityOptions,
  classRosterSeed,
  csoReportsSeed,
  curriculumSeed,
  facultySeed,
  feedbackSeed,
  gradeSeed,
  quickLinksSeed,
  roleProfiles,
  scheduleSeed,
  semestersSeed,
  seminarSeed,
  subjectsSeed,
  thesisSeed,
  ticketStatusOptions,
  usersSeed,
} from "@/lib/portal-data"
import { cn } from "@/lib/utils"

type ModuleId =
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

type NavItem = {
  id: ModuleId
  label: string
  icon: LucideIcon
}

const roleNavigation: Record<Role, NavItem[]> = {
  student: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "grades", label: "Grades & Report", icon: FileSpreadsheet },
    { id: "thesis", label: "Thesis Library", icon: BookOpen },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "feedback", label: "Feedback Tickets", icon: MessageSquareWarning },
    { id: "seminars", label: "Seminars", icon: Presentation },
    { id: "availability", label: "Teacher Status", icon: CheckCircle2 },
    { id: "instructors", label: "Instructor Info", icon: Network },
    { id: "cso", label: "CSSO Records", icon: FileArchive },
    { id: "curriculum", label: "Curriculum", icon: GraduationCap },
    { id: "quick-links", label: "Quick Links", icon: LinkIcon },
  ],
  faculty: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "classes", label: "Manage Class", icon: ClipboardCheck },
    { id: "schedule", label: "Class Schedule", icon: CalendarDays },
    { id: "grades", label: "Manage Grades", icon: FileSpreadsheet },
    { id: "seminars", label: "My Events", icon: Presentation },
    { id: "feedback", label: "Assigned Inbox", icon: Inbox },
    { id: "availability", label: "My Availability", icon: UserCheck },
    { id: "instructors", label: "Instructor Info", icon: Network },
    { id: "templates", label: "Templates", icon: FileDown },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "academic", label: "Academic Setup", icon: Settings },
    { id: "templates", label: "Templates & Uploads", icon: Upload },
    { id: "classes", label: "Classes", icon: GraduationCap },
    { id: "thesis", label: "Thesis Management", icon: BookMarked },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "feedback", label: "Feedback Inbox", icon: MessageSquareWarning },
    { id: "seminars", label: "Seminars", icon: Presentation },
    { id: "availability", label: "Teacher Status", icon: CheckCircle2 },
    { id: "cso", label: "CSSO Reports", icon: FileArchive },
    { id: "audit", label: "Audit Logs", icon: Database },
  ],
}

const statusColor: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Consultation Only": "bg-sky-50 text-sky-700 border-sky-200",
  "In Class": "bg-amber-50 text-amber-700 border-amber-200",
  "Out of Office": "bg-rose-50 text-rose-700 border-rose-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "In Progress": "bg-sky-50 text-sky-700 border-sky-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  High: "bg-rose-50 text-rose-700 border-rose-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-slate-50 text-slate-700 border-slate-200",
  Closed: "bg-slate-50 text-slate-700 border-slate-200",
}

const initialModule: Record<Role, ModuleId> = {
  student: "overview",
  faculty: "overview",
  admin: "overview",
}

function useStoredState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        setValue(JSON.parse(stored) as T)
      }
    } finally {
      setReady(true)
    }
  }, [key])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, ready, value])

  return [value, setValue]
}

function calculateFinalGrade(record: GradeRecord) {
  return Number(((record.midterm + record.finalTerm) / 2).toFixed(2))
}

function gradeRemarks(grade: number) {
  if (grade <= 1.5) return "Dean's List pace"
  if (grade <= 3) return "Passed"
  return "Needs remediation"
}

function downloadFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function csvEscape(value: string | number | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        statusColor[value] ?? "border-slate-200 bg-slate-50 text-slate-700"
      )}
    >
      {value}
    </span>
  )
}

function Panel({
  title,
  eyebrow,
  actions,
  children,
  className,
}: {
  title: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {title}
          </h3>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky"
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            colors[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg pl-9"
      />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
    />
  )
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label?: string
}) {
  return (
    <label className="grid gap-1 text-sm text-slate-600">
      {label ? <span>{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export function RoleDashboard({ role }: { role: Role }) {
  const router = useRouter()
  const [activeModule, setActiveModule] = useState<ModuleId>(
    initialModule[role]
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [users, setUsers] = useStoredState<UserRecord[]>(
    "comsite-users",
    usersSeed
  )
  const [faculty, setFaculty] = useStoredState("comsite-faculty", facultySeed)
  const [grades, setGrades] = useStoredState("comsite-grades", gradeSeed)
  const [theses, setTheses] = useStoredState("comsite-theses", thesisSeed)
  const [seminars, setSeminars] = useStoredState(
    "comsite-seminars",
    seminarSeed
  )
  const [tickets, setTickets] = useStoredState(
    "comsite-feedback",
    feedbackSeed
  )
  const [announcements, setAnnouncements] = useStoredState(
    "comsite-announcements",
    announcementsSeed
  )
  const [roster, setRoster] = useStoredState(
    "comsite-class-roster",
    classRosterSeed
  )

  const [roleFilter, setRoleFilter] = useState("All")
  const [thesisYearFilter, setThesisYearFilter] = useState("All")
  const [thesisCategoryFilter, setThesisCategoryFilter] = useState("All")
  const [uploadName, setUploadName] = useState("No file selected")
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student" as Role,
  })
  const [feedbackDraft, setFeedbackDraft] = useState({
    category: "Academic",
    subject: "",
    description: "",
    anonymous: false,
  })
  const [eventDraft, setEventDraft] = useState({
    title: "",
    speaker: "",
    date: "",
    location: "",
    capacity: "30",
  })
  const [thesisDraft, setThesisDraft] = useState({
    title: "",
    authors: "",
    year: "2026",
    category: "Software Engineering",
    adviser: "",
    abstract: "",
  })
  const [announcementDraft, setAnnouncementDraft] = useState({
    title: "",
    content: "",
    audience: "All Users",
    priority: "Medium" as Announcement["priority"],
  })
  const [myFacultyStatus, setMyFacultyStatus] =
    useState<AvailabilityStatus>("Available")
  const [myFacultyNotes, setMyFacultyNotes] = useState(
    "Available for consultation."
  )

  const profile = roleProfiles[role]
  const navigation = roleNavigation[role]

  const userStats = useMemo(
    () => ({
      students: users.filter((user) => user.role === "student").length,
      faculty: users.filter((user) => user.role === "faculty").length,
      admins: users.filter((user) => user.role === "admin").length,
    }),
    [users]
  )

  const studentGrades = useMemo(
    () => grades.filter((grade) => grade.studentId === roleProfiles.student.id),
    [grades]
  )

  const gradeAverage = useMemo(() => {
    if (!studentGrades.length) return "N/A"
    const average =
      studentGrades.reduce(
        (sum, grade) => sum + calculateFinalGrade(grade),
        0
      ) / studentGrades.length
    return average.toFixed(2)
  }, [studentGrades])

  const filteredTheses = useMemo(() => {
    const search = query.toLowerCase()
    return theses.filter((thesis) => {
      const matchesSearch = [
        thesis.title,
        thesis.authors,
        thesis.category,
        thesis.adviser,
        thesis.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
      const matchesYear =
        thesisYearFilter === "All" || String(thesis.year) === thesisYearFilter
      const matchesCategory =
        thesisCategoryFilter === "All" ||
        thesis.category === thesisCategoryFilter
      return matchesSearch && matchesYear && matchesCategory
    })
  }, [query, theses, thesisCategoryFilter, thesisYearFilter])

  const filteredFaculty = useMemo(() => {
    const search = query.toLowerCase()
    return faculty.filter((member) =>
      [member.name, member.position, member.role, member.status, member.notes]
        .join(" ")
        .toLowerCase()
        .includes(search)
    )
  }, [faculty, query])

  const filteredUsers = useMemo(() => {
    const search = query.toLowerCase()
    return users.filter((user) => {
      const matchesSearch = [user.name, user.email, user.id, user.role]
        .join(" ")
        .toLowerCase()
        .includes(search)
      const matchesRole = roleFilter === "All" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [query, roleFilter, users])

  const studentTickets = tickets.filter(
    (ticket) =>
      ticket.studentId === roleProfiles.student.id ||
      ticket.studentName === roleProfiles.student.name
  )

  const selectedNav = navigation.find((item) => item.id === activeModule)
  const currentTitle = selectedNav?.label ?? "Dashboard"

  function selectModule(moduleId: ModuleId) {
    setActiveModule(moduleId)
    setQuery("")
    setSidebarOpen(false)
  }

  function handleLogout() {
    router.push("/")
  }

  function downloadGradeReport() {
    const rows = [
      ["Subject", "Code", "Units", "Midterm", "Final Term", "Final Grade"],
      ...studentGrades.map((grade) => [
        grade.subject,
        grade.code,
        grade.units,
        grade.midterm,
        grade.finalTerm,
        calculateFinalGrade(grade),
      ]),
    ]
    downloadFile(
      "student-grade-report.csv",
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadGradeTemplate() {
    const rows = [
      ["Student ID", "Student Name", "Subject Code", "Midterm", "Final Term"],
      ...roster.map((student) => [student.id, student.name, "CS311", "", ""]),
    ]
    downloadFile(
      "grade-template.csv",
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadUserTemplate(roleName: Role) {
    const rows = [
      ["Name", "Email", "Role", "Course", "Year", "Section"],
      ["Sample User", `${roleName}@school.edu`, roleName, "BSCS", "3", "A"],
    ]
    downloadFile(
      `${roleName}-template.csv`,
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadAttendees(event: SeminarRecord) {
    const rows = [
      ["Event", "Student ID"],
      ...event.enlistedStudentIds.map((studentId) => [event.title, studentId]),
    ]
    downloadFile(
      `${event.id}-attendees.csv`,
      rows.map((row) => row.map(csvEscape).join(",")).join("\n")
    )
  }

  function downloadThesisDetails(thesis: ThesisRecord) {
    downloadFile(
      `${thesis.id}-details.txt`,
      [
        thesis.title,
        `Authors: ${thesis.authors}`,
        `Year: ${thesis.year}`,
        `Category: ${thesis.category}`,
        `Adviser: ${thesis.adviser}`,
        "",
        thesis.abstract,
      ].join("\n"),
      "text/plain"
    )
  }

  function updateGrade(
    id: string,
    field: "midterm" | "finalTerm",
    value: string
  ) {
    const numericValue = Number(value)
    setGrades((current) =>
      current.map((grade) =>
        grade.id === id
          ? {
              ...grade,
              [field]: Number.isNaN(numericValue) ? 0 : numericValue,
              updatedAt: "May 26, 2026",
            }
          : grade
      )
    )
  }

  function updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    resolution?: string
  ) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              resolution: resolution ?? ticket.resolution,
            }
          : ticket
      )
    )
  }

  function updateFacultyStatus(
    facultyId: string,
    status: AvailabilityStatus,
    notes?: string
  ) {
    setFaculty((current) =>
      current.map((member) =>
        member.id === facultyId
          ? {
              ...member,
              status,
              notes: notes ?? member.notes,
            }
          : member
      )
    )
  }

  function handleAddUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) return
    setUsers((current) => [
      {
        id: `USR-${String(current.length + 1).padStart(3, "0")}`,
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        course: newUser.role === "student" ? "BSCS" : undefined,
        year: newUser.role === "student" ? 1 : undefined,
        section: newUser.role === "student" ? "A" : undefined,
        position: newUser.role === "faculty" ? "Instructor" : undefined,
        status: "Active",
      },
      ...current,
    ])
    setNewUser({ name: "", email: "", role: "student" })
  }

  function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!feedbackDraft.subject.trim() || !feedbackDraft.description.trim()) {
      return
    }
    const id = `FB-${1000 + tickets.length + 1}`
    setTickets((current) => [
      {
        id,
        studentId: feedbackDraft.anonymous ? undefined : roleProfiles.student.id,
        studentName: feedbackDraft.anonymous
          ? "Anonymous"
          : roleProfiles.student.name,
        category: feedbackDraft.category,
        subject: feedbackDraft.subject.trim(),
        description: feedbackDraft.description.trim(),
        status: "Pending",
        submittedAt: "May 26, 2026",
        assignedTo: "Admin",
        anonymous: feedbackDraft.anonymous,
      },
      ...current,
    ])
    setFeedbackDraft({
      category: "Academic",
      subject: "",
      description: "",
      anonymous: false,
    })
  }

  function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!eventDraft.title.trim() || !eventDraft.date.trim()) return
    setSeminars((current) => [
      {
        id: `SEM-${String(current.length + 1).padStart(3, "0")}`,
        title: eventDraft.title.trim(),
        speaker: eventDraft.speaker.trim() || "To be announced",
        date: eventDraft.date.trim(),
        location: eventDraft.location.trim() || "CS Department",
        description: "New seminar created from the admin event manager.",
        capacity: Number(eventDraft.capacity) || 30,
        enlistedStudentIds: [],
        host: roleProfiles.faculty.name,
        status: "Active",
      },
      ...current,
    ])
    setEventDraft({
      title: "",
      speaker: "",
      date: "",
      location: "",
      capacity: "30",
    })
  }

  function handleCreateThesis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!thesisDraft.title.trim() || !thesisDraft.authors.trim()) return
    setTheses((current) => [
      {
        id: `TH-${String(current.length + 1).padStart(3, "0")}`,
        title: thesisDraft.title.trim(),
        authors: thesisDraft.authors.trim(),
        year: Number(thesisDraft.year) || 2026,
        category: thesisDraft.category.trim(),
        adviser: thesisDraft.adviser.trim() || "For assignment",
        abstract:
          thesisDraft.abstract.trim() ||
          "Abstract will be supplied after manuscript review.",
        tags: thesisDraft.category
          .split(" ")
          .filter(Boolean)
          .slice(0, 3),
      },
      ...current,
    ])
    setThesisDraft({
      title: "",
      authors: "",
      year: "2026",
      category: "Software Engineering",
      adviser: "",
      abstract: "",
    })
  }

  function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!announcementDraft.title.trim() || !announcementDraft.content.trim()) {
      return
    }
    setAnnouncements((current) => [
      {
        id: `ANN-${String(current.length + 1).padStart(3, "0")}`,
        title: announcementDraft.title.trim(),
        content: announcementDraft.content.trim(),
        date: "May 26, 2026",
        audience: announcementDraft.audience,
        priority: announcementDraft.priority,
      },
      ...current,
    ])
    setAnnouncementDraft({
      title: "",
      content: "",
      audience: "All Users",
      priority: "Medium",
    })
  }

  function handleEnlist(eventId: string) {
    const studentId = roleProfiles.student.id
    setSeminars((current) =>
      current.map((event) => {
        if (event.id !== eventId) return event
        const alreadyEnlisted = event.enlistedStudentIds.includes(studentId)
        if (alreadyEnlisted) {
          return {
            ...event,
            enlistedStudentIds: event.enlistedStudentIds.filter(
              (id) => id !== studentId
            ),
          }
        }
        if (event.enlistedStudentIds.length >= event.capacity) return event
        return {
          ...event,
          enlistedStudentIds: [...event.enlistedStudentIds, studentId],
        }
      })
    )
  }

  function handleFacultySelfStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateFacultyStatus("FAC-014", myFacultyStatus, myFacultyNotes)
  }

  function renderOverview() {
    if (role === "admin") {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              label="Students"
              value={String(userStats.students)}
              icon={GraduationCap}
              tone="sky"
            />
            <Metric
              label="Faculty"
              value={String(userStats.faculty)}
              icon={Users}
              tone="emerald"
            />
            <Metric
              label="Thesis Records"
              value={String(theses.length)}
              icon={BookMarked}
              tone="amber"
            />
            <Metric
              label="Open Tickets"
              value={String(tickets.filter((t) => t.status !== "Resolved").length)}
              icon={MessageSquareWarning}
              tone="rose"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Priority System Modules" eyebrow="PDF roadmap">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "Real-time grade notification updates",
                  "Online library for existing thesis",
                  "Announcements and CS updates",
                  "Instructor information and organizational chart",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-800">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Recent Audit Logs" eyebrow="Traceability">
              <div className="space-y-3">
                {auditLogsSeed.map((log) => (
                  <div key={log.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-900">
                      {log.action}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.actor} - {log.time}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )
    }

    if (role === "faculty") {
      const assignedTickets = tickets.filter(
        (ticket) => ticket.assignedTo === roleProfiles.faculty.name
      )
      return (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              label="Handled Classes"
              value="4"
              icon={ClipboardList}
              tone="sky"
            />
            <Metric
              label="Students Enrolled"
              value={String(roster.filter((student) => student.enrolled).length)}
              icon={Users}
              tone="emerald"
            />
            <Metric
              label="Pending Tickets"
              value={String(assignedTickets.length)}
              icon={Inbox}
              tone="amber"
            />
            <Metric
              label="Hosted Events"
              value={
                String(
                  seminars.filter(
                    (event) => event.host === roleProfiles.faculty.name
                  ).length
                )
              }
              icon={Presentation}
              tone="rose"
            />
          </div>
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            {renderFacultyAvailabilityPanel()}
            {renderSchedulePanel()}
          </div>
          {renderFacultyGradesPanel()}
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Current GWA"
            value={gradeAverage}
            icon={BarChart3}
            tone="emerald"
          />
          <Metric
            label="Enrolled Subjects"
            value={String(studentGrades.length)}
            icon={BookOpen}
            tone="sky"
          />
          <Metric
            label="Open Tickets"
            value={String(studentTickets.filter((t) => t.status !== "Resolved").length)}
            icon={MessageSquareWarning}
            tone="amber"
          />
          <Metric
            label="Upcoming Events"
            value={String(seminars.filter((event) => event.status === "Active").length)}
            icon={Presentation}
            tone="rose"
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          {renderSchedulePanel()}
          <Panel title="Grade Notifications" eyebrow="Real-time updates">
            <div className="space-y-3">
              {studentGrades.slice(0, 3).map((grade) => (
                <div
                  key={grade.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {grade.code} final grade posted
                    </p>
                    <StatusBadge value={gradeRemarks(calculateFinalGrade(grade))} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {grade.subject} - {grade.updatedAt}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        {renderAnnouncementsPanel()}
      </div>
    )
  }

  function renderSchedulePanel() {
    return (
      <Panel title="Weekly Schedule" eyebrow="Classes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Day</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Instructor</th>
                <th className="py-2">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scheduleSeed.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {item.day}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{item.time}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.subject}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {item.instructor}
                  </td>
                  <td className="py-3 text-slate-600">{item.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    )
  }

  function renderAnnouncementsPanel() {
    return (
      <Panel
        title="Announcements and CS Updates"
        eyebrow="Department notices"
        actions={
          role === "admin" ? (
            <Button size="sm" onClick={() => selectModule("announcements")}>
              <Plus className="size-4" />
              Add Notice
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {announcement.title}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {announcement.content}
                  </p>
                </div>
                <StatusBadge value={announcement.priority} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {announcement.date} - {announcement.audience}
              </p>
            </article>
          ))}
        </div>
      </Panel>
    )
  }

  function renderGrades() {
    if (role === "faculty") return renderFacultyGradesPanel(true)

    return (
      <Panel
        title="Curriculum Plan, Grade Guide, and Downloadable Report"
        eyebrow="Student records"
        actions={
          <Button size="sm" onClick={downloadGradeReport}>
            <Download className="size-4" />
            Download CSV
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Units</th>
                <th className="py-2 pr-4">Midterm</th>
                <th className="py-2 pr-4">Final Term</th>
                <th className="py-2 pr-4">Final Grade</th>
                <th className="py-2">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentGrades.map((grade) => {
                const finalGrade = calculateFinalGrade(grade)
                return (
                  <tr key={grade.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">
                        {grade.subject}
                      </p>
                      <p className="text-xs text-slate-500">{grade.code}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{grade.units}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {grade.midterm.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {grade.finalTerm.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-950">
                      {finalGrade.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <StatusBadge value={gradeRemarks(finalGrade)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    )
  }

  function renderFacultyGradesPanel(full = false) {
    return (
      <Panel
        title="Manage Grades"
        eyebrow="Midterm and final term encoding"
        actions={
          <Button size="sm" onClick={downloadGradeTemplate}>
            <Download className="size-4" />
            Template
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Midterm</th>
                <th className="py-2 pr-4">Final Term</th>
                <th className="py-2 pr-4">Computed</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(full ? grades : grades.slice(0, 4)).map((grade) => {
                const finalGrade = calculateFinalGrade(grade)
                return (
                  <tr key={grade.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">
                        {grade.student}
                      </p>
                      <p className="text-xs text-slate-500">
                        {grade.studentId}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {grade.code}
                    </td>
                    <td className="py-3 pr-4">
                      <Input
                        type="number"
                        step="0.25"
                        min="1"
                        max="5"
                        value={grade.midterm}
                        onChange={(event) =>
                          updateGrade(grade.id, "midterm", event.target.value)
                        }
                        className="h-8 w-24 rounded-lg"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <Input
                        type="number"
                        step="0.25"
                        min="1"
                        max="5"
                        value={grade.finalTerm}
                        onChange={(event) =>
                          updateGrade(grade.id, "finalTerm", event.target.value)
                        }
                        className="h-8 w-24 rounded-lg"
                      />
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-950">
                      {finalGrade.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <StatusBadge value={gradeRemarks(finalGrade)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    )
  }

  function renderThesisLibrary() {
    const categories = [
      "All",
      ...Array.from(new Set(theses.map((thesis) => thesis.category))),
    ]
    const years = [
      "All",
      ...Array.from(new Set(theses.map((thesis) => String(thesis.year)))),
    ]

    return (
      <div className="space-y-5">
        {role === "admin" ? (
          <Panel title="Upload Thesis Record" eyebrow="Repository management">
            <form onSubmit={handleCreateThesis} className="grid gap-3 lg:grid-cols-2">
              <Input
                value={thesisDraft.title}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Thesis title"
                className="h-9 rounded-lg"
              />
              <Input
                value={thesisDraft.authors}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    authors: event.target.value,
                  }))
                }
                placeholder="Authors"
                className="h-9 rounded-lg"
              />
              <Input
                value={thesisDraft.category}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                placeholder="Category"
                className="h-9 rounded-lg"
              />
              <Input
                value={thesisDraft.adviser}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    adviser: event.target.value,
                  }))
                }
                placeholder="Adviser"
                className="h-9 rounded-lg"
              />
              <Input
                value={thesisDraft.year}
                onChange={(event) =>
                  setThesisDraft((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
                placeholder="Year"
                className="h-9 rounded-lg"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  className="h-9 rounded-lg"
                />
                <Button type="submit" size="sm">
                  <Plus className="size-4" />
                  Save
                </Button>
              </div>
              <div className="lg:col-span-2">
                <Textarea
                  value={thesisDraft.abstract}
                  onChange={(value) =>
                    setThesisDraft((current) => ({
                      ...current,
                      abstract: value,
                    }))
                  }
                  placeholder="Abstract"
                />
              </div>
            </form>
          </Panel>
        ) : null}

        <Panel
          title={role === "admin" ? "Thesis Records" : "Online Thesis Library"}
          eyebrow="Search and filter"
          actions={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={thesisYearFilter}
                onChange={setThesisYearFilter}
                options={years}
              />
              <Select
                value={thesisCategoryFilter}
                onChange={setThesisCategoryFilter}
                options={categories}
              />
            </div>
          }
        >
          <div className="mb-4">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search title, author, adviser, or keyword"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTheses.map((thesis) => (
              <article
                key={thesis.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {thesis.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {thesis.authors} - {thesis.year}
                    </p>
                  </div>
                  <StatusBadge value={thesis.category} />
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {thesis.abstract}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {thesis.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => downloadThesisDetails(thesis)}>
                    <Download className="size-4" />
                    Download Details
                  </Button>
                  {role === "admin" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTheses((current) =>
                          current.filter((item) => item.id !== thesis.id)
                        )
                      }
                    >
                      Delete
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          {filteredTheses.length === 0 ? (
            <EmptyState text="No thesis records match the current filters." />
          ) : null}
        </Panel>
      </div>
    )
  }

  function renderFeedback() {
    if (role === "student") {
      return (
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Panel title="Submission Console" eyebrow="Feedback and complaints">
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <Select
                value={feedbackDraft.category}
                onChange={(value) =>
                  setFeedbackDraft((current) => ({
                    ...current,
                    category: value,
                  }))
                }
                options={["Academic", "Facilities", "Portal", "Faculty", "Other"]}
                label="Category"
              />
              <Input
                value={feedbackDraft.subject}
                onChange={(event) =>
                  setFeedbackDraft((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                placeholder="Subject"
                className="h-9 rounded-lg"
              />
              <Textarea
                value={feedbackDraft.description}
                onChange={(value) =>
                  setFeedbackDraft((current) => ({
                    ...current,
                    description: value,
                  }))
                }
                placeholder="Describe the concern or suggestion"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={feedbackDraft.anonymous}
                  onChange={(event) =>
                    setFeedbackDraft((current) => ({
                      ...current,
                      anonymous: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border-slate-300"
                />
                Submit anonymously
              </label>
              <Button type="submit" className="w-full">
                <SendIcon />
                Submit Ticket
              </Button>
            </form>
          </Panel>
          <Panel title="Personal Ticket Tracker" eyebrow="Status updates">
            <TicketList
              tickets={studentTickets}
              empty="No submitted tickets yet."
            />
          </Panel>
        </div>
      )
    }

    const visibleTickets =
      role === "faculty"
        ? tickets.filter((ticket) => ticket.assignedTo === roleProfiles.faculty.name)
        : tickets

    return (
      <Panel
        title={role === "admin" ? "Master Inbox" : "Assigned Faculty Inbox"}
        eyebrow="Ticket status management"
      >
        <div className="space-y-3">
          {visibleTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-slate-950">
                      {ticket.subject}
                    </h4>
                    <StatusBadge value={ticket.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.id} - {ticket.studentName} - {ticket.submittedAt}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {ticket.description}
                  </p>
                  {ticket.resolution ? (
                    <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                      {ticket.resolution}
                    </p>
                  ) : null}
                </div>
                <div className="flex min-w-48 flex-col gap-2">
                  <Select
                    value={ticket.status}
                    onChange={(value) =>
                      updateTicketStatus(ticket.id, value as TicketStatus)
                    }
                    options={ticketStatusOptions}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateTicketStatus(
                        ticket.id,
                        "Resolved",
                        "Reviewed and marked as resolved by the portal user."
                      )
                    }
                  >
                    <Check className="size-4" />
                    Resolve
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {visibleTickets.length === 0 ? (
            <EmptyState text="No tickets are assigned here." />
          ) : null}
        </div>
      </Panel>
    )
  }

  function renderSeminars() {
    return (
      <div className="space-y-5">
        {role === "admin" ? (
          <Panel title="Event Creator" eyebrow="Seminars and webinars">
            <form onSubmit={handleCreateEvent} className="grid gap-3 lg:grid-cols-5">
              <Input
                value={eventDraft.title}
                onChange={(event) =>
                  setEventDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Event title"
                className="h-9 rounded-lg lg:col-span-2"
              />
              <Input
                value={eventDraft.speaker}
                onChange={(event) =>
                  setEventDraft((current) => ({
                    ...current,
                    speaker: event.target.value,
                  }))
                }
                placeholder="Speaker"
                className="h-9 rounded-lg"
              />
              <Input
                value={eventDraft.date}
                onChange={(event) =>
                  setEventDraft((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                placeholder="Date"
                className="h-9 rounded-lg"
              />
              <Input
                value={eventDraft.capacity}
                onChange={(event) =>
                  setEventDraft((current) => ({
                    ...current,
                    capacity: event.target.value,
                  }))
                }
                type="number"
                placeholder="Slots"
                className="h-9 rounded-lg"
              />
              <Input
                value={eventDraft.location}
                onChange={(event) =>
                  setEventDraft((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Location"
                className="h-9 rounded-lg lg:col-span-4"
              />
              <Button type="submit">
                <Plus className="size-4" />
                Create
              </Button>
            </form>
          </Panel>
        ) : null}
        <Panel
          title={
            role === "faculty"
              ? "My Events and Attendee Tracker"
              : "Seminars and Webinars"
          }
          eyebrow="Participation and enlisting"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {seminars.map((event) => {
              const enlisted = event.enlistedStudentIds.includes(
                roleProfiles.student.id
              )
              const remaining = event.capacity - event.enlistedStudentIds.length
              const percent = Math.min(
                100,
                Math.round(
                  (event.enlistedStudentIds.length / event.capacity) * 100
                )
              )
              const facultyOwnsEvent =
                role === "faculty" && event.host === roleProfiles.faculty.name
              return (
                <article
                  key={event.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-950">
                        {event.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {event.date} - {event.location}
                      </p>
                    </div>
                    <StatusBadge value={event.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {event.description}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{remaining} seats remaining</span>
                      <span>
                        {event.enlistedStudentIds.length}/{event.capacity}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {role === "student" ? (
                      <Button
                        size="sm"
                        variant={enlisted ? "outline" : "default"}
                        onClick={() => handleEnlist(event.id)}
                        disabled={!enlisted && remaining <= 0}
                      >
                        {enlisted ? (
                          <>
                            <Check className="size-4" />
                            Enlisted
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Enlist Now
                          </>
                        )}
                      </Button>
                    ) : null}
                    {role === "admin" || facultyOwnsEvent ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAttendees(event)}
                      >
                        <Download className="size-4" />
                        Export Attendees
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </Panel>
      </div>
    )
  }

  function renderAvailability() {
    if (role === "faculty") {
      return (
        <div className="space-y-5">
          {renderFacultyAvailabilityPanel()}
          {renderFacultyDirectoryPanel()}
        </div>
      )
    }

    if (role === "admin") {
      return (
        <Panel title="Admin Override Panel" eyebrow="Teacher availability">
          <div className="space-y-3">
            {faculty.map((member) => (
              <div
                key={member.id}
                className="grid gap-3 rounded-lg border border-slate-200 p-4 lg:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {member.name}
                  </h4>
                  <p className="text-sm text-slate-500">{member.notes}</p>
                </div>
                <Select
                  value={member.status}
                  onChange={(value) =>
                    updateFacultyStatus(member.id, value as AvailabilityStatus)
                  }
                  options={availabilityOptions}
                />
                <StatusBadge value={member.status} />
              </div>
            ))}
          </div>
        </Panel>
      )
    }

    return renderFacultyDirectoryPanel()
  }

  function renderFacultyAvailabilityPanel() {
    return (
      <Panel title="Quick Status Control" eyebrow="My availability">
        <form onSubmit={handleFacultySelfStatus} className="space-y-3">
          <Select
            value={myFacultyStatus}
            onChange={(value) => setMyFacultyStatus(value as AvailabilityStatus)}
            options={availabilityOptions}
            label="Status"
          />
          <Textarea
            value={myFacultyNotes}
            onChange={setMyFacultyNotes}
            placeholder="Daily note"
            rows={3}
          />
          <Button type="submit">
            <Save className="size-4" />
            Save Status
          </Button>
        </form>
      </Panel>
    )
  }

  function renderFacultyDirectoryPanel() {
    return (
      <Panel
        title="Live Faculty Directory"
        eyebrow="Status and profiles"
        actions={
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search faculty"
          />
        }
      >
        <div className="space-y-3">
          {filteredFaculty.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-semibold text-slate-950">
                    {member.name}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {member.position} - {member.role}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{member.notes}</p>
                </div>
                <StatusBadge value={member.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {member.schedule.map((slot) => (
                  <span key={slot} className="rounded-md bg-slate-100 px-2 py-1">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    )
  }

  function renderInstructors() {
    return (
      <div className="space-y-5">
        <Panel title="Instructor Information" eyebrow="Faculty profiles">
          <div className="grid gap-4 lg:grid-cols-2">
            {faculty.map((member) => (
              <article
                key={member.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                    {member.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {member.name}
                    </h4>
                    <p className="text-sm text-slate-500">{member.position}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {member.education}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {member.email}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Department Organizational Chart" eyebrow="Structure">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Program Chair", "Computing Studies Unit"],
              ["Research Coordinator", "Thesis and capstone review"],
              ["Faculty Members", "Instruction and consultation"],
              ["CSSO Officers", "Events and student records"],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <Building2 className="mb-3 size-5 text-slate-600" />
                <h4 className="font-semibold text-slate-950">{title}</h4>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    )
  }

  function renderCso() {
    return (
      <Panel title="CSSO Transparency Reports" eyebrow="Events and records">
        <div className="grid gap-4 lg:grid-cols-3">
          {csoReportsSeed.map((report) => (
            <article
              key={report.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <StatusBadge value={report.type} />
              <h4 className="mt-3 font-semibold text-slate-950">
                {report.title}
              </h4>
              <p className="mt-1 text-sm text-slate-500">{report.date}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {report.summary}
              </p>
              {report.total ? (
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  {report.total}
                </p>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() =>
                  downloadFile(
                    `${report.id}.txt`,
                    `${report.title}\n${report.date}\n\n${report.summary}`,
                    "text/plain"
                  )
                }
              >
                <Download className="size-4" />
                Download
              </Button>
            </article>
          ))}
        </div>
      </Panel>
    )
  }

  function renderCurriculum() {
    return (
      <Panel title="Current Curriculum" eyebrow="Plan and guide">
        <div className="grid gap-4 lg:grid-cols-2">
          {curriculumSeed.map((term) => (
            <article
              key={`${term.year}-${term.term}`}
              className="rounded-lg border border-slate-200 p-4"
            >
              <h4 className="font-semibold text-slate-950">
                {term.year} - {term.term}
              </h4>
              <ul className="mt-3 space-y-2">
                {term.subjects.map((subject) => (
                  <li
                    key={subject}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    {subject}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Panel>
    )
  }

  function renderQuickLinks() {
    return (
      <Panel title="Quick Links" eyebrow="Department resources">
        <div className="grid gap-3 md:grid-cols-3">
          {quickLinksSeed.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              {link.label}
              <LinkIcon className="size-4" />
            </a>
          ))}
        </div>
      </Panel>
    )
  }

  function renderUsers() {
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

  function renderAcademic() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Semester Management" eyebrow="School year">
          <div className="space-y-3">
            {semestersSeed.map((semester) => (
              <div
                key={`${semester.name}-${semester.schoolYear}`}
                className="rounded-lg border border-slate-200 p-4"
              >
                <h4 className="font-semibold text-slate-950">
                  {semester.name} {semester.schoolYear}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Enrollment: {semester.enrollment}
                </p>
                <p className="text-sm text-slate-500">
                  Grade submission: {semester.gradeSubmission}
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Subjects Management" eyebrow="Courses">
          <div className="space-y-3">
            {subjectsSeed.map((subject) => (
              <div
                key={subject.code}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-950">
                      {subject.code} - {subject.title}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {subject.units} units - {subject.instructor}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="xl:col-span-2">{renderCurriculum()}</div>
      </div>
    )
  }

  function renderTemplates() {
    return (
      <Panel title="Templates and Uploads" eyebrow="Data gathering">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-950">
              Student Account Template
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              CSV fields for name, email, course, year, and section.
            </p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => downloadUserTemplate("student")}
            >
              <Download className="size-4" />
              Download
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-950">
              Faculty Account Template
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              CSV fields for name, email, position, and department role.
            </p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => downloadUserTemplate("faculty")}
            >
              <Download className="size-4" />
              Download
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-950">Upload Excel File</h4>
            <p className="mt-2 text-sm text-slate-500">{uploadName}</p>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) =>
                setUploadName(event.target.files?.[0]?.name ?? "No file selected")
              }
              className="mt-4 h-9 rounded-lg"
            />
          </div>
        </div>
      </Panel>
    )
  }

  function renderClasses() {
    if (role === "faculty") {
      return (
        <Panel title="Manage Class" eyebrow="Checklist enrollment">
          <div className="space-y-3">
            {roster.map((student) => (
              <label
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <p className="font-medium text-slate-950">{student.name}</p>
                  <p className="text-sm text-slate-500">
                    {student.id} - {student.section}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={student.enrolled}
                  onChange={(event) =>
                    setRoster((current) =>
                      current.map((item) =>
                        item.id === student.id
                          ? { ...item, enrolled: event.target.checked }
                          : item
                      )
                    )
                  }
                  className="size-5 rounded border-slate-300"
                />
              </label>
            ))}
          </div>
        </Panel>
      )
    }

    return (
      <Panel title="Classes Management" eyebrow="Schedules and sections">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Section</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Instructor</th>
                <th className="py-2 pr-4">Schedule</th>
                <th className="py-2">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scheduleSeed.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {item.section}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{item.subject}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {item.instructor}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {item.day}, {item.time}
                  </td>
                  <td className="py-3 text-slate-600">{item.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    )
  }

  function renderAnnouncementManager() {
    return (
      <div className="space-y-5">
        {role === "admin" ? (
          <Panel title="Create Announcement" eyebrow="CS updates">
            <form
              onSubmit={handleCreateAnnouncement}
              className="grid gap-3 lg:grid-cols-4"
            >
              <Input
                value={announcementDraft.title}
                onChange={(event) =>
                  setAnnouncementDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Title"
                className="h-9 rounded-lg lg:col-span-2"
              />
              <Select
                value={announcementDraft.audience}
                onChange={(value) =>
                  setAnnouncementDraft((current) => ({
                    ...current,
                    audience: value,
                  }))
                }
                options={["All Users", "Students", "Faculty", "BSCS 3rd Year"]}
              />
              <Select
                value={announcementDraft.priority}
                onChange={(value) =>
                  setAnnouncementDraft((current) => ({
                    ...current,
                    priority: value as Announcement["priority"],
                  }))
                }
                options={["High", "Medium", "Low"]}
              />
              <div className="lg:col-span-4">
                <Textarea
                  value={announcementDraft.content}
                  onChange={(value) =>
                    setAnnouncementDraft((current) => ({
                      ...current,
                      content: value,
                    }))
                  }
                  placeholder="Announcement details"
                />
              </div>
              <Button type="submit">
                <Plus className="size-4" />
                Publish
              </Button>
            </form>
          </Panel>
        ) : null}
        {renderAnnouncementsPanel()}
      </div>
    )
  }

  function renderAudit() {
    return (
      <Panel title="Audit Trail" eyebrow="Grade changes and actions">
        <div className="space-y-3">
          {auditLogsSeed.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium text-slate-950">{log.action}</p>
              <p className="mt-1 text-sm text-slate-500">
                {log.actor} - {log.time}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    )
  }

  function renderModule() {
    if (activeModule === "overview") return renderOverview()
    if (activeModule === "grades") return renderGrades()
    if (activeModule === "thesis") return renderThesisLibrary()
    if (activeModule === "announcements") return renderAnnouncementManager()
    if (activeModule === "feedback") return renderFeedback()
    if (activeModule === "seminars") return renderSeminars()
    if (activeModule === "availability") return renderAvailability()
    if (activeModule === "instructors") return renderInstructors()
    if (activeModule === "cso") return renderCso()
    if (activeModule === "schedule") return renderSchedulePanel()
    if (activeModule === "curriculum") return renderCurriculum()
    if (activeModule === "quick-links") return renderQuickLinks()
    if (activeModule === "users") return renderUsers()
    if (activeModule === "academic") return renderAcademic()
    if (activeModule === "templates") return renderTemplates()
    if (activeModule === "classes") return renderClasses()
    if (activeModule === "audit") return renderAudit()
    return renderOverview()
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <div className="flex min-h-screen">
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            {role === "admin" ? (
              <ShieldCheck className="size-6 text-sky-700" />
            ) : (
              <GraduationCap className="size-6 text-sky-700" />
            )}
            <span className="font-semibold capitalize">{role} Portal</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-sky-700 text-white">
                {role === "admin" ? (
                  <ShieldCheck className="size-5" />
                ) : (
                  <GraduationCap className="size-5" />
                )}
              </div>
              <div>
                <h1 className="font-semibold text-slate-950">ComSite</h1>
                <p className="text-sm capitalize text-slate-500">
                  {role} workspace
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-950">
                {profile.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {profile.title}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = item.id === activeModule
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectModule(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                    active
                      ? "bg-sky-700 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 pb-8 pt-20 md:p-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                {role === "admin"
                  ? "Academic operations"
                  : role === "faculty"
                    ? "Instructor management"
                    : "Student services"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 md:text-3xl">
                {currentTitle}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => selectModule(role === "student" ? "feedback" : "audit")}
              >
                <Clock3 className="size-4" />
                Activity
              </Button>
              <Button onClick={() => selectModule(role === "admin" ? "users" : "availability")}>
                {role === "admin" ? (
                  <Plus className="size-4" />
                ) : (
                  <UserCircle className="size-4" />
                )}
                {role === "admin" ? "Add Account" : "Update Status"}
              </Button>
            </div>
          </header>

          {renderModule()}
        </section>
      </div>
    </main>
  )
}

function TicketList({
  tickets,
  empty,
}: {
  tickets: FeedbackTicket[]
  empty: string
}) {
  if (!tickets.length) return <EmptyState text={empty} />

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-950">{ticket.subject}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {ticket.category} - {ticket.submittedAt}
              </p>
            </div>
            <StatusBadge value={ticket.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {ticket.description}
          </p>
          {ticket.resolution ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {ticket.resolution}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function SendIcon() {
  return <Mail className="size-4" />
}
