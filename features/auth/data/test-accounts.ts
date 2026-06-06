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
]

export const testSessionStorageKey = "comsite-test-session"
