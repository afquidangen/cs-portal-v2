import { csoInfoRepository } from "@/features/portal/repositories/cso-info.repository"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { uploadFile, deleteFile, destroyFile } from "@/lib/cloudinary"
import { requireCsoAccess } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET() {
  try {
    const records = await csoInfoRepository.findAll() as Record<string, unknown>[]
    const record = records[0] ?? null
    return success(record)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch CSO info.")
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const body = await request.json()
    if (!body.orgName) {
      return badRequest("Organization name is required.")
    }

    const existing = await csoInfoRepository.findAll() as Record<string, unknown>[]
    const existingRecord = existing[0] as Record<string, unknown> | undefined

    async function destroyExistingLogo() {
      if (!existingRecord) return
      const pid = existingRecord?.logoPublicId as string | undefined
      if (pid) {
        await destroyFile(pid, "image").catch(() => {})
        return
      }
      const url = existingRecord?.logoUrl as string | undefined
      if (url) {
        await deleteFile(url).catch(() => {})
      }
    }

    async function destroyExistingPortalLogo() {
      if (!existingRecord) return
      const pid = existingRecord?.portalLogoPublicId as string | undefined
      if (pid) {
        await destroyFile(pid, "image").catch(() => {})
        return
      }
      const url = existingRecord?.portalLogoUrl as string | undefined
      if (url && !url.startsWith("/")) {
        await deleteFile(url).catch(() => {})
      }
    }

    let logoUrl = body.logoUrl
    let logoPublicId: string | undefined

    if (logoUrl === "") {
      await destroyExistingLogo()
      logoPublicId = ""
    } else if (typeof logoUrl === "string" && logoUrl.startsWith("data:")) {
      const result = await uploadFile(logoUrl, `cso-logo-${Date.now()}`, "cso-info", "image")
      logoUrl = result.secureUrl
      logoPublicId = result.publicId
      await destroyExistingLogo()
    } else {
      logoPublicId = body.logoPublicId ?? (existingRecord?.logoPublicId as string) ?? undefined
    }

    let portalLogoUrl = body.portalLogoUrl
    let portalLogoPublicId: string | undefined

    if (portalLogoUrl === "") {
      await destroyExistingPortalLogo()
      portalLogoPublicId = ""
    } else if (typeof portalLogoUrl === "string" && portalLogoUrl.startsWith("data:")) {
      const result = await uploadFile(portalLogoUrl, `portal-logo-${Date.now()}`, "portal-logo", "image")
      portalLogoUrl = result.secureUrl
      portalLogoPublicId = result.publicId
      await destroyExistingPortalLogo()
    } else {
      portalLogoPublicId = body.portalLogoPublicId ?? (existingRecord?.portalLogoPublicId as string) ?? undefined
    }

    const updateData: Record<string, unknown> = {
      orgName: body.orgName,
      description: body.description ?? "",
      facebookLink: body.facebookLink ?? "https://www.facebook.com/profile.php?id=61587590024541",
      logoUrl,
      logoPublicId,
      portalLogoUrl,
      portalLogoPublicId,
    }

    // Single-record upsert: updates the only doc if it exists, creates one otherwise
    const created = await csoInfoRepository.upsert({}, updateData)

    const raw = created as Record<string, unknown>
    const record = { ...raw, _id: String(raw._id) }
    return success(record, 200)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to save CSO info.")
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const records = await csoInfoRepository.findAll() as Record<string, unknown>[]
    if (records.length === 0) return notFound("CSO info")

    const record = records[0] as Record<string, unknown>
    const logoPublicId = record?.logoPublicId as string | undefined
    const portalLogoPublicId = record?.portalLogoPublicId as string | undefined

    if (logoPublicId) {
      await destroyFile(logoPublicId, "image")
    }
    if (portalLogoPublicId) {
      await destroyFile(portalLogoPublicId, "image")
    }

    await csoInfoRepository.deleteMany()
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete CSO info.")
  }
}
