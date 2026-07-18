import { ImportTemplateFileModel } from "@/lib/models/import-template-file.model"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { requireAdmin, requireFacultyOrAdmin } from "@/lib/api-auth"
import { uploadFileStream, destroyFile } from "@/lib/cloudinary"
import { connectToDatabase } from "@/lib/mongodb"

export const runtime = "nodejs"

type SubjectType = "Lecture" | "Lecture with Lab"

export async function GET(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    await connectToDatabase()
    const url = new URL(request.url)
    const subjectType = url.searchParams.get("subjectType") as SubjectType | null

    if (subjectType) {
      const template = await ImportTemplateFileModel.findOne({ subjectType })
      if (!template) return notFound("Template")
      return success(template)
    }

    const templates = await ImportTemplateFileModel.find({})
    return success(templates)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch templates.")
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    await connectToDatabase()
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const subjectType = formData.get("subjectType") as SubjectType | null

    if (!file) return badRequest("File is required.")
    if (!subjectType || !["Lecture", "Lecture with Lab"].includes(subjectType)) {
      return badRequest("subjectType must be 'Lecture' or 'Lecture with Lab'.")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const publicId = `import-template-${subjectType.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`
    const { secureUrl, publicId: uploadedPublicId } = await uploadFileStream(
      buffer,
      publicId,
      "import-templates",
      "raw"
    )

    const existing = await ImportTemplateFileModel.findOne({ subjectType })
    if (existing) {
      await destroyFile(existing.filePublicId, "raw")
      existing.fileUrl = secureUrl
      existing.filePublicId = uploadedPublicId
      existing.fileName = file.name
      existing.uploadedBy = auth.user.id
      existing.uploadedAt = new Date().toISOString()
      await existing.save()
      return success(existing)
    }

    const template = await ImportTemplateFileModel.create({
      id: `ITF-${Date.now()}`,
      subjectType,
      fileUrl: secureUrl,
      filePublicId: uploadedPublicId,
      fileName: file.name,
      uploadedBy: auth.user.id,
      uploadedAt: new Date().toISOString(),
    })

    return success(template)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to upload template.")
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    await connectToDatabase()
    const url = new URL(request.url)
    const subjectType = url.searchParams.get("subjectType") as SubjectType | null

    if (!subjectType) return badRequest("subjectType is required.")

    const template = await ImportTemplateFileModel.findOne({ subjectType })
    if (!template) return notFound("Template")

    await destroyFile(template.filePublicId, "raw")
    await ImportTemplateFileModel.deleteOne({ _id: template._id })

    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete template.")
  }
}
