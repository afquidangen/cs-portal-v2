import { quickLinksRepository } from "@/features/portal/repositories/quick-links.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { uploadFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function GET() {
  try {
    const links = await quickLinksRepository.findAll() as Record<string, unknown>[]
    const sanitized = links.map((l) => ({ ...l, type: l.type ?? "link" }))
    return success(sanitized)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch quick links.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.label || !body.href) {
      return badRequest("Label and href are required.")
    }

    const doc: Record<string, unknown> = {
      label: body.label,
      href: body.href,
      type: body.type ?? "link",
      fileName: body.fileName,
      fileSize: body.fileSize,
    }

    if (typeof doc.href === "string" && doc.href.startsWith("data:")) {
      const result = await uploadFile(doc.href as string, `quicklink-${Date.now()}`, "quick-links")
      doc.href = result.secureUrl
      doc.type = "file"
    }

    const created = await quickLinksRepository.create(doc) as Record<string, unknown>
    const raw = "toObject" in created ? (created as { toObject: () => Record<string, unknown> }).toObject() : created
    const link = { ...raw, _id: String(raw._id) }
    return success(link, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create quick link.")
  }
}
