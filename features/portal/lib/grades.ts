import type { GradeRecord } from "../data/portal-data"

export const gradeRemarkOptions = [
  "Passed", "Failed", "INC", "Dropped", "Unofficial Drop",
]

const EQUIVALENT_GRADES = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 4.0, 5.0] as const
export type EquivalentGrade = (typeof EQUIVALENT_GRADES)[number]
export { EQUIVALENT_GRADES }

const DEFAULT_CLIENT_TABLE: Record<string, number> = {
  "97-100": 1.0, "94-96": 1.25, "91-93": 1.5, "88-90": 1.75,
  "85-87": 2.0, "82-84": 2.25, "79-81": 2.5, "76-78": 2.75,
  "75": 3.0, "72-74": 4.0, "0-71": 5.0,
}

export function transmutedToEquivalent(score: number): number {
  const entries = Object.entries(DEFAULT_CLIENT_TABLE).sort(([a], [b]) => {
    const aHigh = a.includes("-") ? Number(a.split("-")[1]) : Number(a)
    const bHigh = b.includes("-") ? Number(b.split("-")[1]) : Number(b)
    return bHigh - aHigh
  })
  for (const [range, equiv] of entries) {
    if (range.includes("-")) {
      const [low, high] = range.split("-").map(Number)
      if (score >= low && score <= high) return equiv
    } else {
      const val = Number(range)
      if (score >= val) return equiv
    }
  }
  return 5.0
}

export function equivalentToPercentage(equiv: number): number {
  const map: Record<number, number> = {
    1.0: 98.5, 1.25: 95.5, 1.5: 92.5, 1.75: 89.5,
    2.0: 86.5, 2.25: 83.5, 2.5: 80.5, 2.75: 77.5,
    3.0: 75.0, 4.0: 73.0, 5.0: 35.5,
  }
  return map[equiv] ?? 0
}

export function calculateFinalGrade(record: GradeRecord) {
  if (record.midtermTransmuted !== undefined && record.finalTransmuted !== undefined) {
    return Number(((record.midtermTransmuted + record.finalTransmuted) / 2).toFixed(2))
  }
  if (record.midterm !== undefined && record.finalTerm !== undefined) {
    return Number(((record.midterm + record.finalTerm) / 2).toFixed(2))
  }
  return 0
}

export function calculateGradePercentage(record: GradeRecord) {
  if (record.finalGrade !== undefined) return record.finalGrade
  if (record.gradePercentage !== undefined) return record.gradePercentage
  if (record.midtermGrade !== undefined && record.tentativeFinalGrade !== undefined) {
    return Number(((record.midtermGrade + record.tentativeFinalGrade) / 2).toFixed(2))
  }
  if (record.midtermTransmuted !== undefined && record.finalTransmuted !== undefined) {
    return Number(((record.midtermTransmuted + record.finalTransmuted) / 2).toFixed(2))
  }
  return undefined
}

export function gradeRemarks(grade: number, remarks?: string) {
  if (remarks && remarks !== "Passed") return remarks
  if (grade <= 1.5) return "Dean\'s List pace"
  if (grade <= 3) return "Passed"
  return "Needs remediation"
}

function isDisqualifyingRemark(fields: Array<string | null | undefined>): boolean {
  const keywords = ["drop", "inc", "failed", "d", "od"]
  return fields.some((field) => {
    if (!field) return false
    const r = field.toLowerCase().trim()
    return keywords.some((k) => r === k || (k.length > 1 && r.includes(k)))
  })
}

export type DeansListResult = {
  eligible: boolean
  gwa: number | null
  honors: "Dean's List" | null
  reasons: string[]
}

export function computeDeansList(
  grades: GradeRecord[]
): DeansListResult {
  const reasons: string[] = []

  const filtered = grades.filter((g) => {
    return g.transmutedGrade !== undefined && g.released === true
  })

  console.log(`[DeansList] Processing ${filtered.length} subjects with released grades`)

  for (const g of filtered) {
    const disqualified = isDisqualifyingRemark([g.finalRemarks, g.midtermRemarks])
    console.log(
      `[DeansList]   ${g.code ?? g.subject}: transmuted=${g.transmutedGrade?.toFixed(2)}, ` +
      `remarks="${g.remarks ?? ""}", finalRemarks="${g.finalRemarks ?? ""}", ` +
      `midtermRemarks="${g.midtermRemarks ?? ""}", disqualified=${disqualified}`
    )
  }

  if (filtered.length === 0) {
    console.log("[DeansList] No graded subjects (no released grades with transmuted values)")
    return { eligible: false, gwa: null, honors: null, reasons: ["No graded subjects"] }
  }

  const totalUnits = grades.reduce((sum, g) => sum + (g.units ?? 0), 0)
  const passUnits = totalUnits >= 17
  console.log(`[DeansList] Total Units: ${totalUnits} ${passUnits ? "PASS" : "FAIL"}`)
  if (!passUnits) {
    reasons.push(`Total enrolled units (${totalUnits}) is less than the required 17 units`)
  }

  const gwa = Number((filtered.reduce((sum, g) => sum + (g.transmutedGrade ?? 0), 0) / filtered.length).toFixed(2))
  const passGwa = gwa <= 1.75
  console.log(`[DeansList] GWA: ${gwa.toFixed(2)} ${passGwa ? "PASS" : "FAIL"}`)
  if (!passGwa) {
    reasons.push(`GWA of ${gwa.toFixed(2)} exceeds the 1.75 threshold`)
  }

  const gradeWith25 = filtered.find((g) => (g.transmutedGrade ?? 0) >= 2.50)
  const passNo25 = !gradeWith25
  console.log(`[DeansList] Has Grade >= 2.50: ${gradeWith25 ? `YES (${gradeWith25.transmutedGrade?.toFixed(2)} in ${gradeWith25.subject})` : "NO"} ${passNo25 ? "PASS" : "FAIL"}`)
  if (!passNo25) {
    reasons.push(
      `No grade of 2.50 or higher — found ${gradeWith25.transmutedGrade?.toFixed(2)} in ${gradeWith25.subject}`
    )
  }

  const hasBadRemarks = filtered.some((g) =>
    isDisqualifyingRemark([g.finalRemarks, g.midtermRemarks])
  )
  console.log(`[DeansList] Has INC/Failed/Dropped (released grades): ${hasBadRemarks} ${!hasBadRemarks ? "PASS" : "FAIL"}`)
  if (hasBadRemarks) {
    const offenders = filtered
      .filter((g) => isDisqualifyingRemark([g.finalRemarks, g.midtermRemarks]))
      .map((g) => `${g.code ?? g.subject} (remarks="${g.remarks ?? ""}", finalRemarks="${g.finalRemarks ?? ""}", midtermRemarks="${g.midtermRemarks ?? ""}")`)
    console.log(`[DeansList] Offending subjects: ${offenders.join(", ")}`)
    reasons.push("Has an INC, Failed, or Dropped grade")
  }

  if (reasons.length > 0) {
    console.log(`[DeansList] Qualified: NO — reasons:`, reasons)
    return { eligible: false, gwa, honors: null, reasons }
  }

  console.log(`[DeansList] Qualified: YES`)
  return { eligible: true, gwa, honors: "Dean's List", reasons: [] }
}
