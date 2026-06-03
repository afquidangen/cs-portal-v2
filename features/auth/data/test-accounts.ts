import type { Role } from "@/features/portal/data/portal-data"

export type TestAccount = {
  email: string
  password: string
  role: Role
  name: string
  title: string
  id: string
  route: `/${Role}`
}

export const testAccounts: TestAccount[] = [
  {
    email: "admin1@gmail.com",
    password: "admintest123",
    role: "admin",
    name: "Admin Test 1",
    title: "System Administrator - CS Department",
    id: "ADM-001",
    route: "/admin",
  },
  {
    email: "admin2@gmail.com",
    password: "admintest123",
    role: "admin",
    name: "Admin Test 2",
    title: "Assistant Portal Administrator",
    id: "ADM-002",
    route: "/admin",
  },
  {
    email: "faculty1@gmail.com",
    password: "facultytest123",
    role: "faculty",
    name: "Faculty Test 1",
    title: "Assistant Professor - Computer Science",
    id: "FAC-014",
    route: "/faculty",
  },
  {
    email: "faculty2@gmail.com",
    password: "facultytest123",
    role: "faculty",
    name: "Faculty Test 2",
    title: "Instructor I - Computer Science",
    id: "FAC-018",
    route: "/faculty",
  },
  {
    email: "student1@gmail.com",
    password: "studenttest123",
    role: "student",
    name: "Student Test 1",
    title: "BSCS 3A - Regular Student",
    id: "2024-001245",
    route: "/student",
  },
  {
    email: "student2@gmail.com",
    password: "studenttest123",
    role: "student",
    name: "Student Test 2",
    title: "BSCS 3A - Regular Student",
    id: "2024-001284",
    route: "/student",
  },
]

export const testSessionStorageKey = "comsite-test-session"
