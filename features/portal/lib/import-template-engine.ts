import ExcelJS from "exceljs"
import {
  scanTemplateColumnMap,
  getEffectiveValue,
  formatStudentName,
} from "./export-template-engine"
import type { TemplatePeriodMap, TemplateCategory } from "./export-template-engine"
import { gradeCategoryMatches } from "./grade-engine"
import type { GradeRecord } from "@/lib/types/grade"
import type { GradeColumn } from "@/lib/types/grade-column"

export type ImportColumnDef = {
  name: string
  category: string
  gradingPeriod: "midterm" | "final"
  maxScore: number
  order: number
}

export type ImportStudentUpdate = {
  studentId: string
  scores: Record<string, number>
}

export type ImportComputedValues = {
  midtermGrade?: number
  midtermTransmuted?: number
  midtermRemarks?: string
  tentativeFinalGrade?: number
  finalTransmuted?: number
  finalRemarks?: string
  finalGrade?: number
  transmutedGrade?: number
  remarks?: string
}

export type ImportParsedData = {
  studentUpdates: ImportStudentUpdate[]
  newColumns: ImportColumnDef[]
  newColumnScores: Map<string, Array<{ studentId: string; score: number }>>
  computedValues: Map<string, ImportComputedValues>
  classId: string
  warnings: string[]
}

export type ImportPreview = {
  importToken: string
  studentsInFile: number
  studentsMatched: number
  studentsSkipped: number
  scoreUpdates: number
  newColumns: ImportColumnDef[]
  warnings: string[]
  diagnostic?: {
    firstStudentName: string
    gradeCount: number
    firstGradeName: string
    fileKey: string
    firstGradeKey: string
    row5Labels: string[]
    row6Labels: string[]
    row7Labels: string[]
    row8Labels: string[]
    midScores: Array<{ colId: string; value: number }>
    finScores: Array<{ colId: string; value: number }>
    templateCats: Array<{ alias: string; itemCount: number }>
    periodColCounts: { midterm: number; final: number }
    midAbsences: number | null
    midLabAbsences: number | null
    finAbsences: number | null
    finLabAbsences: number | null
  }
}

// ---------------------------------------------------------------------------
// Undo data: full snapshots of grade docs before import + created column IDs
// ---------------------------------------------------------------------------
export type UndoData = {
  gradeSnapshots: Array<{
    id: string
    doc: Record<string, unknown>
  }>
  newColumnIds: string[]
  classId: string
}

// ---------------------------------------------------------------------------
// In-memory cache for two-phase import (preview → execute)
// Uses globalThis to survive Next.js HMR module reloads in dev mode
// ---------------------------------------------------------------------------
const CACHE_KEY = "__IMPORT_CACHE__"
const CACHE_TTL = 10 * 60 * 1000

function getCache(): Map<string, { data: ImportParsedData; createdAt: number }> {
  if (!(globalThis as any)[CACHE_KEY]) {
    (globalThis as any)[CACHE_KEY] = new Map()
  }
  return (globalThis as any)[CACHE_KEY] as Map<string, { data: ImportParsedData; createdAt: number }>
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    const cache = getCache()
    for (const [key, entry] of cache) {
      if (now - entry.createdAt > CACHE_TTL) cache.delete(key)
    }
  }, 60_000)
}

function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  )
}

export function storeImportData(data: ImportParsedData): string {
  const token = generateToken()
  getCache().set(token, { data, createdAt: Date.now() })
  return token
}

export function retrieveImportData(token: string): ImportParsedData | null {
  const cache = getCache()
  const entry = cache.get(token)
  if (!entry) return null
  if (Date.now() - entry.createdAt > CACHE_TTL) {
    cache.delete(token)
    return null
  }
  return entry.data
}

export function deleteImportData(token: string): void {
  getCache().delete(token)
}

// ---------------------------------------------------------------------------
// Undo cache: stores pre-import grade snapshots for rollback
// ---------------------------------------------------------------------------
const UNDO_CACHE_KEY = "__IMPORT_UNDO_CACHE__"

function getUndoCache(): Map<string, { data: UndoData; createdAt: number }> {
  if (!(globalThis as any)[UNDO_CACHE_KEY]) {
    ;(globalThis as any)[UNDO_CACHE_KEY] = new Map()
  }
  return (globalThis as any)[UNDO_CACHE_KEY] as Map<
    string,
    { data: UndoData; createdAt: number }
  >
}

export function storeUndoData(data: UndoData): string {
  const token = generateToken()
  getUndoCache().set(token, { data, createdAt: Date.now() })
  return token
}

export function retrieveUndoData(token: string): UndoData | null {
  const cache = getUndoCache()
  const entry = cache.get(token)
  if (!entry) return null
  return entry.data
}

export function deleteUndoData(token: string): void {
  getUndoCache().delete(token)
}

// ---------------------------------------------------------------------------
// Helper: sort grades same order as export (last-name asc)
// ---------------------------------------------------------------------------
export function sortGradesForImport(
  grades: GradeRecord[],
  studentSortKeys?: Map<string, string>
): GradeRecord[] {
  return [...grades].sort((a, b) => {
    const aKey =
      studentSortKeys?.get(a.studentId) ?? (a.student ?? "").toLowerCase()
    const bKey =
      studentSortKeys?.get(b.studentId) ?? (b.student ?? "").toLowerCase()
    return aKey.localeCompare(bKey)
  })
}

// ---------------------------------------------------------------------------
// Distribute a single exam total across multiple exam columns proportionally
// ---------------------------------------------------------------------------
function distributeExam(
  total: number,
  examColumns: GradeColumn[]
): Record<string, number> {
  if (examColumns.length === 0) return {}
  if (examColumns.length === 1) return { [examColumns[0].id]: total }

  const totalMax = examColumns.reduce(
    (s, c) => s + Number(c.maxScore ?? 0),
    0
  )
  if (totalMax <= 0) {
    const each = total / examColumns.length
    const result: Record<string, number> = {}
    for (const col of examColumns) result[col.id] = each
    return result
  }

  const result: Record<string, number> = {}
  let allocated = 0
  for (let i = 0; i < examColumns.length; i++) {
    const max = Number(examColumns[i].maxScore ?? 0)
    if (i === examColumns.length - 1) {
      result[examColumns[i].id] = Math.round((total - allocated) * 100) / 100
    } else {
      const share = Math.round((total * (max / totalMax)) * 100) / 100
      result[examColumns[i].id] = share
      allocated += share
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Check if the template has lab sections (exercise / work attitude / project)
// ---------------------------------------------------------------------------
function detectLabSubject(periodMap: TemplatePeriodMap): boolean {
  return periodMap.labStartCol != null
}

// ---------------------------------------------------------------------------
// Read student data for one period (midterm or final)
// ---------------------------------------------------------------------------
function getAbsenceKeyFromScheme(
  scheme: { components: Array<{ isExam?: boolean; categories: Array<{ name: string; isAttendance?: boolean }> }>; labComponents?: Array<{ categories: Array<{ name: string; isAttendance?: boolean }> }> } | undefined | null,
  isLecture: boolean
): string {
  if (!scheme) return isLecture ? "attendance" : "labattendance"
  const categories = isLecture
    ? scheme.components.filter(c => !c.isExam).flatMap(c => c.categories)
    : (scheme.labComponents ?? []).flatMap(c => c.categories)
  const attCat = categories.find(c => c.isAttendance || /attend/i.test(c.name))
  if (attCat) return attCat.name.toLowerCase().replace(/[^a-z0-9]/g, "")
  return isLecture ? "attendance" : "labattendance"
}

function readPeriodScores(
  sheet: ExcelJS.Worksheet,
  rowIdx: number,
  periodMap: TemplatePeriodMap,
  columns: GradeColumn[],
  hpsRow: number,
  period: "midterm" | "final",
  scheme?: { components: Array<{ isExam?: boolean; categories: Array<{ name: string; isAttendance?: boolean }> }>; labComponents?: Array<{ categories: Array<{ name: string; isAttendance?: boolean }> }> } | null
): {
  scores: Record<string, number>
  newCols: ImportColumnDef[]
  computed: ImportComputedValues
  newColScores: Array<{ key: string; score: number }>
} {
  const scores: Record<string, number> = {}
  const newCols: ImportColumnDef[] = []
  const computed: ImportComputedValues = {}
  const newColScores: Array<{ key: string; score: number }> = []

  // Group system columns by category (normalized) for this period
  const colGroups = new Map<string, GradeColumn[]>()
  const examCols: GradeColumn[] = []
  for (const col of columns) {
    const matchesPeriod = !col.gradingPeriod || col.gradingPeriod === period || col.gradingPeriod === "both"
    if (!matchesPeriod) continue
    if (gradeCategoryMatches("exam", col.category)) {
      examCols.push(col)
    } else {
      const key = col.category.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
      if (!colGroups.has(key)) colGroups.set(key, [])
      colGroups.get(key)!.push(col)
    }
  }
  for (const [, group] of colGroups) {
    group.sort((a, b) => a.order - b.order)
  }

    // --- Categories (non-exam) ---
  for (const cat of periodMap.categories) {
    const matchedCols: GradeColumn[] = []
    for (const [catKey, group] of colGroups) {
      if (gradeCategoryMatches(cat.alias, catKey)) {
        matchedCols.push(...group)
      }
    }
    matchedCols.sort((a, b) => a.order - b.order)

    for (let i = 0; i < cat.itemColumns.length; i++) {
      const colNum = cat.itemColumns[i]

      // Only read columns that have a valid positive HPS in row 5
      const hpsVal = getEffectiveValue(sheet, hpsRow, colNum)
      const hps = hpsVal != null ? Number(hpsVal) : NaN
      if (hps <= 0 || isNaN(hps)) continue

      const order = i + 1

      // Ensure new column definition exists if no matching system column
      // (based on template structure alone, not per-student cell data)
      if (i >= matchedCols.length) {
        const existing = newCols.find(
          (nc) =>
            nc.category === cat.alias &&
            nc.gradingPeriod === period &&
            nc.order === order
        )
        if (!existing) {
          newCols.push({
            name: `Item ${order}`,
            category: cat.alias,
            gradingPeriod: period,
            maxScore: hps,
            order,
          })
        }
      }

      const cellVal = getEffectiveValue(sheet, rowIdx, colNum)

      if (cellVal == null || cellVal === "") continue

      const score = Number(cellVal)
      if (isNaN(score)) continue

      if (i < matchedCols.length) {
        scores[matchedCols[i].id] = score
      } else {
        const colKey = `${period}_${cat.alias}_${order}`
        newColScores.push({ key: colKey, score })
      }
    }
  }

  // --- Exam ---
  if (periodMap.examCol != null) {
    const examVal = getEffectiveValue(sheet, rowIdx, periodMap.examCol)
    if (examVal != null && examVal !== "") {
      const totalExam = Number(examVal)
      if (!isNaN(totalExam)) {
        if (examCols.length > 0) {
          const distributed = distributeExam(totalExam, examCols)
          Object.assign(scores, distributed)
        } else {
          const hpsVal = getEffectiveValue(sheet, hpsRow, periodMap.examCol)
          const colKey = `${period}_exam_1`
          newCols.push({
            name: period === "midterm" ? "Midterm Exam" : "Final Exam",
            category: "exam",
            gradingPeriod: period,
            maxScore: hpsVal != null ? Number(hpsVal) : 100,
            order: 1,
          })
          newColScores.push({ key: colKey, score: totalExam })
        }
      }
    }
  }

  // --- Absences ---
  // Attendance absences are stored as a virtual column key that the grid reads:
  //   scores[`${period}_absences_${absenceCatKey}`]
  // where absenceCatKey is derived from the grading scheme category name
  // (e.g. "Lec Attendance" → "lecattendance"). Must match the grid's derivation
  // in spreadsheet-grid.tsx:1412.

  const lectureAbsKey = getAbsenceKeyFromScheme(scheme, true)
  const labAbsKey = getAbsenceKeyFromScheme(scheme, false)

  if (periodMap.absencesCol != null) {
    const absVal = getEffectiveValue(sheet, rowIdx, periodMap.absencesCol)
    const abs = absVal != null && absVal !== "" ? Number(absVal) : 0
    if (!isNaN(abs)) {
      scores[`${period}_absences_${lectureAbsKey}`] = abs
    }
  }
  if (periodMap.labAbsencesCol != null) {
    const absVal = getEffectiveValue(sheet, rowIdx, periodMap.labAbsencesCol)
    const abs = absVal != null && absVal !== "" ? Number(absVal) : 0
    if (!isNaN(abs)) {
      scores[`${period}_absences_${labAbsKey}`] = abs
    }
  }

  // --- Computed values from file ---
  if (periodMap.periodGradeCol != null) {
    const v = getEffectiveValue(sheet, rowIdx, periodMap.periodGradeCol)
    if (v != null && v !== "") {
      const n = Number(v)
      if (!isNaN(n)) {
        if (period === "midterm") computed.midtermGrade = n
        else computed.tentativeFinalGrade = n
      }
    }
  }
  if (periodMap.transmutedCol != null) {
    const v = getEffectiveValue(sheet, rowIdx, periodMap.transmutedCol)
    if (v != null && v !== "") {
      const n = Number(v)
      if (!isNaN(n)) {
        if (period === "midterm") computed.midtermTransmuted = n
        else computed.finalTransmuted = n
      }
    }
  }
  if (periodMap.remarksCol != null) {
    const v = getEffectiveValue(sheet, rowIdx, periodMap.remarksCol)
    if (v != null && v !== "") {
      const s = String(v).trim()
      if (s) {
        if (period === "midterm") computed.midtermRemarks = s
        else computed.finalRemarks = s
      }
    }
  }

  return { scores, newCols, computed, newColScores }
}

// ---------------------------------------------------------------------------
// Validate header cells in CLASS RECORD match the class
// ---------------------------------------------------------------------------
function validateHeaders(
  sheet: ExcelJS.Worksheet,
  classId: string,
  grades: GradeRecord[]
): string | null {
  const section = String(getEffectiveValue(sheet, 2, 15) ?? "").trim()
  const subject = String(getEffectiveValue(sheet, 2, 2) ?? "").trim()

  if (!section && !subject) return null

  const gradeSections = new Set(grades.map((g) => g.section).filter(Boolean))
  const gradeSubjects = new Set(grades.map((g) => g.subject).filter(Boolean))

  if (section && gradeSections.size > 0 && !gradeSections.has(section)) {
    const sectionLower = section.toLowerCase()
    const matchedSection = [...gradeSections].some((gs) => gs.toLowerCase() === sectionLower)
    if (!matchedSection) {
      return `File section "${section}" does not match any section in this class`
    }
  }
  if (subject && gradeSubjects.size > 0 && !gradeSubjects.has(subject)) {
    const subjectLower = subject.toLowerCase()
    const matched = [...gradeSubjects].some(
      (gs) =>
        gs.toLowerCase().includes(subjectLower) || subjectLower.includes(gs.toLowerCase())
    )
    if (!matched) {
      return `File subject "${subject}" does not match this class`
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Main: parse template and return preview + parsed data
// ---------------------------------------------------------------------------
export async function importTemplate(
  classId: string,
  buffer: ArrayBuffer,
  grades: GradeRecord[],
  columns: GradeColumn[],
  scheme?: { components: Array<{ isExam?: boolean; categories: Array<{ name: string; isAttendance?: boolean }> }>; labComponents?: Array<{ categories: Array<{ name: string; isAttendance?: boolean }> }> } | null
): Promise<{ preview: ImportPreview; parsedData: ImportParsedData }> {
  const warnings: string[] = []
  const computedValues = new Map<string, ImportComputedValues>()
  const studentUpdates: ImportStudentUpdate[] = []

  // Load workbook
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const crSheet = wb.getWorksheet("CLASS RECORD")
  if (!crSheet) {
    return {
      preview: {
        importToken: "",
        studentsInFile: 0,
        studentsMatched: 0,
        studentsSkipped: 0,
        scoreUpdates: 0,
        newColumns: [],
        warnings: ["CLASS RECORD sheet not found in the uploaded file."],
      },
      parsedData: {
        studentUpdates: [],
        newColumns: [],
        newColumnScores: new Map(),
        computedValues: new Map(),
        classId,
        warnings: ["CLASS RECORD sheet not found in the uploaded file."],
      },
    }
  }

  // Validate headers
  const headerErr = validateHeaders(crSheet, classId, grades)
  if (headerErr) {
    return {
      preview: {
        importToken: "",
        studentsInFile: 0,
        studentsMatched: 0,
        studentsSkipped: 0,
        scoreUpdates: 0,
        newColumns: [],
        warnings: [headerErr],
      },
      parsedData: {
        studentUpdates: [],
        newColumns: [],
        newColumnScores: new Map(),
        computedValues: new Map(),
        classId,
        warnings: [headerErr],
      },
    }
  }

  // Detect finals boundary — check rows 3, 6, and 7 for "FINALS" or "FINAL"
  const totalCols = crSheet.columnCount || 160
  let finalsStartCol = totalCols
  for (const checkRow of [3, 7, 6]) {
    for (let c = 1; c <= totalCols; c++) {
      const v = String(getEffectiveValue(crSheet, checkRow, c) ?? "")
      if (v === "FINALS" || v === "FINAL") {
        finalsStartCol = c
        break
      }
    }
    if (finalsStartCol < totalCols) break
  }

  // Fallback: detect finals by first repeated category alias
  if (finalsStartCol >= totalCols) {
    const fullScan = scanTemplateColumnMap(crSheet, 1, totalCols)
    const seen = new Set<string>()
    for (const cat of fullScan.categories) {
      if (seen.has(cat.alias) && cat.itemColumns.length > 0) {
        finalsStartCol = cat.itemColumns[0]
        break
      }
      seen.add(cat.alias)
    }
  }

  const midtermMap = scanTemplateColumnMap(crSheet, 1, finalsStartCol - 1)
  const finalsMap = scanTemplateColumnMap(crSheet, finalsStartCol, totalCols)

  const isLab = detectLabSubject(midtermMap) || detectLabSubject(finalsMap)

  // HPS row (row 5)
  const hpsRow = 5

  let diagnostic: ImportPreview["diagnostic"]

  // Collect row 5-8 labels for diagnostics (before student loop)
  const rowLabelMap: Record<number, string[]> = { 5: [], 6: [], 7: [], 8: [] }
  for (const r of [5, 6, 7, 8]) {
    for (let c = 1; c <= totalCols; c++) {
      const v = getEffectiveValue(crSheet, r, c)
      if (v != null && typeof v === "string" && v.trim()) {
        rowLabelMap[r].push(v.trim())
      }
    }
  }

  // Use a flat set to track all new columns across all students
  const newColumnSet = new Map<string, ImportColumnDef>()
  const newColumnScores = new Map<string, Array<{ studentId: string; score: number }>>()

  // Read student rows starting at row 10
  let studentsInFile = 0
  let studentsMatched = 0
  let studentsSkipped = 0
  let scoreUpdates = 0

  let rowIdx = 10
  while (rowIdx <= (crSheet.rowCount || 200)) {
    const nameCell = getEffectiveValue(crSheet, rowIdx, 2)
    const name = String(nameCell ?? "").trim()
    if (!name) {
      rowIdx++
      continue
    }

    studentsInFile++
    const pos = studentsInFile - 1

    // Normalize names: apply formatStudentName, lowercase, collapse whitespace
    // so "Last, First" and "First Last" map to the same key
    const normalizeName = (s: string) =>
      formatStudentName(s).toLowerCase().replace(/\s+/g, " ").trim()

    const fileKey = normalizeName(name)

    // Capture diagnostic BEFORE the skip/continue so we always see it
    if (!diagnostic && studentsInFile === 1) {
      diagnostic = {
        firstStudentName: name,
        gradeCount: grades.length,
        firstGradeName: (grades as GradeRecord[])[0]?.student ?? "(none)",
        fileKey,
        firstGradeKey: normalizeName((grades as GradeRecord[])[0]?.student ?? ""),
        midScores: [],
        finScores: [],
        midAbsences: null,
        midLabAbsences: null,
        finAbsences: null,
        finLabAbsences: null,
        row5Labels: [...new Set(rowLabelMap[5])],
        row6Labels: [...new Set(rowLabelMap[6])],
        row7Labels: [...new Set(rowLabelMap[7])],
        row8Labels: [...new Set(rowLabelMap[8])],
        templateCats: [
          ...midtermMap.categories.map((c) => ({
            alias: c.alias,
            itemCount: c.itemColumns.filter((colNum) => {
              const v = getEffectiveValue(crSheet, 5, colNum)
              const n = v != null ? Number(v) : NaN
              return n > 0 && !isNaN(n)
            }).length,
          })),
          ...finalsMap.categories.map((c) => ({
            alias: c.alias,
            itemCount: c.itemColumns.filter((colNum) => {
              const v = getEffectiveValue(crSheet, 5, colNum)
              const n = v != null ? Number(v) : NaN
              return n > 0 && !isNaN(n)
            }).length,
          })),
        ],
        periodColCounts: {
          midterm: midtermMap.categories.length,
          final: finalsMap.categories.length,
        },
      }
    }

    // Match: first try by position (fast path when sort order matches export),
    // then fall back to name search across all grades
    let matchedGrade: GradeRecord | null = null

    if (pos < grades.length) {
      const gradeKey = normalizeName(grades[pos].student ?? "")
      if (fileKey === gradeKey) {
        matchedGrade = grades[pos]
      }
    }

    if (!matchedGrade) {
      matchedGrade =
        (grades as GradeRecord[]).find((g) => {
          const gradeKey = normalizeName(g.student ?? "")
          return gradeKey === fileKey
        }) ?? null
    }

    if (matchedGrade) {
      studentsMatched++
    } else {
      warnings.push(
        `Row ${rowIdx}: student "${name}" has no matching roster slot. Skipped.`
      )
      studentsSkipped++
      rowIdx++
      continue
    }

    // Read midterm scores
    const mid = readPeriodScores(
      crSheet,
      rowIdx,
      midtermMap,
      columns,
      hpsRow,
      "midterm",
      scheme
    )

    // Read finals scores
    const fin = readPeriodScores(
      crSheet,
      rowIdx,
      finalsMap,
      columns,
      hpsRow,
      "final",
      scheme
    )

    // Populate diagnostic scores for first matched student
    if (diagnostic && studentsMatched === 1) {
      diagnostic.midScores = [
        ...Object.entries(mid.scores).map(([colId, value]) => ({ colId, value })),
        ...mid.newColScores.map(({ key, score }) => ({ colId: key, value: score })),
      ]
      diagnostic.finScores = [
        ...Object.entries(fin.scores).map(([colId, value]) => ({ colId, value })),
        ...fin.newColScores.map(({ key, score }) => ({ colId: key, value: score })),
      ]
      const diagLeeKey = getAbsenceKeyFromScheme(scheme, true)
      const diagLabKey = getAbsenceKeyFromScheme(scheme, false)
      diagnostic.midAbsences = mid.scores[`midterm_absences_${diagLeeKey}`] ?? null
      diagnostic.midLabAbsences = mid.scores[`midterm_absences_${diagLabKey}`] ?? null
      diagnostic.finAbsences = fin.scores[`final_absences_${diagLeeKey}`] ?? null
      diagnostic.finLabAbsences = fin.scores[`final_absences_${diagLabKey}`] ?? null
    }

    // Read final grade columns (cols 154-159 in CLASS RECORD)
    const finalMg = getEffectiveValue(crSheet, rowIdx, 154)
    const finalFg = getEffectiveValue(crSheet, rowIdx, 155)
    const finalFinal = getEffectiveValue(crSheet, rowIdx, 156)
    const finalTrans = getEffectiveValue(crSheet, rowIdx, 157)
    const finalPctl = getEffectiveValue(crSheet, rowIdx, 158)
    const finalRem = getEffectiveValue(crSheet, rowIdx, 159)

    const combinedComputed: ImportComputedValues = {
      ...mid.computed,
      ...fin.computed,
    }
    if (finalMg != null && finalMg !== "") {
      const n = Number(finalMg)
      if (!isNaN(n)) combinedComputed.midtermGrade = n
    }
    if (finalFg != null && finalFg !== "") {
      const n = Number(finalFg)
      if (!isNaN(n)) combinedComputed.tentativeFinalGrade = n
    }
    if (finalFinal != null && finalFinal !== "") {
      const n = Number(finalFinal)
      if (!isNaN(n)) combinedComputed.finalGrade = n
    }
    if (finalTrans != null && finalTrans !== "") {
      const n = Number(finalTrans)
      if (!isNaN(n)) combinedComputed.transmutedGrade = n
    }
    if (finalPctl != null && finalPctl !== "") {
      const n = Number(finalPctl)
      if (!isNaN(n)) {
        if (combinedComputed.finalGrade == null) combinedComputed.finalGrade = n
      }
    }
    if (finalRem != null && finalRem !== "") {
      const s = String(finalRem).trim()
      if (s) combinedComputed.remarks = s
    }

    // Merge scores
    const mergedScores: Record<string, number> = {}
    // Start with existing scores
    if (matchedGrade.scores) {
      Object.assign(mergedScores, matchedGrade.scores)
    }
    // Overwrite with imported scores
    Object.assign(mergedScores, mid.scores)
    Object.assign(mergedScores, fin.scores)
    scoreUpdates += Object.keys(mid.scores).length + Object.keys(fin.scores).length

    studentUpdates.push({
      studentId: matchedGrade.studentId,
      scores: mergedScores,
    })
    computedValues.set(matchedGrade.studentId, combinedComputed)

    // Collect new column defs and scores (only keep unique ones)
    for (const nc of [...mid.newCols, ...fin.newCols]) {
      const key = `${nc.gradingPeriod}_${nc.category}_${nc.order}`
      if (!newColumnSet.has(key)) newColumnSet.set(key, nc)
    }
    for (const ncs of [...mid.newColScores, ...fin.newColScores]) {
      const entryList = newColumnScores.get(ncs.key) ?? []
      entryList.push({ studentId: matchedGrade.studentId, score: ncs.score })
      newColumnScores.set(ncs.key, entryList)
    }
    scoreUpdates +=
      mid.newColScores.length + fin.newColScores.length

    rowIdx++
  }

  const newColumns = [...newColumnSet.values()]

  const preview: ImportPreview = {
    importToken: "",
    studentsInFile,
    studentsMatched,
    studentsSkipped,
    scoreUpdates,
    newColumns,
    warnings,
    diagnostic,
  }

  const parsedData: ImportParsedData = {
    studentUpdates,
    newColumns,
    newColumnScores,
    computedValues,
    classId,
    warnings,
  }

  const token = storeImportData(parsedData)
  preview.importToken = token

  return { preview, parsedData }
}
