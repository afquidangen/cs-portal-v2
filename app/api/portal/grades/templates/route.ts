import { gradingTemplateRepository } from "@/features/portal/repositories/grading-template.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const url = new URL(request.url)
    const classId = url.searchParams.get("classId")
    if (!classId) return badRequest("classId query parameter is required.")

    const templates = await gradingTemplateRepository.findByClass(classId)
    return success(templates)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch templates.")
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, name, columns, subjectType } = body

    if (!classId || !name || !Array.isArray(columns)) {
      return badRequest("classId, name, and columns array are required.")
    }

    const template = await gradingTemplateRepository.create({
      id: `TPL-${Date.now()}`,
      name,
      classId,
      subjectType: subjectType ?? "Lecture",
      columns: columns.map((col: { name: string; category: string; maxScore?: number }, idx: number) => ({
        name: col.name,
        category: col.category,
        maxScore: col.maxScore ?? 100,
        order: idx + 1,
      })),
    })

    return success(template, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create template.")
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, templateId } = body

    if (!classId || !templateId) {
      return badRequest("classId and templateId are required.")
    }

    const template = await gradingTemplateRepository.findById(templateId) as Record<string, unknown> | null
    if (!template) return badRequest("Template not found.")

    const templateColumns = (template.columns as Array<{ name: string; category: string; maxScore: number }>) || []

    const existing = await gradeColumnRepository.findAll({ classId }) as Array<{ order: number }>
    const maxOrder = existing.reduce((max: number, col: { order: number }) =>
      Math.max(max, col.order ?? 0), 0)

    const created = []
    for (let i = 0; i < templateColumns.length; i++) {
      const tc = templateColumns[i]
      const alreadyExists = await gradeColumnRepository.findAll({
        classId,
        name: tc.name,
      }) as Array<{ id: string }>

      if (alreadyExists.length === 0) {
        await gradeColumnRepository.create({
          id: `COL-${Date.now()}-${i}`,
          classId,
          name: tc.name,
          category: tc.category,
          maxScore: tc.maxScore ?? 100,
          order: maxOrder + 1 + i,
        })
        created.push(tc.name)
      }
    }

    return success({ columnsCreated: created.length, columns: created })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to apply template.")
  }
}
