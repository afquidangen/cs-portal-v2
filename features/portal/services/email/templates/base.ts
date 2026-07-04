export function baseHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:28px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">COMSCITE PORTAL</h1>
              <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">ISPSC Main Campus - Computing Studies Unit</p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 24px;">
              ${body}
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#64748b;font-size:12px;margin:0 0 4px;line-height:1.5;">
                This is an automated message from the COMSCITE Portal.
                <br />Please do not reply to this email.
              </p>
              <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.5;">
                &copy; ${new Date().getFullYear()} COMSCITE Portal &mdash; ISPSC Main Campus - Computing Studies Unit.
                <br />All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
