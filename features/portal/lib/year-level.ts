export const YEAR_LEVELS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
] as const

export type YearLevel = (typeof YEAR_LEVELS)[number]

const YEAR_LEVEL_MAP: Record<string, YearLevel> = {
  "1st year": "First Year",
  "first year": "First Year",
  "2nd year": "Second Year",
  "second year": "Second Year",
  "3rd year": "Third Year",
  "third year": "Third Year",
  "4th year": "Fourth Year",
  "fourth year": "Fourth Year",
  "5th year": "Fifth Year",
  "fifth year": "Fifth Year",
}

export function normalizeYearLevel(raw?: string | null): YearLevel | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  return YEAR_LEVEL_MAP[key] ?? null
}

export function isYearLevel(value: string): value is YearLevel {
  return YEAR_LEVELS.includes(value as YearLevel)
}
