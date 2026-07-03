const IRREGULAR_TYPES = ["Irregular", "Transferee", "Shifter"]

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

  const passedIds = new Set(
    users
      .filter(
        (u) =>
          (u.gradeHistory ?? []).some(
            (h) =>
              normalize(h.subjectCode) === normCode &&
              h.remarks?.toLowerCase() === "passed"
          )
      )
      .map((u) => u.id)
  )

  const passedIrregularIds = new Set(
    users
      .filter(
        (u) =>
          IRREGULAR_TYPES.includes(u.studentType ?? "") &&
          (u.gradeHistory ?? []).some(
            (h) =>
              normalize(h.subjectCode) === normCode &&
              h.remarks?.toLowerCase() === "passed"
          )
      )
      .map((u) => u.id)
  )

  const result: SubjectRosterEntry[] = []
  const seen = new Set<string>()

  for (const g of grades) {
    if (g.deletedAt) continue
    if (
      normalize(g.subject ?? "") !== normSubject ||
      !sectionSet.has(normalize(g.section ?? ""))
    ) continue

    if (passedIrregularIds.has(g.studentId)) continue
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
