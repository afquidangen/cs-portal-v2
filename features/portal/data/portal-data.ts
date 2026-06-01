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
  firstName?: string
  middleName?: string
  lastName?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  photoUrl?: string
  studentType?: "Irregular" | "Regular" | "Overstayed" | "Transferee" | "Shifter"
  curriculum?: string
  advisoryClass?: string
  employmentType?: "Part Time" | "Regular"
  academicTitle?: string
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
  section: string
  subject: string
  code: string
  units: number
  midtermTransmuted?: number
  midterm: number
  finalTransmuted?: number
  finalTerm: number
  gradePercentage?: number
  remarks?: string
  released?: boolean
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
  pdfUrl: string
  fileName: string
}

export type ProfileDetails = {
  photoUrl: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactNumber: string
  sex: string
  birthday: string
  address: string
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

export type CurriculumRecord = {
  id: string
  name: string
  major: string
  status: "Active" | "Archived"
  totalUnits: number
  terms: {
    year: string
    semester: string
    subjects: {
      code: string
      name: string
      lec: number
      lab: number
      total: number
    }[]
  }[]
}

const curriculumSubject = (
  code: string,
  name: string,
  lec: number,
  lab: number,
  total: number
) => ({ code, name, lec, lab, total })

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
    name: "Student Test 1",
    title: "BSCS 3A - Regular Student",
    email: "student1@gmail.com",
    id: "2024-001245",
  },
  faculty: {
    name: "Faculty Test 1",
    title: "Assistant Professor - Computer Science",
    email: "faculty1@gmail.com",
    id: "FAC-014",
  },
  admin: {
    name: "Admin Test 1",
    title: "System Administrator - CS Department",
    email: "admin1@gmail.com",
    id: "ADM-001",
  },
} satisfies Record<Role, { name: string; title: string; email: string; id: string }>

export const facultyHandledSections: Record<string, string[]> = {
  "FAC-014": ["BSCS 3A", "BSCS 2B"],
  "FAC-018": ["BSCS 1A", "BSCS 4A"],
  "FAC-021": ["BSCS 3A", "BSCS 3B"],
  "FAC-026": ["BSCS 2B", "BSCS 3A"],
  "FAC-027": ["BSCS 2B", "BSCS 3A"],
}

export const sampleThesisPdfUrl =
  "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1NSA+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcyIDcyMCBUZAooU2FtcGxlIHRoZXNpcyBtYW51c2NyaXB0KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2NCAwMDAwMCBuIAowMDAwMDAwMTIxIDAwMDAwIG4gCjAwMDAwMDAyNzAgMDAwMDAgbiAKMDAwMDAwMDM3NiAwMDAwMCBuIAp0cmFpbGVyCjw8IC9Sb290IDEgMCBSIC9TaXplIDYgPj4Kc3RhcnR4cmVmCjQ0NgolJUVPRg=="

export const usersSeed: UserRecord[] = [
  {
    id: "2024-001245",
    name: "Student Test 1",
    email: "student1@gmail.com",
    role: "student",
    firstName: "Student",
    middleName: "Test",
    lastName: "One",
    contactNumber: "0917 000 0001",
    sex: "Female",
    birthday: "2004-05-14",
    address: "Candon City, Ilocos Sur",
    studentType: "Regular",
    curriculum: "Old Curriculum",
    course: "BSCS",
    year: 3,
    section: "A",
    status: "Active",
  },
  {
    id: "2024-001284",
    name: "Student Test 2",
    email: "student2@gmail.com",
    role: "student",
    firstName: "Student",
    middleName: "Test",
    lastName: "Two",
    contactNumber: "0917 000 0002",
    sex: "Male",
    birthday: "2004-09-22",
    address: "Sta. Lucia, Ilocos Sur",
    studentType: "Transferee",
    curriculum: "Secure Software Engineering Specialization",
    course: "BSCS",
    year: 3,
    section: "A",
    status: "Active",
  },
  {
    id: "FAC-014",
    name: "Faculty Test 1",
    email: "faculty1@gmail.com",
    role: "faculty",
    firstName: "Faculty",
    middleName: "Test",
    lastName: "One",
    contactNumber: "0917 100 0014",
    sex: "Female",
    birthday: "1987-02-12",
    address: "Candon City, Ilocos Sur",
    advisoryClass: "BSCS 3A",
    employmentType: "Regular",
    academicTitle: "MIT",
    position: "Assistant Professor",
    status: "Active",
  },
  {
    id: "FAC-018",
    name: "Faculty Test 2",
    email: "faculty2@gmail.com",
    role: "faculty",
    firstName: "Faculty",
    middleName: "Test",
    lastName: "Two",
    contactNumber: "0917 100 0018",
    sex: "Male",
    birthday: "1989-11-08",
    address: "San Nicolas, Candon City",
    advisoryClass: "BSCS 2B",
    employmentType: "Part Time",
    academicTitle: "LPT",
    position: "Instructor I",
    status: "Active",
  },
  {
    id: "ADM-001",
    name: "Admin Test 1",
    email: "admin1@gmail.com",
    role: "admin",
    firstName: "Admin",
    middleName: "Test",
    lastName: "One",
    contactNumber: "0917 000 0000",
    sex: "Female",
    birthday: "1985-01-01",
    address: "Candon City, Ilocos Sur",
    position: "Portal Administrator",
    status: "Active",
  },
  {
    id: "ADM-002",
    name: "Admin Test 2",
    email: "admin2@gmail.com",
    role: "admin",
    firstName: "Admin",
    middleName: "Test",
    lastName: "Two",
    contactNumber: "0917 000 0003",
    sex: "Male",
    birthday: "1986-03-17",
    address: "Candon City, Ilocos Sur",
    position: "Assistant Portal Administrator",
    status: "Active",
  },
  {
    id: "FAC-021",
    name: "Kyla Cablay",
    email: "kyla@faculty.edu",
    role: "faculty",
    firstName: "Kyla",
    middleName: "",
    lastName: "Cablay",
    contactNumber: "0917 100 0021",
    sex: "Female",
    birthday: "1990-06-18",
    address: "Vigan City, Ilocos Sur",
    advisoryClass: "BSCS 3A",
    employmentType: "Regular",
    academicTitle: "MIT",
    position: "Instructor I",
    status: "Active",
  },
  {
    id: "FAC-026",
    name: "Hezron Gagarin",
    email: "hezron@faculty.edu",
    role: "faculty",
    firstName: "Hezron",
    middleName: "",
    lastName: "Gagarin",
    contactNumber: "0917 100 0026",
    sex: "Male",
    birthday: "1988-11-25",
    address: "Sta. Maria, Ilocos Sur",
    advisoryClass: "BSCS 2B",
    employmentType: "Regular",
    academicTitle: "MS",
    position: "Instructor II",
    status: "Active",
  },
  {
    id: "FAC-027",
    name: "Maria Santos",
    email: "maria.santos@faculty.edu",
    role: "faculty",
    firstName: "Maria",
    middleName: "",
    lastName: "Santos",
    contactNumber: "0917 100 0027",
    sex: "Female",
    birthday: "1985-03-12",
    address: "Candon City, Ilocos Sur",
    advisoryClass: "BSCS 3A",
    employmentType: "Regular",
    academicTitle: "MEd",
    position: "Associate Professor",
    status: "Active",
  },
  {
    id: "2024-001310",
    name: "Rafael Ignacio",
    email: "rafael.ignacio@student.edu",
    role: "student",
    firstName: "Rafael",
    middleName: "",
    lastName: "Ignacio",
    contactNumber: "0917 000 1310",
    sex: "Male",
    birthday: "2003-08-15",
    address: "Candon City, Ilocos Sur",
    studentType: "Regular",
    curriculum: "Old Curriculum",
    course: "BSCS",
    year: 3,
    section: "A",
    status: "Active",
  },
  {
    id: "2024-001322",
    name: "Bea Castillo",
    email: "bea.castillo@student.edu",
    role: "student",
    firstName: "Bea",
    middleName: "",
    lastName: "Castillo",
    contactNumber: "0917 000 1322",
    sex: "Female",
    birthday: "2004-02-28",
    address: "Tagudin, Ilocos Sur",
    studentType: "Regular",
    curriculum: "Old Curriculum",
    course: "BSCS",
    year: 3,
    section: "A",
    status: "Active",
  },
  {
    id: "2024-002145",
    name: "Mara Dizon",
    email: "mara.dizon@student.edu",
    role: "student",
    firstName: "Mara",
    middleName: "",
    lastName: "Dizon",
    contactNumber: "0917 000 2145",
    sex: "Female",
    birthday: "2004-11-09",
    address: "Sta. Cruz, Ilocos Sur",
    studentType: "Regular",
    curriculum: "Old Curriculum",
    course: "BSCS",
    year: 2,
    section: "B",
    status: "Active",
  },
  {
    id: "2024-002146",
    name: "Luis Navarro",
    email: "luis.navarro@student.edu",
    role: "student",
    firstName: "Luis",
    middleName: "",
    lastName: "Navarro",
    contactNumber: "0917 000 2146",
    sex: "Male",
    birthday: "2003-07-19",
    address: "Bantay, Ilocos Sur",
    studentType: "Regular",
    curriculum: "Old Curriculum",
    course: "BSCS",
    year: 2,
    section: "B",
    status: "Active",
  },
  {
    id: "2024-000101",
    name: "Aria Campos",
    email: "aria.campos@student.edu",
    role: "student",
    firstName: "Aria",
    middleName: "",
    lastName: "Campos",
    contactNumber: "0917 000 0101",
    sex: "Female",
    birthday: "2005-03-05",
    address: "San Juan, Ilocos Sur",
    studentType: "Regular",
    curriculum: "New Curriculum",
    course: "BSCS",
    year: 1,
    section: "A",
    status: "Active",
  },
  {
    id: "2024-000102",
    name: "Noah Reyes",
    email: "noah.reyes@student.edu",
    role: "student",
    firstName: "Noah",
    middleName: "",
    lastName: "Reyes",
    contactNumber: "0917 000 0102",
    sex: "Male",
    birthday: "2005-09-14",
    address: "Narvacan, Ilocos Sur",
    studentType: "Regular",
    curriculum: "New Curriculum",
    course: "BSCS",
    year: 1,
    section: "A",
    status: "Active",
  },
  {
    id: "2024-004101",
    name: "Irene Mallari",
    email: "irene.mallari@student.edu",
    role: "student",
    firstName: "Irene",
    middleName: "",
    lastName: "Mallari",
    contactNumber: "0917 000 4101",
    sex: "Female",
    birthday: "2002-12-01",
    address: "Cervantes, Ilocos Sur",
    studentType: "Regular",
    curriculum: "Old Curriculum",
    course: "BSCS",
    year: 4,
    section: "A",
    status: "Active",
  },
]

export const facultySeed: FacultyRecord[] = [
  {
    id: "FAC-014",
    name: "Faculty Test 1",
    position: "Assistant Professor",
    role: "Program Chair Support",
    email: "faculty1@gmail.com",
    education: "MS Computer Science",
    status: "Available",
    notes: "Available for capstone consultation in Room 402.",
    schedule: ["Mon 9:00-11:00", "Wed 13:00-15:00"],
  },
  {
    id: "FAC-018",
    name: "Faculty Test 2",
    position: "Instructor I",
    role: "Software Engineering Coordinator",
    email: "faculty2@gmail.com",
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
  {
    id: "FAC-027",
    name: "Maria Santos",
    position: "Associate Professor",
    role: "Curriculum Coordinator",
    email: "maria.santos@faculty.edu",
    education: "MEd - Educational Technology",
    status: "Available",
    notes: "Available for curriculum consultation.",
    schedule: ["Tue 8:00-11:00", "Thu 14:00-17:00"],
  },
]

export const gradeSeed: GradeRecord[] = [
  {
    id: "GR-001",
    studentId: "2024-001245",
    student: "Student Test 1",
    section: "BSCS 3A",
    subject: "Web Systems and Technologies",
    code: "CS311",
    units: 3,
    midtermTransmuted: 92,
    midterm: 1.5,
    finalTransmuted: 96,
    finalTerm: 1.25,
    gradePercentage: 94,
    remarks: "Passed",
    released: true,
    updatedAt: "May 25, 2026",
  },
  {
    id: "GR-002",
    studentId: "2024-001245",
    student: "Student Test 1",
    section: "BSCS 3A",
    subject: "Database Systems",
    code: "CS312",
    units: 3,
    midtermTransmuted: 89,
    midterm: 1.75,
    finalTransmuted: 93,
    finalTerm: 1.5,
    gradePercentage: 91,
    remarks: "Passed",
    released: true,
    updatedAt: "May 24, 2026",
  },
  {
    id: "GR-003",
    studentId: "2024-001245",
    student: "Student Test 1",
    section: "BSCS 3A",
    subject: "Software Engineering",
    code: "CS313",
    units: 3,
    midtermTransmuted: 96,
    midterm: 1.25,
    finalTransmuted: 98,
    finalTerm: 1.25,
    gradePercentage: 97,
    remarks: "Passed",
    released: true,
    updatedAt: "May 26, 2026",
  },
  {
    id: "GR-004",
    studentId: "2024-001284",
    student: "Student Test 2",
    section: "BSCS 3A",
    subject: "Web Systems and Technologies",
    code: "CS311",
    units: 3,
    midtermTransmuted: 87,
    midterm: 2,
    finalTransmuted: 89,
    finalTerm: 1.75,
    gradePercentage: 88,
    remarks: "Passed",
    released: true,
    updatedAt: "May 23, 2026",
  },
  {
    id: "GR-005",
    studentId: "2024-002145",
    student: "Mara Dizon",
    section: "BSCS 2B",
    subject: "Operating Systems",
    code: "CS304",
    units: 3,
    midtermTransmuted: 84,
    midterm: 2.25,
    finalTransmuted: 88,
    finalTerm: 2,
    gradePercentage: 86,
    remarks: "Passed",
    released: false,
    updatedAt: "May 26, 2026",
  },
  {
    id: "GR-006",
    studentId: "2024-002146",
    student: "Luis Navarro",
    section: "BSCS 2B",
    subject: "Operating Systems",
    code: "CS304",
    units: 3,
    midtermTransmuted: 79,
    midterm: 2.75,
    finalTransmuted: 82,
    finalTerm: 2.5,
    gradePercentage: 80.5,
    remarks: "Passed",
    released: false,
    updatedAt: "May 26, 2026",
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
    pdfUrl: sampleThesisPdfUrl,
    fileName: "ai-powered-campus-management-system.pdf",
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
    pdfUrl: sampleThesisPdfUrl,
    fileName: "mobile-attendance-monitoring-for-computing-studies.pdf",
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
    pdfUrl: sampleThesisPdfUrl,
    fileName: "web-based-thesis-archive-with-metadata-search.pdf",
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
    studentName: "Student Test 1",
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
    instructor: "Faculty Test 1",
    section: "BSCS 3A",
  },
  {
    id: "SCH-002",
    day: "Tuesday",
    time: "10:00 AM - 12:00 PM",
    subject: "Data Structures",
    room: "Room 301",
    instructor: "Faculty Test 1",
    section: "BSCS 3A",
  },
  {
    id: "SCH-003",
    day: "Wednesday",
    time: "1:00 PM - 3:00 PM",
    subject: "Software Engineering",
    room: "Room 205",
    instructor: "Faculty Test 2",
    section: "BSCS 1A",
  },
  {
    id: "SCH-004",
    day: "Thursday",
    time: "9:00 AM - 11:00 AM",
    subject: "Database Systems",
    room: "Lab 204",
    instructor: "Faculty Test 1",
    section: "BSCS 2B",
  },
  {
    id: "SCH-005",
    day: "Friday",
    time: "1:00 PM - 3:00 PM",
    subject: "Thesis Consultation",
    room: "Room 402",
    instructor: "Faculty Test 2",
    section: "BSCS 4A",
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

export const curriculumCatalogSeed: CurriculumRecord[] = [
  {
    id: "CURR-001",
    name: "Old Curriculum",
    major: "CMO No. 25 Series 2015",
    status: "Active",
    totalUnits: 166,
    terms: [
      {
        year: "First Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("CS 101", "Introduction to Computing", 3, 0, 3),
          curriculumSubject("CS 102", "Fundamentals of Programming", 2, 1, 3),
          curriculumSubject("Gen Ed 103", "Mathematics in the Modern World", 3, 0, 3),
          curriculumSubject("Gen Ed 104", "Understanding the Self", 3, 0, 3),
          curriculumSubject("GE Elec 1", "People and the Earth's Ecosystems", 3, 0, 3),
          curriculumSubject("Gen Ed 110", "The Entrepreneurial Mind", 3, 0, 3),
          curriculumSubject("PATHFit 1", "Movement Competency Training or MCT", 2, 0, 2),
          curriculumSubject("NSTP 1", "CWTS/ROTC 1", 3, 0, 3),
        ],
      },
      {
        year: "First Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("CS 104", "Discrete Structures 1", 3, 0, 3),
          curriculumSubject("CS 103", "Intermediate Programming", 2, 1, 3),
          curriculumSubject("CS 105", "Fundamentals of Human Computer Interaction", 3, 0, 3),
          curriculumSubject("Gen Ed 101", "Purposive Communication", 3, 0, 3),
          curriculumSubject("PATHFit 2", "Exercise-based Fitness Activities", 2, 0, 2),
          curriculumSubject("GE Elec 2", "Philippine Popular Culture", 3, 0, 3),
          curriculumSubject("NSTP 2", "CWTS/ROTC 2", 3, 0, 3),
        ],
      },
      {
        year: "Second Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("CS 201", "Data Structures and Algorithms", 2, 1, 3),
          curriculumSubject("CS 202", "Discrete Structures 2", 3, 0, 3),
          curriculumSubject("Gen Ed 107", "The Contemporary World", 3, 0, 3),
          curriculumSubject("Gen Ed 108", "Art Appreciation", 3, 0, 3),
          curriculumSubject("PATHFit 3", "Dances", 2, 0, 2),
          curriculumSubject("CS 203", "Social Issues and Professional Practices", 3, 0, 3),
          curriculumSubject("CS 204", "Parallel and Distributed Computing", 3, 0, 3),
          curriculumSubject("CS 205", "Object-Oriented Programming", 2, 1, 3),
        ],
      },
      {
        year: "Second Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("CS 206", "System Fundamentals", 3, 0, 3),
          curriculumSubject("Gen Ed 106", "Ethics", 3, 0, 3),
          curriculumSubject("CS 207", "Information Management", 2, 1, 3),
          curriculumSubject("CS 208", "Architecture and Organization", 2, 1, 3),
          curriculumSubject("Gen Ed 105", "Science, Technology and Society", 3, 0, 3),
          curriculumSubject("CS 209", "Applications Development and Emerging Technologies", 2, 1, 3),
          curriculumSubject("Math", "Differential and Integral Calculus", 3, 0, 3),
          curriculumSubject("PATHFit 4", "Sports", 2, 0, 2),
        ],
      },
      {
        year: "Third Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("CS 301", "Programming Languages", 2, 1, 3),
          curriculumSubject("CS 302", "Automata Theory and Formal Languages", 3, 0, 3),
          curriculumSubject("CS 303", "Networks and Communications", 2, 1, 3),
          curriculumSubject("CS 304", "Operating Systems", 2, 1, 3),
          curriculumSubject("CS 305", "Software Engineering 1", 2, 1, 3),
          curriculumSubject("CS 306", "Computational Science", 3, 0, 3),
          curriculumSubject("CS 307", "Quantitative Methods", 3, 0, 3),
          curriculumSubject("Elective 1", "Communicating Effectively", 3, 0, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("CS 308", "Software Engineering 2: Implementation and Management", 2, 1, 3),
          curriculumSubject("CS 309", "Algorithm and Complexity", 3, 0, 3),
          curriculumSubject("CS 310", "Intelligent System", 2, 1, 3),
          curriculumSubject("Gen Ed 102", "Readings in Philippine History", 3, 0, 3),
          curriculumSubject("CS 311", "Graphics and Visual Arts Computing", 2, 1, 3),
          curriculumSubject("CS 312", "Research Methodology", 3, 0, 3),
          curriculumSubject("CS 313", "Web Development", 2, 1, 3),
          curriculumSubject("Elective 2", "Creative Writing", 3, 0, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "Mid Year",
        subjects: [
          curriculumSubject("CS 314", "OJT/Practicum (200 hours)", 3, 0, 3),
        ],
      },
      {
        year: "Fourth Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("CS 401", "Seminars and Tours", 1, 0, 1),
          curriculumSubject("CS 404", "Project Study 1", 3, 0, 3),
          curriculumSubject("CS 402", "Multimedia System", 2, 11, 13),
          curriculumSubject("Rizal", "Rizal's Life and Works", 3, 0, 3),
        ],
      },
      {
        year: "Fourth Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("CS 403", "Information Assurance and Security", 2, 1, 3),
          curriculumSubject("CS 405", "Project Study 2", 3, 0, 3),
        ],
      },
    ],
  },
  {
    id: "CURR-002",
    name: "New Curriculum",
    major: "Embedded Systems and AI Specialization",
    status: "Active",
    totalUnits: 168,
    terms: [
      {
        year: "First Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("Gen Ed 101", "Understanding The Self", 3, 0, 3),
          curriculumSubject("Gen Ed 102", "Mathematics in the Modern World", 3, 0, 3),
          curriculumSubject("GE Elec 101", "People and Earth's Ecosystem", 3, 0, 3),
          curriculumSubject("Gen Ed 103", "The Entrepreneurial Mind", 3, 0, 3),
          curriculumSubject("PATHFit 1", "Movement Competency Training or MCT", 2, 0, 2),
          curriculumSubject("NSTP 1", "CWTS 1 / ROTC 1", 3, 0, 3),
          curriculumSubject("CC101", "Introduction to Computing", 2, 1, 3),
          curriculumSubject("CC102", "Fundamentals of Programming", 2, 1, 3),
        ],
      },
      {
        year: "First Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("Gen Ed 104", "Art Appreciation", 3, 0, 3),
          curriculumSubject("PATHFit 2", "Exercise-based Fitness Activities", 2, 0, 2),
          curriculumSubject("NSTP 2", "CWTS 2 / ROTC 2", 3, 0, 3),
          curriculumSubject("CC103", "Intermediate Programming", 2, 1, 3),
          curriculumSubject("CC104", "Data Structures and Algorithms", 2, 1, 3),
          curriculumSubject("CC105", "Information Management", 2, 1, 3),
          curriculumSubject("CS 101", "Fundamentals of HCI and Office Application", 2, 1, 3),
          curriculumSubject("CS 102", "Discrete Structures", 3, 0, 3),
          curriculumSubject("CS 103", "Object-Oriented Programming", 2, 1, 3),
        ],
      },
      {
        year: "Second Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("Gen Ed 105", "Science, Technology, and Society", 3, 0, 3),
          curriculumSubject("Math 1", "Calculus 1", 3, 0, 3),
          curriculumSubject("Gen Ed 106", "Probability and Statistics", 3, 0, 3),
          curriculumSubject("PATHFit 3", "Choice of Dances", 2, 0, 2),
          curriculumSubject("CS 104", "Programming Languages", 2, 1, 3),
          curriculumSubject("CS 105", "Data Communication and Networks 1", 2, 1, 3),
          curriculumSubject("CS 106", "Web Development 1", 2, 1, 3),
          curriculumSubject("CC 106", "Applications Development and Emerging Technologies", 2, 1, 3),
          curriculumSubject("CS 107", "Systems Analysis and Design", 2, 1, 3),
        ],
      },
      {
        year: "Second Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("Gen Ed 107", "Purposive Communication", 3, 0, 3),
          curriculumSubject("Gen Ed 108", "Readings in Philippine History", 3, 0, 3),
          curriculumSubject("PATHFit 4", "Sports", 2, 0, 2),
          curriculumSubject("CS 108", "Web Development 2", 2, 1, 3),
          curriculumSubject("CS 109", "Intelligent and Embedded Systems", 2, 1, 3),
          curriculumSubject("CS 110", "Software Engineering and Software Testing", 2, 1, 3),
          curriculumSubject("CS 111", "Parallel and Distributed Computing", 2, 1, 3),
          curriculumSubject("CS 112", "Multimedia Systems and Animation", 2, 1, 3),
          curriculumSubject("CS Elective 1", "Advanced Embedded Systems", 2, 1, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("GE Elec 102", "Philippine Popular Culture", 3, 0, 3),
          curriculumSubject("GE Elec 103", "Reading Visual Art", 3, 0, 3),
          curriculumSubject("Math 2", "Calculus 2", 3, 0, 3),
          curriculumSubject("CS 113", "Data Communications and Networks 2", 2, 1, 3),
          curriculumSubject("CS 114", "Graphics and Visual Arts Computing", 2, 1, 3),
          curriculumSubject("CS 115", "Automata Theory and Formal Languages", 3, 0, 3),
          curriculumSubject("CS 116", "Algorithm and Complexity", 3, 0, 3),
          curriculumSubject("CS Elective 2", "Wireless Sensor Networks", 2, 1, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("Gen Ed 109", "Contemporary World", 3, 0, 3),
          curriculumSubject("Gen Ed 110", "Ethics", 3, 0, 3),
          curriculumSubject("Gen Ed 111", "Gender and Society", 3, 0, 3),
          curriculumSubject("GE Elec 104", "Communicating Effectively", 3, 0, 3),
          curriculumSubject("CS 117", "Quantitative Methods - Advanced Statistics", 2, 0, 3),
          curriculumSubject("CS 118", "Operating Systems and Architecture Organization", 2, 1, 3),
          curriculumSubject("Thesis 1", "Thesis Study 1", 1, 0, 3),
          curriculumSubject("CS Elective 3", "Edge Computing and AI", 2, 1, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "Mid Year",
        subjects: [
          curriculumSubject("OJT", "Industry Immersion (280 hours)", 1, 0, 3),
        ],
      },
      {
        year: "Fourth Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("Thesis 2", "Thesis Study 2", 1, 0, 3),
          curriculumSubject("CS 119", "Seminars and Tours", 1, 0, 1),
        ],
      },
      {
        year: "Fourth Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("CS 120", "Technopreneurship", 3, 0, 3),
          curriculumSubject("CS 121", "Social and Professional Practice", 3, 0, 3),
          curriculumSubject("CS 122", "Computational Science", 3, 0, 3),
          curriculumSubject("Rizal", "Rizal's Life and Works", 3, 0, 3),
        ],
      },
    ],
  },
  {
    id: "CURR-003",
    name: "New Curriculum",
    major: "Secure Software Engineering Specialization",
    status: "Active",
    totalUnits: 168,
    terms: [
      {
        year: "First Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("Gen Ed 101", "Understanding The Self", 3, 0, 3),
          curriculumSubject("Gen Ed 102", "Mathematics in the Modern World", 3, 0, 3),
          curriculumSubject("GE Elec 101", "People and Earth's Ecosystem", 3, 0, 3),
          curriculumSubject("Gen Ed 103", "The Entrepreneurial Mind", 3, 0, 3),
          curriculumSubject("PATHFit 1", "Movement Competency Training or MCT", 2, 0, 2),
          curriculumSubject("NSTP 1", "CWTS 1 / ROTC 1", 3, 0, 3),
          curriculumSubject("CC101", "Introduction to Computing", 2, 1, 3),
          curriculumSubject("CC102", "Fundamentals of Programming", 2, 1, 3),
        ],
      },
      {
        year: "First Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("Gen Ed 104", "Art Appreciation", 3, 0, 3),
          curriculumSubject("PATHFit 2", "Exercise-based Fitness Activities", 2, 0, 2),
          curriculumSubject("NSTP 2", "CWTS 2 / ROTC 2", 3, 0, 3),
          curriculumSubject("CC103", "Intermediate Programming", 2, 1, 3),
          curriculumSubject("CC104", "Data Structures and Algorithms", 2, 1, 3),
          curriculumSubject("CC105", "Information Management", 2, 1, 3),
          curriculumSubject("CS 101", "Fundamentals of HCI and Office Application", 2, 1, 3),
          curriculumSubject("CS 102", "Discrete Structures", 3, 0, 3),
          curriculumSubject("CS 103", "Object-Oriented Programming", 2, 1, 3),
        ],
      },
      {
        year: "Second Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("Gen Ed 105", "Science, Technology, and Society", 3, 0, 3),
          curriculumSubject("Math 1", "Calculus 1", 3, 0, 3),
          curriculumSubject("Gen Ed 106", "Probability and Statistics", 3, 0, 3),
          curriculumSubject("PATHFit 3", "Choice of Dances", 2, 0, 2),
          curriculumSubject("CS 104", "Programming Languages", 2, 1, 3),
          curriculumSubject("CS 105", "Data Communication and Networks 1", 2, 1, 3),
          curriculumSubject("CS 106", "Web Development 1", 2, 1, 3),
          curriculumSubject("CC 106", "Applications Development and Emerging Technologies", 2, 1, 3),
          curriculumSubject("CS 107", "Systems Analysis and Design", 2, 1, 3),
        ],
      },
      {
        year: "Second Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("Gen Ed 107", "Purposive Communication", 3, 0, 3),
          curriculumSubject("Gen Ed 108", "Readings in Philippine History", 3, 0, 3),
          curriculumSubject("PATHFit 4", "Sports", 2, 0, 2),
          curriculumSubject("CS 108", "Web Development 2", 2, 1, 3),
          curriculumSubject("CS 109", "Intelligent and Embedded Systems", 2, 1, 3),
          curriculumSubject("CS 110", "Software Engineering and Software Testing", 2, 1, 3),
          curriculumSubject("CS 111", "Parallel and Distributed Computing", 2, 1, 3),
          curriculumSubject("CS 112", "Multimedia Systems and Animation", 2, 1, 3),
          curriculumSubject("CS Elective 1", "Principles of Blockchain", 2, 1, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("GE Elec 102", "Philippine Popular Culture", 3, 0, 3),
          curriculumSubject("GE Elec 103", "Reading Visual Art", 3, 0, 3),
          curriculumSubject("Math 2", "Calculus 2", 3, 0, 3),
          curriculumSubject("CS 113", "Data Communications and Networks 2", 2, 1, 3),
          curriculumSubject("CS 114", "Graphics and Visual Arts Computing", 2, 1, 3),
          curriculumSubject("CS 115", "Automata Theory and Formal Languages", 3, 0, 3),
          curriculumSubject("CS 116", "Algorithm and Complexity", 3, 0, 3),
          curriculumSubject("CS Elective 2", "Continuous Integration/Continuous Deployment (CI/CD)", 2, 1, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("Gen Ed 109", "Contemporary World", 3, 0, 3),
          curriculumSubject("Gen Ed 110", "Ethics", 3, 0, 3),
          curriculumSubject("Gen Ed 111", "Gender and Society", 3, 0, 3),
          curriculumSubject("GE Elec 104", "Communicating Effectively", 3, 0, 3),
          curriculumSubject("CS 117", "Quantitative Methods - Advanced Statistics", 2, 0, 3),
          curriculumSubject("CS 118", "Operating Systems and Architecture Organization", 2, 1, 3),
          curriculumSubject("Thesis 1", "Thesis Study 1", 1, 0, 3),
          curriculumSubject("CS Elective 3", "Secure Software Development (Web3)", 2, 1, 3),
        ],
      },
      {
        year: "Third Year",
        semester: "Mid Year",
        subjects: [
          curriculumSubject("OJT", "Industry Immersion (280 hours)", 1, 0, 3),
        ],
      },
      {
        year: "Fourth Year",
        semester: "First Semester",
        subjects: [
          curriculumSubject("Thesis 2", "Thesis Study 2", 1, 0, 3),
          curriculumSubject("CS 119", "Seminars and Tours", 1, 0, 1),
        ],
      },
      {
        year: "Fourth Year",
        semester: "Second Semester",
        subjects: [
          curriculumSubject("CS 120", "Technopreneurship", 3, 0, 3),
          curriculumSubject("CS 121", "Social and Professional Practice", 3, 0, 3),
          curriculumSubject("CS 122", "Computational Science", 3, 0, 3),
          curriculumSubject("Rizal", "Rizal's Life and Works", 3, 0, 3),
        ],
      },
    ],
  },
]

export const yearSectionsSeed = [
  {
    year: "First Year",
    sections: ["BSCS 1A", "BSCS 1B", "BSCS 1C", "BSCS 1D"],
  },
  {
    year: "Second Year",
    sections: ["BSCS 2A", "BSCS 2B", "BSCS 2C", "BSCS 2D"],
  },
  {
    year: "Third Year",
    sections: ["BSCS 3A", "BSCS 3B", "BSCS 3C"],
  },
  {
    year: "Fourth Year",
    sections: ["BSCS 4A", "BSCS 4B", "BSCS 4C"],
  },
]

export const classRosterSeed: ClassStudent[] = [
  {
    id: "2024-001245",
    name: "Student Test 1",
    section: "BSCS 3A",
    enrolled: true,
  },
  {
    id: "2024-001284",
    name: "Student Test 2",
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
    id: "2024-002145",
    name: "Mara Dizon",
    section: "BSCS 2B",
    enrolled: true,
  },
  {
    id: "2024-002146",
    name: "Luis Navarro",
    section: "BSCS 2B",
    enrolled: true,
  },
  {
    id: "2024-000101",
    name: "Aria Campos",
    section: "BSCS 1A",
    enrolled: true,
  },
  {
    id: "2024-000102",
    name: "Noah Reyes",
    section: "BSCS 1A",
    enrolled: true,
  },
  {
    id: "2024-004101",
    name: "Irene Mallari",
    section: "BSCS 4A",
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

export type SemesterRecord = {
  id: string
  name: string
  schoolYear: string
  enrollment: string
  gradeSubmission: string
}

export type SubjectRecord = {
  code: string
  title: string
  units: number
  instructor: string
}

export const semestersSeed: SemesterRecord[] = [
  {
    id: "SEM-001",
    name: "2nd Semester",
    schoolYear: "2025-2026",
    enrollment: "Open",
    gradeSubmission: "May 20 - June 5, 2026",
  },
  {
    id: "SEM-002",
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
  {
    code: "CS304",
    title: "Operating Systems",
    units: 3,
    instructor: "Hezron Gagarin",
  },
  {
    code: "CS201",
    title: "Data Structures",
    units: 3,
    instructor: "Faculty Test 1",
  },
  {
    code: "CS400",
    title: "Thesis Consultation",
    units: 3,
    instructor: "Faculty Test 2",
  },
]

export const auditLogsSeed = [
  {
    id: "LOG-001",
    actor: "Faculty Test 1",
    action: "Uploaded final grade for CS311",
    time: "May 26, 2026 10:32 AM",
  },
  {
    id: "LOG-002",
    actor: "Admin Test 1",
    action: "Updated seminar slot capacity",
    time: "May 26, 2026 9:12 AM",
  },
  {
    id: "LOG-003",
    actor: "Student Test 1",
    action: "Submitted feedback ticket FB-1001",
    time: "May 25, 2026 3:48 PM",
  },
]
