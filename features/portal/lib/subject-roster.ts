function normalize(s?: string | null) {
  return (s ?? "").replace(/\s+/g, "").toLowerCase()
}

export type SubjectRosterEntry = {
  id: string
  name: string
  section: string
  gradeId?: string
  released: boolean
  enrolled: boolean
  deletedAt?: string | null
  firstName?: string
  middleName?: string
  lastName?: string
}

type RawRosterItem = {
  id: string
  name: string
  section: string
  enrolled: boolean
  deletedAt?: string | null
  firstName?: string
  middleName?: string
  lastName?: string
}

type RawGradeItem = {
  id: string
  studentId: string
  student: string
  section?: string
  subject: string
  released?: boolean
  deletedAt?: string | null
}

type RawUserItem = {
  id: string
  studentType?: string
  deletedAt?: string | null
  firstName?: string
  middleName?: string
  lastName?: string
  gradeHistory?: Array<{
    subjectCode: string
    remarks?: string
  }>
}

export function getSubjectRoster(params: {
  roster: RawRosterItem[]
  grades: RawGradeItem[]
  users: RawUserItem[]
  subject: string
  subjectCode: string
  section: string | null
  sections: string[]
}): SubjectRosterEntry[] {
  const { roster, grades, users, subject, subjectCode, section, sections } = params
  const normSubject = normalize(subject)
  const normCode = normalize(subjectCode)

  const sectionSet = new Set(
    section ? [normalize(section)] : sections.map(normalize)
  )

  const result: SubjectRosterEntry[] = []
  const seen = new Set<string>()

  for (const g of grades) {
    if (g.deletedAt) continue
    if (
      normalize(g.subject ?? "") !== normSubject ||
      !sectionSet.has(normalize(g.section ?? ""))
    ) continue

    if (seen.has(g.studentId)) continue
    seen.add(g.studentId)

    const user = users.find((u) => u.id === g.studentId)
    result.push({
      id: g.studentId,
      name: g.student,
      section: g.section ?? "",
      gradeId: g.id,
      released: g.released ?? false,
      enrolled: true,
      firstName: user?.firstName,
      middleName: user?.middleName,
      lastName: user?.lastName,
    })
  }

  return result
}
