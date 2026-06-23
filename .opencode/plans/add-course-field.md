# Add Course Field to User Management

## Files to Create

### 1. `lib/constants/courses.ts` — Course options constant
```ts
export const COURSE_OPTIONS = [
  "Bachelor of Science in Computer Science (BSCS)",
] as const

export type Course = (typeof COURSE_OPTIONS)[number]

export function isCourse(value: string): value is Course {
  return COURSE_OPTIONS.includes(value as Course)
}
```

### 2. `scripts/migrate-user-course.ts` — Backfill for existing users
```ts
import "dotenv/config"
import { UserModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"

async function migrate() {
  await connectToDatabase()

  const result = await UserModel.updateMany(
    { course: { $exists: false } },
    { $set: { course: "Bachelor of Science in Computer Science (BSCS)" } }
  )

  console.log(`Updated ${result.modifiedCount} users with default course.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
```

## Files to Modify

### 3. `features/portal/hooks/use-portal-dashboard-model.ts`

**a) Add `course` to `newUser` state (line 294)**
Add after `academicTitle: "MIT",`:
```
    course: "Bachelor of Science in Computer Science (BSCS)",
```

**b) Replace hardcoded `course` in `handleAddUser` payload (line 1500)**
Change:
```ts
course: newUser.role === "student" ? "BSCS" : undefined,
```
To:
```ts
course: newUser.course,
```

**c) Replace hardcoded `course` in optimistic local state (line 1526)**
Change:
```ts
course: newUser.role === "student" ? "BSCS" : undefined,
```
To:
```ts
course: newUser.course,
```

**d) Import `COURSE_OPTIONS` from constants**
Add import at top:
```ts
import { COURSE_OPTIONS } from "@/lib/constants/courses"
```

### 4. `features/portal/components/modules/users-module.tsx`

**a) Import `COURSE_OPTIONS`**
Add at top with other imports:
```ts
import { COURSE_OPTIONS } from "@/lib/constants/courses"
```

**b) Add Course dropdown to Add User form (after line 768, after Role field)**
```tsx
<div>
  <p className="mb-1.5 text-sm font-medium text-foreground">Course *</p>
  <Select
    value={newUser.course}
    onChange={(value) =>
      setNewUser((current) => ({ ...current, course: value }))
    }
    options={[...COURSE_OPTIONS]}
  />
</div>
```

**c) Add Course dropdown to Edit User dialog (after line 1598, after Email field)**
```tsx
<div>
  <p className="mb-1.5 text-sm font-medium text-foreground">Course</p>
  <Select
    value={editUser.course ?? COURSE_OPTIONS[0]}
    onChange={(value) =>
      setEditUser({ ...editUser, course: value })
    }
    options={[...COURSE_OPTIONS]}
  />
</div>
```

### 5. `scripts/seed.ts` — Add course to admin accounts
Add `course: "Bachelor of Science in Computer Science (BSCS)"` to both admin account objects (after line 140 and line 149).

## Execution Order
1. Create `lib/constants/courses.ts`
2. Modify `use-portal-dashboard-model.ts` (state, imports, payload)
3. Modify `users-module.tsx` (imports, Add form, Edit dialog)
4. Update `scripts/seed.ts`
5. Create `scripts/migrate-user-course.ts`
6. Run migration: `npx tsx scripts/migrate-user-course.ts`

## Verification
- Add User form shows Course dropdown with BSCS selected by default
- Form validates course is selected before submit
- API response includes `course` field
- Edit User dialog shows and allows changing course
- Seed script creates admins with course populated
- Migration backfills all existing users
