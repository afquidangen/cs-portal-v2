import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { uploadFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function GET() {
  try {
    const reports = await csoReportsRepository.findAll()
    return success(reports)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch CSO reports.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Report id and title are required.")
    }

    if (typeof body.image === "string" && body.image.startsWith("data:")) {
      try {
        const result = await uploadFile(body.image, `cso-report-${Date.now()}`, "cso-reports", "image")
        body.image = result.secureUrl
        body.cloudinaryPublicId = result.publicId
      } catch {
        console.error("Cloudinary upload failed, keeping base64 image.")
      }
    }

    const report = await csoReportsRepository.create(body)
    return success(report, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create CSO report.")
  }
}
