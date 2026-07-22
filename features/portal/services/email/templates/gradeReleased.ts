import { baseHtml } from "./base"

export function gradeReleasedHtml(
  studentName: string,
  semester: string,
  schoolYearStart: number,
  schoolYearEnd: number,
  facultyName?: string,
): string {
  const facultyLine = facultyName
    ? `<p style="color:#475569;font-size:14px;margin:0 0 4px;line-height:1.6;">Faculty: ${facultyName}</p>`
    : ""

  return baseHtml(`
    <p style="color:#1e293b;font-size:16px;margin:0 0 16px;line-height:1.6;">Hello, <strong>${studentName}</strong>!</p>

    <p style="color:#475569;font-size:14px;margin:0 0 4px;line-height:1.6;">
      Your grades for the <strong>${semester}, AY ${schoolYearStart}-${schoolYearEnd}</strong> have been released.
    </p>

    <p style="color:#475569;font-size:14px;margin:0 0 20px;line-height:1.6;">
      You may now log in to the COMSCITE Portal to view your grades.
    </p>

    ${facultyLine}

    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${process.env.APP_URL || "https://adal.uipmainccs.cloud"}/portal/grades"
         style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View Grades
      </a>
    </div>

    <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;line-height:1.5;text-align:center;">
      If you were not expecting this email, you may safely ignore it.
    </p>
  `)
}
