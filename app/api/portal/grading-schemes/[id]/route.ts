import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, notFound, badRequest } from "@/lib/api-response"
import { GradeColumnModel, GradeModel, GradingSchemeModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { gradeCategoryMatches } from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

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

function extractCategoryNames(scheme: Record<string, unknown>): string[] {
  const names: string[] = []
  const components = (scheme.components ?? []) as Array<Record<string, unknown>>
  for (const comp of components) {
    const categories = (comp.categories ?? []) as Array<Record<string, unknown>>
    for (const cat of categories) {
      names.push(cat.name as string)
    }
  }
  return names
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const scheme = await gradingSchemeRepository.findById(id)
    if (!scheme) return notFound("Grading scheme")
    return success(scheme)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grading scheme.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log("[PUT] body comp0 cats:", JSON.stringify(body.components?.[0]?.categories))
    const validationErrors = validateScheme(body)
    if (validationErrors.length > 0) return badRequest(validationErrors.join(" | "))

    const existing = await gradingSchemeRepository.findById(id) as Record<string, unknown> | null

    const scheme = await gradingSchemeRepository.replace({ id }, body) as Record<string, unknown> | null
    console.log("[PUT] saved comp0 cats:", JSON.stringify((scheme as any)?.components?.[0]?.categories))
    if (!scheme) return notFound("Grading scheme")

    if (existing) {
      const oldCats = extractCategoryNames(existing)
      const newCats = extractCategoryNames(body)
      const oldLabCats = extractCategoryNames({ components: (existing.labComponents ?? []) as Record<string, unknown>[] })
      const newLabCats = extractCategoryNames({ components: (body.labComponents ?? []) as Record<string, unknown>[] })

      const renames: { from: string; to: string }[] = []
      for (let i = 0; i < Math.min(oldCats.length, newCats.length); i++) {
        if (oldCats[i] !== newCats[i]) renames.push({ from: oldCats[i], to: newCats[i] })
      }
      for (let i = 0; i < Math.min(oldLabCats.length, newLabCats.length); i++) {
        if (oldLabCats[i] !== newLabCats[i]) renames.push({ from: oldLabCats[i], to: newLabCats[i] })
      }

      if (renames.length > 0) {
        await connectToDatabase()
        const classIds = await GradeModel.find({ gradingSchemeId: id }).distinct("classId")
        for (const { from, to } of renames) {
          const filter: Record<string, unknown> = { category: from }
          if (classIds.length > 0) filter.classId = { $in: classIds }
          await GradeColumnModel.updateMany(filter, { $set: { category: to } })
        }
      }
    }

    // Auto-deactivate other schemes and migrate columns when activating
    if (body.isActive) {
      await connectToDatabase()

      await GradingSchemeModel.updateMany(
        { id: { $ne: id }, subjectType: body.subjectType, isActive: true },
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

      const allSchemeIds = await GradingSchemeModel.find({
        subjectType: body.subjectType,
      }).lean() as unknown as Array<{ id: string }>
      const allIds = allSchemeIds.map((s) => s.id)
      if (allIds.length > 0) {
        const gradeDocs = await GradeModel.find({
          gradingSchemeId: { $in: allIds },
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

    return success(scheme)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grading scheme.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await gradingSchemeRepository.delete({ id })
    if (!deleted) return notFound("Grading scheme")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete grading scheme.")
  }
}
