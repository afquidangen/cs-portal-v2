import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error as apiError, notFound } from "@/lib/api-response"
import { requireAdmin } from "@/lib/api-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ThesisModel } from "@/lib/models"
import { uploadFileStream, destroyFile } from "@/lib/cloudinary"
import { needsCompression, compressBuffer } from "@/lib/services/pdf-compression.service"
import { logger } from "@/lib/services/logger.service"

const log = logger("THESIS_UPDATE")

export const runtime = "nodejs"

function uploadError(message: string, status = 400) {
  return Response.json({ success: false, message }, { status })
}

const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "52428800", 10)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const thesis = await thesesRepository.findById(id)
    if (!thesis) return notFound("Thesis")
    return success(thesis)
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unable to fetch thesis.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const formData = await request.formData()

    const body: Record<string, unknown> = {}

    const title = formData.get("title") as string | null
    const authors = formData.get("authors") as string | null
    const adviser = formData.get("adviser") as string | null
    const abstract = formData.get("abstract") as string | null
    const category = formData.get("category") as string | null
    const year = formData.get("year") as string | null

    if (title) body.title = title
    if (authors) body.authors = authors
    if (adviser) body.adviser = adviser
    if (abstract) body.abstract = abstract
    if (category) body.category = category
    if (year) body.year = Number(year)

    const removePdf = formData.get("removePdf") === "true"

    if (removePdf) {
      body.pdfUrl = ""
      body.fileName = ""
    }

    const pdfFile = formData.get("pdf") as File | null
    if (pdfFile) {
      if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
        return uploadError("Only PDF files are allowed.")
      }

      if (pdfFile.size > MAX_UPLOAD_SIZE) {
        return uploadError("File exceeds the maximum upload size of 50 MB.")
      }

      if (pdfFile.size === 0) {
        return uploadError("The uploaded PDF is empty.")
      }

      let uploadBuffer: Buffer = Buffer.from(await pdfFile.arrayBuffer())

      if (needsCompression(uploadBuffer.length)) {
        const originalSize = uploadBuffer.length
        log.info(`Original size: ${(originalSize / 1024 / 1024).toFixed(1)}MB — compression required`)

        try {
          const result = await compressBuffer(uploadBuffer)
          const { compressedBuffer, compressedSize } = result

          if (needsCompression(compressedSize)) {
            log.warn(`Compressed size ${(compressedSize / 1024 / 1024).toFixed(1)}MB still exceeds limit`)
            return uploadError(
              "The PDF could not be compressed below the 10 MB upload limit. Please optimize the document before uploading.",
              400
            )
          }

          uploadBuffer = compressedBuffer
          log.info(`Uploading compressed PDF (${(compressedSize / 1024 / 1024).toFixed(1)}MB)`)
        } catch (compressErr) {
          const msg = compressErr instanceof Error ? compressErr.message : "Unknown compression error"
          log.error("Compression failed:", msg)
          if (msg.includes("Ghostscript")) {
            return uploadError("PDF compression requires Ghostscript which is not installed. Contact the administrator.", 500)
          }
          return uploadError("Unable to compress the uploaded PDF. The file may be corrupted.", 500)
        }
      }

      const publicId = `thesis-${Date.now()}`
      const uploadStart = Date.now()

      let result
      try {
        result = await uploadFileStream(uploadBuffer, publicId, "theses")
      } catch (cloudinaryErr) {
        log.error("Cloudinary upload failed:", cloudinaryErr instanceof Error ? cloudinaryErr.message : cloudinaryErr)
        return uploadError("Cloud storage is temporarily unavailable. Please try again later.", 503)
      }

      const uploadDuration = Date.now() - uploadStart
      log.info(`Cloudinary upload completed in ${uploadDuration}ms — publicId: ${result.publicId}`)

      body.pdfUrl = result.secureUrl
      body.cloudinaryPublicId = result.publicId
      body.fileName = pdfFile.name

      const existing = await thesesRepository.findById(id) as Record<string, unknown> | null
      if (existing) {
        const oldPublicId = existing.cloudinaryPublicId as string | undefined
        if (oldPublicId) await destroyFile(oldPublicId, "raw").catch(() => {})
      }
    }

    const thesis = await thesesRepository.update({ id }, body)
    if (!thesis) return notFound("Thesis")
    return Response.json({ success: true, data: thesis })
  } catch (err) {
    log.error("Unexpected error:", err instanceof Error ? err.message : err)
    return uploadError("Unable to update thesis.", 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const thesis = await thesesRepository.findById(id)
    if (!thesis) return notFound("Thesis")

    const { deletedBy } = await request.json().catch(() => ({}))

    await connectToDatabase()
    await ThesisModel.collection.updateOne(
      { id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy || null,
        },
      }
    )

    return success({ deleted: true })
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unable to delete thesis.")
  }
}
