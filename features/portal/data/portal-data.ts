export type Role = "student" | "faculty" | "admin"

export type AvailabilityStatus =
  | "Available"
  | "In Class"
  | "Consultation Only"
  | "Out of Office"

export type TicketStatus = "Pending" | "In Progress" | "Resolved"

export type StudentStatus = "Regular" | "Irregular" | "Overstayed" | "Transferee" | "Shifter"

export type FacultyType = "Part Time" | "Regular"

export type AnnouncementAudience = "All Users" | "Students" | "Faculty"

export type UserRecord = {
  id: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  role: Role
  year?: number
  section?: string
  studentStatus?: StudentStatus
  curriculumId?: string
  major?: string
  advisoryClass?: string
  facultyType?: FacultyType
  title?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  profilePicture?: string
  status: "Active" | "Inactive"
}

export type FacultyRecord = {
  id: string
  firstName: string
  middleName: string
  lastName: string
  position: string
  role: string
  email: string
  education: string
  status: AvailabilityStatus
  notes: string
  schedule: string[]
  facultyType?: FacultyType
  title?: string
  advisoryClass?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  profilePicture?: string
}

export type GradeRecord = {
  id: string
  studentId: string
  student: string
  subject: string
  code: string
  units: number
  lecUnits: number
  labUnits: number
  midterm: number
  finalTerm: number
  finalRating: number
  transmutedGrade: number
  equivalent: string
  remarks: string
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
  fileUrl?: string
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
  resolvedAt?: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  date: string
  audience: AnnouncementAudience
  priority: "High" | "Medium" | "Low"
  imageUrl?: string
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

export type CurriculumSubject = {
  code: string
  name: string
  lecUnits: number
  labUnits: number
  totalUnits: number
}

export type CurriculumTerm = {
  year: string
  term: string
  subjects: CurriculumSubject[]
}

export type Curriculum = {
  id: string
  name: string
  major?: string
  terms: CurriculumTerm[]
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
  fileUrl?: string
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

export const studentStatusOptions: StudentStatus[] = [
  "Regular",
  "Irregular",
  "Overstayed",
  "Transferee",
  "Shifter",
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
    firstName: "Juan",
    middleName: "Dela",
    lastName: "Cruz",
    email: "juan@gmail.com",
    role: "student",
    year: 3,
    section: "A",
    studentStatus: "Regular",
    curriculumId: "1",
    contactNumber: "09123456789",
    sex: "Male",
    birthday: "2000-01-15",
    address: "Candon City, Ilocos Sur",
    status: "Active",
  },
  {
    id: "2024-001284",
    firstName: "Kyla",
    middleName: "M.",
    lastName: "Mendoza",
    email: "kyla@gmail.com",
    role: "student",
    year: 3,
    section: "A",
    studentStatus: "Regular",
    curriculumId: "1",
    contactNumber: "09123456780",
    sex: "Female",
    birthday: "2001-03-22",
    address: "Santa Cruz, Ilocos Sur",
    status: "Active",
  },
  {
    id: "FAC-014",
    firstName: "Maria",
    middleName: "C.",
    lastName: "Santos",
    email: "maria@ispsc.edu.ph",
    role: "faculty",
    facultyType: "Regular",
    title: "MIT",
    advisoryClass: "BSCS 3A",
    contactNumber: "09123456781",
    sex: "Female",
    birthday: "1985-06-10",
    address: "Candon City, Ilocos Sur",
    status: "Active",
  },
  {
    id: "FAC-018",
    firstName: "Christian",
    middleName: "G.",
    lastName: "Galinato",
    email: "christian@ispsc.edu.ph",
    role: "faculty",
    facultyType: "Regular",
    title: "MIT",
    advisoryClass: "BSCS 3B",
    contactNumber: "09123456782",
    sex: "Male",
    birthday: "1990-09-05",
    address: "San Juan, Ilocos Sur",
    status: "Active",
  },
  {
    id: "ADM-001",
    firstName: "Alyssa",
    middleName: "A.",
    lastName: "Admin",
    email: "admin@portal.edu",
    role: "admin",
    contactNumber: "09123456783",
    sex: "Female",
    birthday: "1988-12-20",
    address: "Vigan City, Ilocos Sur",
    status: "Active",
  },
]

export const facultySeed: FacultyRecord[] = [
  {
    id: "FAC-014",
    firstName: "Maria",
    middleName: "C.",
    lastName: "Santos",
    position: "Assistant Professor",
    role: "Program Chair Support",
    email: "maria@ispsc.edu.ph",
    education: "MS Computer Science",
    status: "Available",
    notes: "Available for capstone consultation in Room 402.",
    schedule: ["Mon 9:00-11:00", "Wed 13:00-15:00"],
    facultyType: "Regular",
    title: "MIT",
    advisoryClass: "BSCS 3A",
    contactNumber: "09123456781",
    sex: "Female",
    birthday: "1985-06-10",
    address: "Candon City, Ilocos Sur",
  },
  {
    id: "FAC-018",
    firstName: "Christian",
    middleName: "G.",
    lastName: "Galinato",
    position: "Instructor I",
    role: "Software Engineering Coordinator",
    email: "christian@ispsc.edu.ph",
    education: "MS Information Technology",
    status: "In Class",
    notes: "Teaching BSCS 3A until 3:00 PM.",
    schedule: ["Tue 10:00-12:00", "Thu 9:00-11:00"],
    facultyType: "Regular",
    title: "MIT",
    advisoryClass: "BSCS 3B",
    contactNumber: "09123456782",
    sex: "Male",
    birthday: "1990-09-05",
    address: "San Juan, Ilocos Sur",
  },
  {
    id: "FAC-021",
    firstName: "Kyla",
    middleName: "D.",
    lastName: "Cablay",
    position: "Instructor I",
    role: "Research Adviser",
    email: "kyla@ispsc.edu.ph",
    education: "MIT - Data Analytics",
    status: "Consultation Only",
    notes: "Consultation by appointment for thesis topic validation.",
    schedule: ["Fri 8:00-11:00"],
    facultyType: "Regular",
    title: "MIT",
    advisoryClass: "BSCS 3C",
    contactNumber: "09123456784",
    sex: "Female",
    birthday: "1992-11-15",
    address: "Candon City, Ilocos Sur",
  },
  {
    id: "FAC-026",
    firstName: "Hezron",
    middleName: "G.",
    lastName: "Gagarin",
    position: "Instructor II",
    role: "Systems Development Lead",
    email: "hezron@ispsc.edu.ph",
    education: "MS Software Engineering",
    status: "Out of Office",
    notes: "Attending department planning meeting.",
    schedule: ["Mon 13:00-16:00", "Thu 13:00-16:00"],
    facultyType: "Regular",
    title: "MIT",
    advisoryClass: "BSCS 4A",
    contactNumber: "09123456785",
    sex: "Male",
    birthday: "1988-04-25",
    address: "Santa Lucia, Ilocos Sur",
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
    lecUnits: 2,
    labUnits: 1,
    midterm: 1.5,
    finalTerm: 1.25,
    finalRating: 1.38,
    transmutedGrade: 1.25,
    equivalent: "1.25",
    remarks: "Passed",
    updatedAt: "May 25, 2026",
  },
  {
    id: "GR-002",
    studentId: "2024-001245",
    student: "Juan Dela Cruz",
    subject: "Database Systems",
    code: "CS312",
    units: 3,
    lecUnits: 2,
    labUnits: 1,
    midterm: 1.75,
    finalTerm: 1.5,
    finalRating: 1.63,
    transmutedGrade: 1.5,
    equivalent: "1.50",
    remarks: "Passed",
    updatedAt: "May 24, 2026",
  },
  {
    id: "GR-003",
    studentId: "2024-001245",
    student: "Juan Dela Cruz",
    subject: "Software Engineering",
    code: "CS313",
    units: 3,
    lecUnits: 2,
    labUnits: 1,
    midterm: 1.25,
    finalTerm: 1.25,
    finalRating: 1.25,
    transmutedGrade: 1.25,
    equivalent: "1.25",
    remarks: "Passed",
    updatedAt: "May 26, 2026",
  },
  {
    id: "GR-004",
    studentId: "2024-001284",
    student: "Kyla Mendoza",
    subject: "Web Systems and Technologies",
    code: "CS311",
    units: 3,
    lecUnits: 2,
    labUnits: 1,
    midterm: 2,
    finalTerm: 1.75,
    finalRating: 1.88,
    transmutedGrade: 1.75,
    equivalent: "1.75",
    remarks: "Passed",
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
    abstract: "A study on using intelligent automation to improve school service delivery, academic monitoring, and reporting.",
    tags: ["AI", "MERN", "Automation"],
  },
  {
    id: "TH-002",
    title: "Mobile Attendance Monitoring for Computing Studies",
    authors: "Kyla Mendoza, Rafael Ignacio",
    year: 2025,
    category: "Information Systems",
    adviser: "Prof. Christian Galinato",
    abstract: "A mobile-first attendance platform that supports QR validation, instructor reports, and absence analytics.",
    tags: ["Mobile", "Attendance", "Analytics"],
  },
  {
    id: "TH-003",
    title: "Web-Based Thesis Archive with Metadata Search",
    authors: "Hezron Gagarin, Alyssa Quidangen",
    year: 2024,
    category: "Research Repository",
    adviser: "Prof. Kyla Cablay",
    abstract: "A searchable archive for approved thesis manuscripts with tagging, category filters, and secure file delivery.",
    tags: ["Library", "Search", "Archive"],
  },
]

export const feedbackSeed: FeedbackTicket[] = [
  {
    id: "FB-1001",
    studentId: "2024-001245",
    studentName: "Juan Dela Cruz",
    category: "Facilities",
    subject: "Laboratory air-conditioning schedule",
    description: "The afternoon lab session becomes difficult because Lab 203 is too warm during Web Systems.",
    status: "In Progress",
    submittedAt: "May 25, 2026",
    assignedTo: "Maria Santos",
    resolution: "Raised to department maintenance coordinator.",
  },
  {
    id: "FB-1002",
    studentName: "Anonymous",
    category: "Academic",
    subject: "Clarify grade posting timeline",
    description: "Students need a clearer schedule for midterm and final grade publication.",
    status: "Pending",
    submittedAt: "May 26, 2026",
    assignedTo: "Admin",
  },
]

export const announcementsSeed: Announcement[] = [
  {
    id: "ANN-001",
    title: "Midterm Grade Updates Available",
    content: "Faculty members have started uploading verified midterm grades. Students will receive notices as grades are posted.",
    date: "May 26, 2026",
    audience: "Students",
    priority: "High",
  },
  {
    id: "ANN-002",
    title: "Capstone Proposal Clinic",
    content: "All third-year students are invited to attend the proposal clinic before submitting initial thesis topics.",
    date: "June 3, 2026",
    audience: "Students",
    priority: "Medium",
  },
  {
    id: "ANN-003",
    title: "CS Department System Maintenance",
    content: "The portal will undergo scheduled maintenance from 8:00 PM to 10:00 PM on Saturday.",
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

export const curriculumSeed: Curriculum[] = [
  {
    id: "1",
    name: "Old Curriculum (CMO No. 25 Series 2015 Board Resolution No. 17 s. 2011)",
    terms: [
      {
        year: "First Year",
        term: "First Semester",
        subjects: [
          { code: "CS 101", name: "Introduction to Computing", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 102", name: "Fundamentals of Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "Gen Ed 103", name: "Mathematics in the Modern World", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 104", name: "Understanding the Self", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 1", name: "People and the Earth's Ecosystems", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 110", name: "The Entrepreneurial Mind", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 1", name: "Movement Competency Training or MCT", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "NSTP 1", name: "CWTS/ROTC 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "First Year",
        term: "Second Semester",
        subjects: [
          { code: "CS 104", name: "Discrete Structures 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 103", name: "Intermediate Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 105", name: "Fundamentals of Human Computer Interaction", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 101", name: "Purposive Communication", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 2", name: "Exercise-based Fitness Activities", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "GE Elec 2", name: "Philippine Popular Culture", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "NSTP 2", name: "CWTS/ROTC 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Second Year",
        term: "First Semester",
        subjects: [
          { code: "CS 201", name: "Data Structures and Algorithms", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 202", name: "Discrete Structures 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 107", name: "The Contemporary World", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 108", name: "Art Appreciation", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 3", name: "Dances", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "CS 203", name: "Social Issues and Professional Practices", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 204", name: "Parallel and Distributed Computing", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 205", name: "Object-Oriented Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Second Year",
        term: "Second Semester",
        subjects: [
          { code: "CS 206", name: "System Fundamentals", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 106", name: "Ethics", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 207", name: "Information Management", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 208", name: "Architecture and Organization", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "Gen Ed 105", name: "Science, Technology & Society", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Math", name: "Differential and Integral Calculus", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 4", name: "Sports", lecUnits: 2, labUnits: 0, totalUnits: 2 },
        ],
      },
      {
        year: "Third Year",
        term: "First Semester",
        subjects: [
          { code: "CS 301", name: "Programming Languages", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 302", name: "Automata Theory and Formal Languages", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 303", name: "Networks and Communications", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 304", name: "Operating Systems", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 305", name: "Software Engineering 1", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 306", name: "Computational Science", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 307", name: "Quantitative Methods", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Elective 1", name: "Communicating Effectively", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Third Year",
        term: "Second Semester",
        subjects: [
          { code: "CS 308", name: "Software Engineering 2: Implementation and Management", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 309", name: "Algorithm and Complexity", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 310", name: "Intelligent System", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "Gen Ed 102", name: "Readings in Philippine History", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 311", name: "Graphics and Visual Arts Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 312", name: "Research Methodology", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 313", name: "Web Development", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "Elective 2", name: "Creative Writing", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Mid Year",
        term: "",
        subjects: [
          { code: "CS 314", name: "Ojt/Practicum (200 hours)", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Fourth Year",
        term: "First Semester",
        subjects: [
          { code: "CS 401", name: "Seminars and Tours", lecUnits: 1, labUnits: 0, totalUnits: 1 },
          { code: "CS 404", name: "Project Study 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 402", name: "Multimedia System", lecUnits: 2, labUnits: 11, totalUnits: 13 },
          { code: "Rizal", name: "Rizal's Life and Works", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Fourth Year",
        term: "Second Semester",
        subjects: [
          { code: "CS 403", name: "Information Assurance and Security", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 405", name: "Project Study 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "New Curriculum",
    major: "Embedded Systems and AI Specialization",
    terms: [
      {
        year: "First Year",
        term: "First Semester",
        subjects: [
          { code: "Gen Ed 101", name: "Understanding The Self", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 102", name: "Mathematics in the Modern World", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 101", name: "People and Earth's Ecosystem", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 103", name: "The Entrepreneurial Mind", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 1", name: "Movement Competency Training or MCT", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "NSTP 1", name: "CWTS 1 / ROTC 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CC101", name: "Introduction to Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC102", name: "Fundamentals of Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "First Year",
        term: "Second Semester",
        subjects: [
          { code: "Gen Ed 104", name: "Art Appreciation", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 2", name: "Exercise-based Fitness Activities", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "NSTP 2", name: "CWTS 2 / ROTC 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CC103", name: "Intermediate Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC104", name: "Data Structures and Algorithms", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC105", name: "Information Management", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 101", name: "Fundamentals of HCI and Office Application", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 102", name: "Discrete Structures", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 103", name: "Object-Oriented Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Second Year",
        term: "First Semester",
        subjects: [
          { code: "Gen Ed 105", name: "Science, Technology, and Society", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Math 1", name: "Calculus 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 106", name: "Probability and Statistics", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 3", name: "Choice of Dances", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "CS 104", name: "Programming Languages", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 105", name: "Data Communication and Networks 1", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 106", name: "Web Development 1", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC 106", name: "Applications Development and Emerging Technologies", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 107", name: "Systems Analysis and Design", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Second Year",
        term: "Second Semester",
        subjects: [
          { code: "Gen Ed 107", name: "Purposive Communication", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 108", name: "Readings in Philippine History", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 4", name: "Sports", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "CS 108", name: "Web Development 2", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 109", name: "Intelligent and Embedded Systems", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 110", name: "Software Engineering and Software Testing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 111", name: "Parallel and Distributed Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 112", name: "Multimedia Systems and Animation", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS Elective 1", name: "Advanced Embedded Systems", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Third Year",
        term: "First Semester",
        subjects: [
          { code: "GE Elec 102", name: "Philippine Popular Culture", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 103", name: "Reading Visual Art", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Math 2", name: "Calculus 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 113", name: "Data Communications and Networks 2", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 114", name: "Graphics and Visual Arts Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 115", name: "Automata Theory and Formal Languages", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 116", name: "Algorithm and Complexity", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS Elective 2", name: "Wireless Sensor Networks", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Third Year",
        term: "Second Semester",
        subjects: [
          { code: "Gen Ed 109", name: "Contemporary World", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 110", name: "Ethics", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 111", name: "Gender and Society", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 104", name: "Communicating Effectively", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 117", name: "Quantitative Methods - Advanced Statistics", lecUnits: 2, labUnits: 0, totalUnits: 3 },
          { code: "CS 118", name: "Operating Systems and Architecture Organization", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "Thesis 1", name: "Thesis Study 1", lecUnits: 1, labUnits: 0, totalUnits: 3 },
          { code: "CS Elective 3", name: "Edge Computing and AI", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Mid Year",
        term: "",
        subjects: [
          { code: "OJT", name: "Industry Immersion (280 hours)", lecUnits: 1, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Fourth Year",
        term: "First Semester",
        subjects: [
          { code: "Thesis 2", name: "Thesis Study 2", lecUnits: 1, labUnits: 0, totalUnits: 3 },
          { code: "CS 119", name: "Seminars and Tours", lecUnits: 1, labUnits: 0, totalUnits: 1 },
        ],
      },
      {
        year: "Fourth Year",
        term: "Second Semester",
        subjects: [
          { code: "CS 120", name: "Technopreneurship", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 121", name: "Social and Professional Practice", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 122", name: "Computational Science", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Rizal", name: "Rizal's Life and Works", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "New Curriculum",
    major: "Secure Software Engineering Specialization",
    terms: [
      {
        year: "First Year",
        term: "First Semester",
        subjects: [
          { code: "Gen Ed 101", name: "Understanding The Self", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 102", name: "Mathematics in the Modern World", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 101", name: "People and Earth's Ecosystem", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 103", name: "The Entrepreneurial Mind", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 1", name: "Movement Competency Training or MCT", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "NSTP 1", name: "CWTS 1 / ROTC 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CC101", name: "Introduction to Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC102", name: "Fundamentals of Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "First Year",
        term: "Second Semester",
        subjects: [
          { code: "Gen Ed 104", name: "Art Appreciation", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 2", name: "Exercise-based Fitness Activities", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "NSTP 2", name: "CWTS 2 / ROTC 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CC103", name: "Intermediate Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC104", name: "Data Structures and Algorithms", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC105", name: "Information Management", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 101", name: "Fundamentals of HCI and Office Application", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 102", name: "Discrete Structures", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 103", name: "Object-Oriented Programming", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Second Year",
        term: "First Semester",
        subjects: [
          { code: "Gen Ed 105", name: "Science, Technology, and Society", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Math 1", name: "Calculus 1", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 106", name: "Probability and Statistics", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 3", name: "Choice of Dances", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "CS 104", name: "Programming Languages", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 105", name: "Data Communication and Networks 1", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 106", name: "Web Development 1", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CC 106", name: "Applications Development and Emerging Technologies", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 107", name: "Systems Analysis and Design", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Second Year",
        term: "Second Semester",
        subjects: [
          { code: "Gen Ed 107", name: "Purposive Communication", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 108", name: "Readings in Philippine History", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "PATHFit 4", name: "Sports", lecUnits: 2, labUnits: 0, totalUnits: 2 },
          { code: "CS 108", name: "Web Development 2", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 109", name: "Intelligent and Embedded Systems", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 110", name: "Software Engineering and Software Testing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 111", name: "Parallel and Distributed Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 112", name: "Multimedia Systems and Animation", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS Elective 1", name: "Principles of Blockchain", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Third Year",
        term: "First Semester",
        subjects: [
          { code: "GE Elec 102", name: "Philippine Popular Culture", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 103", name: "Reading Visual Art", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Math 2", name: "Calculus 2", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 113", name: "Data Communications and Networks 2", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 114", name: "Graphics and Visual Arts Computing", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "CS 115", name: "Automata Theory and Formal Languages", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 116", name: "Algorithm and Complexity", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS Elective 2", name: "Continuous Integration/Continuous Deployment (CI/CD)", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Third Year",
        term: "Second Semester",
        subjects: [
          { code: "Gen Ed 109", name: "Contemporary World", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 110", name: "Ethics", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Gen Ed 111", name: "Gender and Society", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "GE Elec 104", name: "Communicating Effectively", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 117", name: "Quantitative Methods - Advanced Statistics", lecUnits: 2, labUnits: 0, totalUnits: 3 },
          { code: "CS 118", name: "Operating Systems and Architecture Organization", lecUnits: 2, labUnits: 1, totalUnits: 3 },
          { code: "Thesis 1", name: "Thesis Study 1", lecUnits: 1, labUnits: 0, totalUnits: 3 },
          { code: "CS Elective 3", name: "Secure Software Development (Web3)", lecUnits: 2, labUnits: 1, totalUnits: 3 },
        ],
      },
      {
        year: "Mid Year",
        term: "",
        subjects: [
          { code: "OJT", name: "Industry Immersion (280 hours)", lecUnits: 1, labUnits: 0, totalUnits: 3 },
        ],
      },
      {
        year: "Fourth Year",
        term: "First Semester",
        subjects: [
          { code: "Thesis 2", name: "Thesis Study 2", lecUnits: 1, labUnits: 0, totalUnits: 3 },
          { code: "CS 119", name: "Seminars and Tours", lecUnits: 1, labUnits: 0, totalUnits: 1 },
        ],
      },
      {
        year: "Fourth Year",
        term: "Second Semester",
        subjects: [
          { code: "CS 120", name: "Technopreneurship", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 121", name: "Social and Professional Practice", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "CS 122", name: "Computational Science", lecUnits: 3, labUnits: 0, totalUnits: 3 },
          { code: "Rizal", name: "Rizal's Life and Works", lecUnits: 3, labUnits: 0, totalUnits: 3 },
        ],
      },
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
  {
    id: "2024-001330",
    name: "Carlos Dela Vega",
    section: "BSCS 3A",
    enrolled: true,
  },
  {
    id: "2024-001341",
    name: "Sofia Ramirez",
    section: "BSCS 3A",
    enrolled: true,
  },
  {
    id: "2024-001355",
    name: "Miguel Santos",
    section: "BSCS 3A",
    enrolled: true,
  },
  {
    id: "2024-001362",
    name: "Angela Cruz",
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
    summary: "Orientation for incoming computing students and organization volunteers.",
  },
  {
    id: "CSSO-002",
    title: "April Financial Summary",
    type: "Financial",
    date: "May 2, 2026",
    summary: "Collected membership fees, printing expenses, and event material purchases.",
    total: "PHP 12,450 balance",
  },
  {
    id: "CSSO-003",
    title: "Peer Tutorial Program",
    type: "Accomplishment",
    date: "April 29, 2026",
    summary: "Completed four tutorial sessions covering programming fundamentals and database design.",
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
    lecUnits: 2,
    labUnits: 1,
    totalUnits: 3,
    instructor: "Maria Santos",
  },
  {
    code: "CS312",
    title: "Database Systems",
    lecUnits: 2,
    labUnits: 1,
    totalUnits: 3,
    instructor: "Hezron Gagarin",
  },
  {
    code: "CS313",
    title: "Software Engineering",
    lecUnits: 2,
    labUnits: 1,
    totalUnits: 3,
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

export const sectionSeed: Record<string, string[]> = {
  "First Year": ["BSCS 1A", "BSCS 1B", "BSCS 1C", "BSCS 1D"],
  "Second Year": ["BSCS 2A", "BSCS 2B", "BSCS 2C", "BSCS 2D"],
  "Third Year": ["BSCS 3A", "BSCS 3B", "BSCS 3C"],
  "Fourth Year": ["BSCS 4A", "BSCS 4B", "BSCS 4C"],
}
