import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { GradeColumnModel, GradeModel, GradingSchemeModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { gradeCategoryMatches } from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

export async function GET() {
  try {
    const schemes = await gradingSchemeRepository.findAll()
    return success(schemes)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grading schemes.")
  }
}

function validateScheme(body: Record<string, unknown>): string[] {
  const errors: string[] = []
  const components = (body.components ?? []) as Array<Record<string, unknown>>
  const compTotal = components.reduce((s, c) => s + (c.weight as number), 0)
  if (Math.abs(compTotal - 100) > 0.01) errors.push(`Component weights sum to ${compTotal}%, must be 100%.`)
  if (body.subjectType === "Lecture with Lab") {
    const lectureWeight = (body.lectureWeight as number) ?? 0
    const laboratoryWeight = (body.laboratoryWeight as number) ?? 0
    if (lectureWeight + laboratoryWeight !== 100) {
      errors.push(`Lecture weight (${lectureWeight}%) + Laboratory weight (${laboratoryWeight}%) must equal 100%.`)
    }
  }
  return errors
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validationErrors = validateScheme(body)
    if (validationErrors.length > 0) return badRequest(validationErrors.join(" | "))

    const schemeId = `GS-${Date.now()}`
    const scheme = await gradingSchemeRepository.create({
      id: schemeId,
      ...body,
    })

    if (body.isActive) {
      await connectToDatabase()

      await GradingSchemeModel.updateMany(
        { id: { $ne: schemeId }, subjectType: body.subjectType, isActive: true },
        { $set: { isActive: false } }
      )

      const newCatNames: string[] = []
      for (const comp of (body.components ?? []) as Array<Record<string, unknown>>) {
        for (const cat of (comp.categories ?? []) as Array<Record<string, unknown>>) {
          newCatNames.push(cat.name as string)
        }
      }
      for (const comp of (body.labComponents ?? []) as Array<Record<string, unknown>>) {
        for (const cat of (comp.categories ?? []) as Array<Record<string, unknown>>) {
          newCatNames.push(cat.name as string)
        }
      }

      const otherSchemes = await GradingSchemeModel.find({
        subjectType: body.subjectType,
      }).lean() as unknown as Array<{ id: string }>
      const otherIds = otherSchemes.map((s) => s.id)
      if (otherIds.length > 0) {
        const gradeDocs = await GradeModel.find({
          gradingSchemeId: { $in: otherIds },
        }).lean() as unknown as Array<{ classId: string }>
        const classIds = [...new Set(gradeDocs.map((g) => g.classId))]
        if (classIds.length > 0) {
          const columns = await GradeColumnModel.find({
            classId: { $in: classIds },
          }).lean() as unknown as Array<{
            id: string
            classId: string
            name: string
            category: string
            gradingPeriod: string
          }>

          const existing = new Set<string>()
          for (const col of columns) {
            if (newCatNames.includes(col.category)) {
              existing.add(`${col.classId}|${col.gradingPeriod}|${col.category}`)
            }
          }

          const toDelete: string[] = []
          for (const col of columns) {
            if (newCatNames.includes(col.category)) continue
            const match = newCatNames.find((n) => gradeCategoryMatches(n, col.category))
            if (match) {
              const key = `${col.classId}|${col.gradingPeriod}|${match}`
              if (existing.has(key)) {
                toDelete.push(col.id)
              } else {
                await GradeColumnModel.updateOne({ id: col.id }, { $set: { category: match } })
                existing.add(key)
              }
            } else {
              toDelete.push(col.id)
            }
          }

          if (toDelete.length > 0) {
            await GradeColumnModel.deleteMany({ id: { $in: toDelete } })
            for (const colId of toDelete) {
              const col = columns.find((c) => c.id === colId)
              if (col) {
                const scoreKey = col.gradingPeriod === "both" ? col.name : `${col.gradingPeriod}_${col.name}`
                await GradeModel.updateMany(
                  { classId: col.classId },
                  { $unset: { [`scores.${scoreKey}`]: "" } }
                )
              }
            }
          }
        }
      }
    }

    return success(scheme, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create grading scheme.")
  }
}
