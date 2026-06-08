import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"
import { governingDocumentRepository } from "@/features/portal/repositories/governing-document.repository"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { uploadFile } from "@/lib/cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const runtime = "nodejs"

export async function GET() {
  try {
    const docs = await governingDocumentRepository.findAll() as Record<string, unknown>[]
    const doc = docs[0] ?? null
    return success(doc)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch governing document.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.href) {
      return badRequest("File data is required.")
    }

    const doc: Record<string, unknown> = {
      href: body.href,
      fileName: body.fileName,
      fileSize: body.fileSize,
    }

    if (typeof doc.href === "string" && doc.href.startsWith("data:")) {
      const result = await uploadFile(doc.href as string, `constitution-${Date.now()}`, "governing-documents")
      doc.href = result.secureUrl
    }

    const existing = await governingDocumentRepository.findAll()
    let created
    if (existing.length > 0) {
      created = await governingDocumentRepository.update(
        { _id: new mongoose.Types.ObjectId((existing[0] as Record<string, unknown>)._id as string) },
        { $set: doc }
      )
    } else {
      created = await governingDocumentRepository.create(doc)
    }

    const raw = typeof created === "object" && created !== null && "toObject" in created
      ? (created as { toObject: () => Record<string, unknown> }).toObject()
      : created as Record<string, unknown>
    const link = { ...raw, _id: String(raw._id) }
    return success(link, 200)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to save governing document.")
  }
}

export async function DELETE() {
  try {
    const docs = await governingDocumentRepository.findAll() as Record<string, unknown>[]
    if (docs.length === 0) return notFound("Governing document")

    const doc = docs[0]
    const href = doc?.href as string | undefined
    if (href) {
      const match = href.match(/\/raw\/upload\/v\d+\/(.+)/)
      const publicId = match ? match[1] : null
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" })
      }
    }

    await governingDocumentRepository.deleteMany()
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete governing document.")
  }
}
