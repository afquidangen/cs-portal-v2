import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { uploadFile } from "@/lib/cloudinary"
import { requireCsoAccess } from "@/lib/api-auth"

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
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Report id and title are required.")
    }

    if (typeof body.file === "string" && body.file.startsWith("data:")) {
      const isPdf = body.file.startsWith("data:application/pdf;")
      const resourceType = isPdf ? "raw" : "image"
      const publicId = isPdf ? `cso-report-${Date.now()}.pdf` : `cso-report-${Date.now()}`
      const result = await uploadFile(body.file, publicId, "cso-reports", resourceType)
      body.file = result.secureUrl
      body.cloudinaryPublicId = result.publicId
    }

    const report = await csoReportsRepository.create(body)
    return success(report, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create CSO report.")
  }
}
