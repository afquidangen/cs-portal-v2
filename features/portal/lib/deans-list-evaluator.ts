function isDisqualifyingRemark(fields: Array<string | null | undefined>): boolean {
  const keywords = ["drop", "inc", "failed", "d", "od"]
  return fields.some((field) => {
    if (!field) return false
    const r = field.toLowerCase().trim()
    return keywords.some((k) => r === k || (k.length > 1 && r.includes(k)))
  })
}

export type DeansListEvaluation = {
  isQualified: boolean
  gwa: number | null
  reasons: string[]
}

export function evaluateDeansList(
  grades: Array<{
    transmutedGrade?: number | null
    released?: boolean | null
    remarks?: string | null
    finalRemarks?: string | null
    midtermRemarks?: string | null
    units?: number | null
    subject: string
    code?: string
  }>,
  totalUnits: number
): DeansListEvaluation {
  const reasons: string[] = []

  const filtered = grades.filter(
    (g) => g.transmutedGrade !== undefined && g.transmutedGrade !== null && g.released === true
  )

  console.log(`[DeansList:S] Processing ${filtered.length} subjects with released grades`)

  for (const g of filtered) {
    const disqualified = isDisqualifyingRemark([g.finalRemarks, g.midtermRemarks])
    console.log(
      `[DeansList:S]   ${g.code ?? g.subject}: transmuted=${g.transmutedGrade?.toFixed(2)}, ` +
      `remarks="${g.remarks ?? ""}", finalRemarks="${g.finalRemarks ?? ""}", ` +
      `midtermRemarks="${g.midtermRemarks ?? ""}", disqualified=${disqualified}`
    )
  }

  if (filtered.length === 0) {
    console.log("[DeansList:S] No graded subjects (no released grades with transmuted values)")
    return { isQualified: false, gwa: null, reasons: ["No graded subjects"] }
  }

  const passUnits = totalUnits >= 17
  console.log(`[DeansList:S] Total Units: ${totalUnits} ${passUnits ? "PASS" : "FAIL"}`)
  if (!passUnits) {
    reasons.push(`Total enrolled units (${totalUnits}) is less than the required 17 units`)
  }

  const gwa = Number(
    (filtered.reduce((sum, g) => sum + (g.transmutedGrade ?? 0), 0) / filtered.length).toFixed(2)
  )

  const passGwa = gwa <= 1.75
  console.log(`[DeansList:S] GWA: ${gwa.toFixed(2)} ${passGwa ? "PASS" : "FAIL"}`)
  if (!passGwa) {
    reasons.push(`GWA of ${gwa.toFixed(2)} exceeds the 1.75 threshold`)
  }

  const gradeWith25 = filtered.find((g) => (g.transmutedGrade ?? 0) >= 2.50)
  const passNo25 = !gradeWith25
  console.log(`[DeansList:S] Has Grade >= 2.50: ${gradeWith25 ? `YES (${gradeWith25.transmutedGrade?.toFixed(2)} in ${gradeWith25.subject})` : "NO"} ${passNo25 ? "PASS" : "FAIL"}`)
  if (!passNo25) {
    reasons.push(
      `No grade of 2.50 or higher — found ${gradeWith25.transmutedGrade?.toFixed(2)} in ${gradeWith25.subject}`
    )
  }

  const hasBadRemarks = filtered.some((g) =>
    isDisqualifyingRemark([g.finalRemarks, g.midtermRemarks])
  )
  console.log(`[DeansList:S] Has INC/Failed/Dropped (released grades): ${hasBadRemarks} ${!hasBadRemarks ? "PASS" : "FAIL"}`)
  if (hasBadRemarks) {
    const offenders = filtered
      .filter((g) => isDisqualifyingRemark([g.finalRemarks, g.midtermRemarks]))
      .map((g) => `${g.code ?? g.subject} (remarks="${g.remarks ?? ""}", finalRemarks="${g.finalRemarks ?? ""}", midtermRemarks="${g.midtermRemarks ?? ""}")`)
    console.log(`[DeansList:S] Offending subjects: ${offenders.join(", ")}`)
    reasons.push("Has an INC, Failed, or Dropped grade")
  }

  const isQualified = reasons.length === 0
  console.log(`[DeansList:S] Qualified: ${isQualified ? "YES" : "NO — " + reasons.join("; ")}`)
  return {
    isQualified,
    gwa,
    reasons,
  }
}
