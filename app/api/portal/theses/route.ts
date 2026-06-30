import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error as apiError } from "@/lib/api-response"
import { requireAdmin } from "@/lib/api-auth"
import { uploadFileStream } from "@/lib/cloudinary"
import { needsCompression, compressBuffer } from "@/lib/services/pdf-compression.service"
import { logger } from "@/lib/services/logger.service"

const log = logger("THESIS_UPLOAD")

export const runtime = "nodejs"

function uploadError(message: string, status = 400) {
  return Response.json({ success: false, message }, { status })
}

const MAX_UPLOAD_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || "52428800", 10)

export async function GET() {
  try {
    const theses = await thesesRepository.findAll()
    return success(theses)
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unable to fetch theses.")
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const formData = await request.formData()

    const id = formData.get("id") as string | null
    const title = formData.get("title") as string | null
    if (!id || !title) {
      return uploadError("Thesis id and title are required.")
    }

    const pdfFile = formData.get("pdf") as File | null

    let pdfUrl = ""
    let cloudinaryPublicId: string | undefined
    let fileName = (formData.get("fileName") as string) || ""

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

      pdfUrl = result.secureUrl
      cloudinaryPublicId = result.publicId
      fileName ||= pdfFile.name
    }

    const thesis = await thesesRepository.create({
      id,
      title,
      authors: (formData.get("authors") as string) || "",
      year: Number(formData.get("year")) || 2026,
      category: (formData.get("category") as string) || "",
      adviser: (formData.get("adviser") as string) || "",
      abstract: (formData.get("abstract") as string) || "",
      tags: JSON.parse((formData.get("tags") as string) || "[]"),
      pdfUrl,
      cloudinaryPublicId,
      fileName,
    })

    return Response.json({ success: true, data: thesis }, { status: 201 })
  } catch (err) {
    log.error("Unexpected error:", err instanceof Error ? err.message : err)
    return uploadError("Unable to upload thesis.", 500)
  }
}
