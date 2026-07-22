import { baseHtml } from "./base"

export function announcementHtml(
  title: string,
  summary: string,
  date: string,
  postedBy?: string,
): string {
  const byLine = postedBy
    ? `<p style="color:#94a3b8;font-size:13px;margin:0 0 20px;line-height:1.5;">Posted by <strong>${postedBy}</strong></p>`
    : ""

  return baseHtml(`
    <p style="color:#1e293b;font-size:18px;margin:0 0 4px;line-height:1.4;font-weight:700;">${title}</p>

    <p style="color:#64748b;font-size:12px;margin:0 0 16px;line-height:1.5;">${date}</p>

    <p style="color:#475569;font-size:14px;margin:0 0 12px;line-height:1.6;">${summary}</p>

    ${byLine}

    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${process.env.APP_URL || "https://adal.uipmainccs.cloud"}/portal/announcements"
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View Announcement
      </a>
    </div>
  `)
}
