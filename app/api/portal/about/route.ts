import { aboutRepository } from "@/features/portal/repositories/about.repository"
import { success, error, notFound } from "@/lib/api-response"
import { uploadFile, destroyFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function GET() {
  try {
    const records = await aboutRepository.findAll() as Record<string, unknown>[]
    const record = records[0] ?? null
    return success(record)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch about data.")
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const existingRecords = await aboutRepository.findAll() as Record<string, unknown>[]
    const existing = existingRecords[0] as Record<string, unknown> | undefined

    const existingTeamPicPublicId = existing?.teamPicturePublicId as string | undefined
    const existingMembers = (existing?.teamMembers as Record<string, unknown>[] | undefined) ?? []
    const existingContributors = (existing?.pastContributors as Record<string, unknown>[] | undefined) ?? []

    let teamPictureUrl = body.teamPictureUrl as string | undefined
    let teamPicturePublicId = body.teamPicturePublicId as string | undefined

    if (typeof teamPictureUrl === "string" && teamPictureUrl.startsWith("data:")) {
      if (existingTeamPicPublicId) {
        await destroyFile(existingTeamPicPublicId, "image")
      }
      const result = await uploadFile(teamPictureUrl, `about-team-${Date.now()}`, "about", "image")
      teamPictureUrl = result.secureUrl
      teamPicturePublicId = result.publicId
    } else if (!teamPictureUrl && existingTeamPicPublicId) {
      await destroyFile(existingTeamPicPublicId, "image")
      teamPicturePublicId = undefined
    }

    const teamMembers = await Promise.all(
      (body.teamMembers as Record<string, unknown>[]).map(async (member, index) => {
        const img = member.imageUrl as string | undefined
        const existingMember = existingMembers[index] as Record<string, unknown> | undefined
        const existingPubId = existingMember?.cloudinaryPublicId as string | undefined

        if (typeof img === "string" && img.startsWith("data:")) {
          if (existingPubId) {
            await destroyFile(existingPubId, "image")
          }
          const result = await uploadFile(img, `about-member-${index}-${Date.now()}`, "about", "image")
          return { ...member, imageUrl: result.secureUrl, cloudinaryPublicId: result.publicId }
        }

        if (!img && existingPubId) {
          await destroyFile(existingPubId, "image")
          return { ...member, imageUrl: undefined, cloudinaryPublicId: undefined }
        }

        return member
      })
    )

    const pastContributors = await Promise.all(
      (body.pastContributors as Record<string, unknown>[]).map(async (contributor, index) => {
        const img = contributor.imageUrl as string | undefined
        const existingContributor = existingContributors[index] as Record<string, unknown> | undefined
        const existingPubId = existingContributor?.cloudinaryPublicId as string | undefined

        if (typeof img === "string" && img.startsWith("data:")) {
          if (existingPubId) {
            await destroyFile(existingPubId, "image")
          }
          const result = await uploadFile(img, `about-contributor-${index}-${Date.now()}`, "about", "image")
          return { ...contributor, imageUrl: result.secureUrl, cloudinaryPublicId: result.publicId }
        }

        if (!img && existingPubId) {
          await destroyFile(existingPubId, "image")
          return { ...contributor, imageUrl: undefined, cloudinaryPublicId: undefined }
        }

        return contributor
      })
    )

    const data = {
      teamName: body.teamName,
      description: body.description,
      acknowledgment: body.acknowledgment,
      teamPictureUrl,
      teamPicturePublicId,
      teamMembers,
      projectFacts: body.projectFacts,
      pastContributors,
    }

    let saved
    if (existing) {
      saved = await aboutRepository.update({ _id: existing._id }, data)
    } else {
      saved = await aboutRepository.create(data)
    }

    const raw = typeof saved === "object" && saved !== null && "toObject" in saved
      ? (saved as { toObject: () => Record<string, unknown> }).toObject()
      : saved as Record<string, unknown>
    const record = { ...raw, _id: String(raw._id) }
    return success(record, 200)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to save about data.")
  }
}

export async function DELETE() {
  try {
    const records = await aboutRepository.findAll() as Record<string, unknown>[]
    if (records.length === 0) return notFound("About data")

    const record = records[0] as Record<string, unknown>

    const teamPicId = record?.teamPicturePublicId as string | undefined
    if (teamPicId) {
      await destroyFile(teamPicId, "image")
    }

    const members = (record?.teamMembers as Record<string, unknown>[] | undefined) ?? []
    for (const member of members) {
      const pubId = member.cloudinaryPublicId as string | undefined
      if (pubId) {
        await destroyFile(pubId, "image")
      }
    }

    const contributors = (record?.pastContributors as Record<string, unknown>[] | undefined) ?? []
    for (const contributor of contributors) {
      const pubId = contributor.cloudinaryPublicId as string | undefined
      if (pubId) {
        await destroyFile(pubId, "image")
      }
    }

    await aboutRepository.deleteMany()
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete about data.")
  }
}
