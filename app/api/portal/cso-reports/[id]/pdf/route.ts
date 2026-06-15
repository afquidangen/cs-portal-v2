import { configuredCloudinary } from "@/lib/cloudinary"
import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get("download") === "1"

    const report = (await csoReportsRepository.findById(id)) as Record<
      string,
      unknown
    > | null
    const file = report?.file as string | undefined
    const cloudinaryPublicId = report?.cloudinaryPublicId as string | undefined

    if (!file && !cloudinaryPublicId)
      return new Response("No file", { status: 404 })

    const isPdf =
      !!file?.includes("/raw/upload/") ||
      !!cloudinaryPublicId?.endsWith(".pdf")

    let fetchUrl: string

    if (isPdf) {
      const format =
        cloudinaryPublicId?.split(".").pop() ||
        file?.split(".").pop() ||
        "pdf"
      fetchUrl = configuredCloudinary.utils.private_download_url(
        cloudinaryPublicId || file!,
        format,
        {
          resource_type: "raw",
          type: "upload",
          attachment: false,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        }
      )
    } else {
      fetchUrl = file!
    }

    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error("PDF proxy fetch failed", {
        status: res.status,
        body: body.slice(0, 500),
        file,
        cloudinaryPublicId,
      })
      return new Response(`Failed to fetch file (${res.status})`, {
        status: 502,
      })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const filename =
      (report?.fileName as string) || `${report?.id || "file"}.pdf`

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
