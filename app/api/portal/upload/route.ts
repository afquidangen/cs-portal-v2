import { success, error, badRequest } from "@/lib/api-response"
import { uploadFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return badRequest("File is required.")

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    const isPdf = file.type === "application/pdf"
    const resourceType = isPdf ? "raw" : "image"
    const publicId = isPdf ? `upload-${Date.now()}.pdf` : `upload-${Date.now()}`
    const result = await uploadFile(base64, publicId, "cso-reports", resourceType)

    return success({
      secureUrl: result.secureUrl,
      publicId: result.publicId,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to upload file.")
  }
}
