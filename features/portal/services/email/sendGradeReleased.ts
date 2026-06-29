import { transporter, FROM_ADDRESS } from "./transporter"
import { gradeReleasedHtml } from "./templates/gradeReleased"
import { NotificationLogModel } from "@/lib/models"

type GradeReleasedParams = {
  studentId: string
  studentName: string
  email: string
  semester: string
  schoolYearStart: number
  schoolYearEnd: number
  facultyName?: string
}

export async function sendGradeReleasedEmail(
  params: GradeReleasedParams,
): Promise<{ status: "sent" | "failed"; error?: string }> {
  if (!params.email || !params.email.includes("@")) {
    await NotificationLogModel.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "grade_released",
      studentId: params.studentId,
      email: params.email || "(no email)",
      status: "failed",
      errorMessage: "Invalid or missing email address",
      timestamp: new Date(),
    })
    return { status: "failed", error: "Invalid email address" }
  }

  try {
    const html = gradeReleasedHtml(
      params.studentName,
      params.semester,
      params.schoolYearStart,
      params.schoolYearEnd,
      params.facultyName,
    )

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: params.email,
      subject: "Grades Released - Student Portal",
      html,
    })

    await NotificationLogModel.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "grade_released",
      studentId: params.studentId,
      email: params.email,
      status: "sent",
      timestamp: new Date(),
    })

    return { status: "sent" }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"

    await NotificationLogModel.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "grade_released",
      studentId: params.studentId,
      email: params.email,
      status: "failed",
      errorMessage,
      timestamp: new Date(),
    })

    return { status: "failed", error: errorMessage }
  }
}
