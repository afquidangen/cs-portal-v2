import { galleryRepository } from "@/features/portal/repositories/gallery.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { uploadFile } from "@/lib/cloudinary"
import { requireCsoAccess } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET() {
  try {
    const items = await galleryRepository.findAll()
    return success(items)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch gallery items.")
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Gallery item id and title are required.")
    }

    const doc: Record<string, unknown> = {
      id: body.id,
      title: body.title,
      description: body.description ?? "",
    }

    if (typeof body.image === "string" && body.image.startsWith("data:")) {
      try {
        const result = await uploadFile(body.image, `gallery-${Date.now()}`, "gallery", "image")
        doc.image = result.secureUrl
        doc.cloudinaryPublicId = result.publicId
      } catch {
        console.error("Cloudinary upload failed, keeping base64 image.")
        doc.image = body.image
      }
    } else {
      doc.image = body.image ?? ""
    }

    const created = await galleryRepository.create(doc) as Record<string, unknown>
    const raw = "toObject" in created ? (created as { toObject: () => Record<string, unknown> }).toObject() : created
    const item = { ...raw, _id: String(raw._id) }
    return success(item, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create gallery item.")
  }
}
