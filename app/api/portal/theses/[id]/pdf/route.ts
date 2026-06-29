import { configuredCloudinary } from "@/lib/cloudinary"
import { thesesRepository } from "@/features/portal/repositories/theses.repository"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get("download") === "1"

    const thesis = (await thesesRepository.findById(id)) as Record<
      string,
      unknown
    > | null
    const pdfUrl = thesis?.pdfUrl as string | undefined
    const cloudinaryPublicId = thesis?.cloudinaryPublicId as
      | string
      | undefined

    if (!pdfUrl && !cloudinaryPublicId)
      return new Response("No file", { status: 404 })

    const isPdf =
      !!pdfUrl?.includes("/raw/upload/") ||
      !!cloudinaryPublicId?.endsWith(".pdf")

    let fetchUrl: string

    if (isPdf && cloudinaryPublicId) {
      const format =
        cloudinaryPublicId.split(".").pop() ||
        pdfUrl?.split(".").pop() ||
        "pdf"
      fetchUrl = configuredCloudinary.utils.private_download_url(
        cloudinaryPublicId,
        format,
        {
          resource_type: "raw",
          type: "upload",
          attachment: false,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
      )
    } else if (isPdf && pdfUrl) {
      const publicIdMatch = pdfUrl.match(/\/raw\/upload\/(?:[^\/]+\/)*v\d+\/(.+)/)
      if (publicIdMatch) {
        const pid = publicIdMatch[1].replace(/\.[^.]+$/, "")
        const format = pid.split(".").pop() || "pdf"
        fetchUrl = configuredCloudinary.utils.private_download_url(
          pid,
          format,
          {
            resource_type: "raw",
            type: "upload",
            attachment: false,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          }
        )
      } else {
        fetchUrl = pdfUrl
      }
    } else {
      fetchUrl = pdfUrl!
    }

    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) {
      return new Response(`Failed to fetch file (${res.status})`, {
        status: 502,
      })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const filename =
      (thesis?.fileName as string) || `${thesis?.title || "thesis"}.pdf`

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download
          ? `attachment; filename="${filename}"`
          : "inline",
      },
    })
  } catch (err) {
    console.error("PDF proxy error:", err)
    return new Response("Internal server error", { status: 500 })
  }
}
