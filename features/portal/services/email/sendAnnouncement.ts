import { transporter, FROM_ADDRESS } from "./transporter"
import { announcementHtml } from "./templates/announcement"
import { NotificationLogModel } from "@/lib/models"

type AnnouncementData = {
  id: string
  title: string
  content: string
  date: string
  createdBy?: string
}

type StudentData = {
  id: string
  email: string
}

export async function sendAnnouncementEmail(
  student: StudentData,
  announcement: AnnouncementData,
): Promise<{ status: "sent" | "failed"; error?: string }> {
  if (!student.email || !student.email.includes("@")) {
    return { status: "failed", error: "Invalid email address" }
  }

  try {
    const summary =
      announcement.content.length > 200
        ? announcement.content.slice(0, 200) + "..."
        : announcement.content

    const html = announcementHtml(
      announcement.title,
      summary,
      announcement.date,
      announcement.createdBy,
    )

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: student.email,
      subject: "New Announcement from Student Portal",
      html,
    })

    await NotificationLogModel.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "announcement",
      studentId: student.id,
      announcementId: announcement.id,
      email: student.email,
      status: "sent",
      timestamp: new Date(),
    })

    return { status: "sent" }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"

    await NotificationLogModel.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "announcement",
      studentId: student.id,
      announcementId: announcement.id,
      email: student.email,
      status: "failed",
      errorMessage,
      timestamp: new Date(),
    })

    return { status: "failed", error: errorMessage }
  }
}

export async function sendAnnouncementEmails(
  students: StudentData[],
  announcement: AnnouncementData,
  batchSize = 50,
): Promise<void> {
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map((student) => sendAnnouncementEmail(student, announcement)),
    )
  }
}
