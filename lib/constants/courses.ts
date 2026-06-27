export const COURSE_OPTIONS = [
  "Bachelor of Science in Computer Science (BSCS)",
] as const

export type Course = (typeof COURSE_OPTIONS)[number]

export function isCourse(value: string): value is Course {
  return COURSE_OPTIONS.includes(value as Course)
}

export function abbreviateCourse(course: string): string {
  const match = course.match(/\(([^)]+)\)/)
  return match ? match[1] : course
}
