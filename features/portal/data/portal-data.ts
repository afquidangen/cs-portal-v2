export type Role = "student" | "faculty" | "admin"

export type AvailabilityStatus =
  | "Available"
  | "In Class"
  | "Consultation Only"
  | "Out of Office"

export type TicketStatus = "Pending" | "In Progress" | "Resolved"

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  course?: string
  year?: number
  section?: string
  position?: string
  status: "Active" | "Inactive"
}

export type FacultyRecord = {
  id: string
  name: string
  position: string
  role: string
  email: string
  education: string
  status: AvailabilityStatus
  notes: string
  schedule: string[]
}

export type GradeRecord = {
  id: string
  studentId: string
  student: string
  subject: string
  code: string
  units: number
  midterm: number
  finalTerm: number
  updatedAt: string
}

export type ThesisRecord = {
  id: string
  title: string
  authors: string
  year: number
  category: string
  adviser: string
  abstract: string
  tags: string[]
}

export type SeminarRecord = {
  id: string
  title: string
  speaker: string
  date: string
  location: string
  description: string
  capacity: number
  enlistedStudentIds: string[]
  host: string
  status: "Active" | "Closed"
}

export type FeedbackTicket = {
  id: string
  studentId?: string
  studentName: string
  category: string
  subject: string
  description: string
  status: TicketStatus
  submittedAt: string
  assignedTo: string
  resolution?: string
  anonymous: boolean
}

export type Announcement = {
  id: string
  title: string
  content: string
  date: string
  audience: string
  priority: "High" | "Medium" | "Low"
}

export type ScheduleItem = {
  id: string
  day: string
  time: string
  subject: string
  room: string
  instructor: string
  section: string
}

export type CurriculumTerm = {
  year: string
  term: string
  subjects: string[]
}

export type ClassStudent = {
  id: string
  name: string
  section: string
  enrolled: boolean
}

export type CsoReport = {
  id: string
  title: string
  type: "Event" | "Accomplishment" | "Financial" | "Record"
  date: string
  summary: string
  total?: string
}

export const availabilityOptions: AvailabilityStatus[] = [
  "Available",
  "Consultation Only",
  "In Class",
  "Out of Office",
]

export const ticketStatusOptions: TicketStatus[] = [
  "Pending",
  "In Progress",
  "Resolved",
]

export const roleProfiles = {
  student: {
    name: "Juan Dela Cruz",
    title: "BSCS 3A - Regular Student",
    email: "juan@student.edu",
    id: "2024-001245",
  },
  faculty: {
    name: "Maria Santos",
    title: "Assistant Professor - Computer Science",
    email: "maria@faculty.edu",
    id: "FAC-014",
  },
  admin: {
    name: "Alyssa Admin",
    title: "System Administrator - CS Department",
    email: "admin@portal.edu",
    id: "ADM-001",
  },
} satisfies Record<Role, { name: string; title: string; email: string; id: string }>

export const usersSeed: UserRecord[] = [
  {
    id: "2024-001245",
    name: "Juan Dela Cruz",
    email: "juan@student.edu",
    role: "student",
    course: "BSCS",
    year: 3,
    section: "A",
    status: "Active",
  },
  {
    id: "2024-001284",
    name: "Kyla Mendoza",
    email: "kyla@student.edu",
    role: "student",
    course: "BSCS",
    year: 3,
    section: "A",
    status: "Active",
  },
  {
    id: "FAC-014",
    name: "Maria Santos",
    email: "maria@faculty.edu",
    role: "faculty",
    position: "Assistant Professor",
    status: "Active",
  },
  {
    id: "FAC-018",
    name: "Christian Galinato",
    email: "christian@faculty.edu",
    role: "faculty",
    position: "Instructor I",
    status: "Active",
  },
  {
    id: "ADM-001",
    name: "Alyssa Admin",
    email: "admin@portal.edu",
    role: "admin",
    position: "Portal Administrator",
    status: "Active",
  },
]

export const facultySeed: FacultyRecord[] = [
  {
    id: "FAC-014",
    name: "Maria Santos",
    position: "Assistant Professor",
    role: "Program Chair Support",
    email: "maria@faculty.edu",
    education: "MS Computer Science",
    status: "Available",
    notes: "Available for capstone consultation in Room 402.",
    schedule: ["Mon 9:00-11:00", "Wed 13:00-15:00"],
  },
  {
    id: "FAC-018",
    name: "Christian Galinato",
    position: "Instructor I",
    role: "Software Engineering Coordinator",
    email: "christian@faculty.edu",
    education: "MS Information Technology",
    status: "In Class",
    notes: "Teaching BSCS 3A until 3:00 PM.",
    schedule: ["Tue 10:00-12:00", "Thu 9:00-11:00"],
  },
  {
    id: "FAC-021",
    name: "Kyla Cablay",
    position: "Instructor I",
    role: "Research Adviser",
    email: "kyla@faculty.edu",
    education: "MIT - Data Analytics",
    status: "Consultation Only",
    notes: "Consultation by appointment for thesis topic validation.",
    schedule: ["Fri 8:00-11:00"],
  },
  {
    id: "FAC-026",
    name: "Hezron Gagarin",
    position: "Instructor II",
    role: "Systems Development Lead",
    email: "hezron@faculty.edu",
    education: "MS Software Engineering",
    status: "Out of Office",
    notes: "Attending department planning meeting.",
    schedule: ["Mon 13:00-16:00", "Thu 13:00-16:00"],
  },
]

export const gradeSeed: GradeRecord[] = [
  {
    id: "GR-001",
    studentId: "2024-001245",
    student: "Juan Dela Cruz",
    subject: "Web Systems and Technologies",
    code: "CS311",
    units: 3,
    midterm: 1.5,
    finalTerm: 1.25,
    updatedAt: "May 25, 2026",
  },
  {
    id: "GR-002",
    studentId: "2024-001245",
    student: "Juan Dela Cruz",
    subject: "Database Systems",
    code: "CS312",
    units: 3,
    midterm: 1.75,
    finalTerm: 1.5,
    updatedAt: "May 24, 2026",
  },
  {
    id: "GR-003",
    studentId: "2024-001245",
    student: "Juan Dela Cruz",
    subject: "Software Engineering",
    code: "CS313",
    units: 3,
    midterm: 1.25,
    finalTerm: 1.25,
    updatedAt: "May 26, 2026",
  },
  {
    id: "GR-004",
    studentId: "2024-001284",
    student: "Kyla Mendoza",
    subject: "Web Systems and Technologies",
    code: "CS311",
    units: 3,
    midterm: 2,
    finalTerm: 1.75,
    updatedAt: "May 23, 2026",
  },
]

export const thesisSeed: ThesisRecord[] = [
  {
    id: "TH-001",
    title: "AI-Powered Campus Management System",
    authors: "John Doe, Maria Cruz",
    year: 2026,
    category: "Software Engineering",
    adviser: "Dr. Maria Santos",
    abstract:
      "A study on using intelligent automation to improve school service delivery, academic monitoring, and reporting.",
    tags: ["AI", "MERN", "Automation"],
  },
  {
    id: "TH-002",
    title: "Mobile Attendance Monitoring for Computing Studies",
    authors: "Kyla Mendoza, Rafael Ignacio",
    year: 2025,
    category: "Information Systems",
    adviser: "Prof. Christian Galinato",
    abstract:
      "A mobile-first attendance platform that supports QR validation, instructor reports, and absence analytics.",
    tags: ["Mobile", "Attendance", "Analytics"],
  },
  {
    id: "TH-003",
    title: "Web-Based Thesis Archive with Metadata Search",
    authors: "Hezron Gagarin, Alyssa Quidangen",
    year: 2024,
    category: "Research Repository",
    adviser: "Prof. Kyla Cablay",
    abstract:
      "A searchable archive for approved thesis manuscripts with tagging, category filters, and secure file delivery.",
    tags: ["Library", "Search", "Archive"],
  },
]

export const seminarSeed: SeminarRecord[] = [
  {
    id: "SEM-001",
    title: "AI Tools for Capstone Development",
    speaker: "Dr. Elena Ramos",
    date: "June 4, 2026",
    location: "CS Lab 2",
    description:
      "Hands-on session on using AI tools responsibly during proposal and prototype development.",
    capacity: 50,
    enlistedStudentIds: ["2024-001245", "2024-001284", "2024-001310"],
    host: "Maria Santos",
    status: "Active",
  },
  {
    id: "SEM-002",
    title: "Cybersecurity Awareness for Student Developers",
    speaker: "Engr. Paolo Reyes",
    date: "June 12, 2026",
    location: "Auditorium",
    description:
      "Security fundamentals for web applications, authentication, and safe data handling.",
    capacity: 35,
    enlistedStudentIds: ["2024-001284"],
    host: "Christian Galinato",
    status: "Active",
  },
  {
    id: "SEM-003",
    title: "Research Writing and Abstract Clinic",
    speaker: "Prof. Kyla Cablay",
    date: "June 18, 2026",
    location: "Room 301",
    description:
      "Workshop for refining thesis abstracts, keywords, and research categorization.",
    capacity: 25,
    enlistedStudentIds: [],
    host: "Kyla Cablay",
    status: "Active",
  },
]

export const feedbackSeed: FeedbackTicket[] = [
  {
    id: "FB-1001",
    studentId: "2024-001245",
    studentName: "Juan Dela Cruz",
    category: "Facilities",
    subject: "Laboratory air-conditioning schedule",
    description:
      "The afternoon lab session becomes difficult because Lab 203 is too warm during Web Systems.",
    status: "In Progress",
    submittedAt: "May 25, 2026",
    assignedTo: "Maria Santos",
    resolution: "Raised to department maintenance coordinator.",
    anonymous: false,
  },
  {
    id: "FB-1002",
    studentName: "Anonymous",
    category: "Academic",
    subject: "Clarify grade posting timeline",
    description:
      "Students need a clearer schedule for midterm and final grade publication.",
    status: "Pending",
    submittedAt: "May 26, 2026",
    assignedTo: "Admin",
    anonymous: true,
  },
]

export const announcementsSeed: Announcement[] = [
  {
    id: "ANN-001",
    title: "Midterm Grade Updates Available",
    content:
      "Faculty members have started uploading verified midterm grades. Students will receive notices as grades are posted.",
    date: "May 26, 2026",
    audience: "Students",
    priority: "High",
  },
  {
    id: "ANN-002",
    title: "Capstone Proposal Clinic",
    content:
      "All third-year students are invited to attend the proposal clinic before submitting initial thesis topics.",
    date: "June 3, 2026",
    audience: "BSCS 3rd Year",
    priority: "Medium",
  },
  {
    id: "ANN-003",
    title: "CS Department System Maintenance",
    content:
      "The portal will undergo scheduled maintenance from 8:00 PM to 10:00 PM on Saturday.",
    date: "June 6, 2026",
    audience: "All Users",
    priority: "Low",
  },
]

export const scheduleSeed: ScheduleItem[] = [
  {
    id: "SCH-001",
    day: "Monday",
    time: "8:00 AM - 10:00 AM",
    subject: "Web Systems and Technologies",
    room: "Lab 203",
    instructor: "Maria Santos",
    section: "BSCS 3A",
  },
  {
    id: "SCH-002",
    day: "Tuesday",
    time: "10:00 AM - 12:00 PM",
    subject: "Data Structures",
    room: "Room 301",
    instructor: "Christian Galinato",
    section: "BSCS 3A",
  },
  {
    id: "SCH-003",
    day: "Wednesday",
    time: "1:00 PM - 3:00 PM",
    subject: "Software Engineering",
    room: "Room 205",
    instructor: "Kyla Cablay",
    section: "BSCS 3A",
  },
  {
    id: "SCH-004",
    day: "Thursday",
    time: "9:00 AM - 11:00 AM",
    subject: "Database Systems",
    room: "Lab 204",
    instructor: "Hezron Gagarin",
    section: "BSCS 3A",
  },
]

export const curriculumSeed: CurriculumTerm[] = [
  {
    year: "Third Year",
    term: "Second Semester",
    subjects: [
      "Web Systems and Technologies",
      "Database Systems",
      "Software Engineering",
      "Operating Systems",
      "Technopreneurship",
    ],
  },
  {
    year: "Fourth Year",
    term: "First Semester",
    subjects: [
      "Thesis Writing 1",
      "Professional Elective 3",
      "Internship Preparation",
      "Information Assurance",
    ],
  },
]

export const classRosterSeed: ClassStudent[] = [
  {
    id: "2024-001245",
    name: "Juan Dela Cruz",
    section: "BSCS 3A",
    enrolled: true,
  },
  {
    id: "2024-001284",
    name: "Kyla Mendoza",
    section: "BSCS 3A",
    enrolled: true,
  },
  {
    id: "2024-001310",
    name: "Rafael Ignacio",
    section: "BSCS 3A",
    enrolled: false,
  },
  {
    id: "2024-001322",
    name: "Bea Castillo",
    section: "BSCS 3A",
    enrolled: true,
  },
]

export const csoReportsSeed: CsoReport[] = [
  {
    id: "CSSO-001",
    title: "CodeSprint Orientation",
    type: "Event",
    date: "May 18, 2026",
    summary:
      "Orientation for incoming computing students and organization volunteers.",
  },
  {
    id: "CSSO-002",
    title: "April Financial Summary",
    type: "Financial",
    date: "May 2, 2026",
    summary:
      "Collected membership fees, printing expenses, and event material purchases.",
    total: "PHP 12,450 balance",
  },
  {
    id: "CSSO-003",
    title: "Peer Tutorial Program",
    type: "Accomplishment",
    date: "April 29, 2026",
    summary:
      "Completed four tutorial sessions covering programming fundamentals and database design.",
  },
]

export const quickLinksSeed = [
  {
    label: "CS Facebook Page",
    href: "https://facebook.com",
  },
  {
    label: "College LMS",
    href: "https://example.edu/lms",
  },
  {
    label: "Library Portal",
    href: "https://example.edu/library",
  },
]

export const semestersSeed = [
  {
    name: "2nd Semester",
    schoolYear: "2025-2026",
    enrollment: "Open",
    gradeSubmission: "May 20 - June 5, 2026",
  },
  {
    name: "Summer Term",
    schoolYear: "2025-2026",
    enrollment: "Upcoming",
    gradeSubmission: "July 20 - July 30, 2026",
  },
]

export const subjectsSeed = [
  {
    code: "CS311",
    title: "Web Systems and Technologies",
    units: 3,
    instructor: "Maria Santos",
  },
  {
    code: "CS312",
    title: "Database Systems",
    units: 3,
    instructor: "Hezron Gagarin",
  },
  {
    code: "CS313",
    title: "Software Engineering",
    units: 3,
    instructor: "Kyla Cablay",
  },
]

export const auditLogsSeed = [
  {
    id: "LOG-001",
    actor: "Maria Santos",
    action: "Uploaded final grade for CS311",
    time: "May 26, 2026 10:32 AM",
  },
  {
    id: "LOG-002",
    actor: "Alyssa Admin",
    action: "Updated seminar slot capacity",
    time: "May 26, 2026 9:12 AM",
  },
  {
    id: "LOG-003",
    actor: "Juan Dela Cruz",
    action: "Submitted feedback ticket FB-1001",
    time: "May 25, 2026 3:48 PM",
  },
]
