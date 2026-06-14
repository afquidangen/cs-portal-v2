import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get("debug") === "1"

    const report = await csoReportsRepository.findById(id) as Record<string, unknown> | null
    const originalUrl = report?.file as string | undefined
    if (!report || !originalUrl) {
      return new Response("Not found", { status: 404 })
    }

    let fileUrl = originalUrl

    if (fileUrl.endsWith(".pdf.pdf")) {
      fileUrl = fileUrl.slice(0, -5)
    }

    const reportData = {
      id: report.id as string ?? id,
      title: report.title as string ?? "unknown",
      cloudinaryPublicId: report.cloudinaryPublicId as string | undefined,
      originalUrl,
      normalizedUrl: fileUrl,
      hadDoublePdf: originalUrl !== fileUrl,
    }

    const cloudinaryRes = await fetch(fileUrl)
    const cloudinaryStatus = cloudinaryRes.status
    const cloudinaryHeaders = Object.fromEntries(cloudinaryRes.headers.entries())
    const cloudinaryBody = await cloudinaryRes.text().catch(() => "unknown")

    if (debug) {
      return Response.json({
        report: reportData,
        cloudinary: {
          url: fileUrl,
          status: cloudinaryStatus,
          headers: cloudinaryHeaders,
          body: cloudinaryBody.slice(0, 1000),
        },
      })
    }

    if (!cloudinaryRes.ok) {
      console.error("PDF proxy: Cloudinary fetch failed", { url: fileUrl, status: cloudinaryStatus, body: cloudinaryBody.slice(0, 500) })
      return new Response(`Failed to fetch PDF (${cloudinaryStatus})`, { status: 502 })
    }

    const blob = await cloudinaryRes.blob()

    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    })
  } catch (err) {
    console.error("PDF proxy error:", err)
    return new Response("Internal server error", { status: 500 })
  }
}
