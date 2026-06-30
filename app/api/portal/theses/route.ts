import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { uploadFileStream } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function GET() {
  try {
    const theses = await thesesRepository.findAll()
    return success(theses)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch theses.")
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const id = formData.get("id") as string | null
    const title = formData.get("title") as string | null
    if (!id || !title) {
      return badRequest("Thesis id and title are required.")
    }

    const pdfFile = formData.get("pdf") as File | null

    let pdfUrl = ""
    let cloudinaryPublicId: string | undefined
    let fileName = (formData.get("fileName") as string) || ""

    if (pdfFile) {
      if (pdfFile.size > 25 * 1024 * 1024) {
        return error("File exceeds 25MB upload limit.")
      }
      const buffer = Buffer.from(await pdfFile.arrayBuffer())
      const publicId = `thesis-${Date.now()}`
      const result = await uploadFileStream(buffer, publicId, "theses")
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
    return success(thesis, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create thesis.")
  }
}
