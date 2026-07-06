import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const FROM_ADDRESS = `"CS Portal" <${process.env.GMAIL_USER}>`

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
  appUrl: string
): Promise<void> {
  const resetLink = `${appUrl}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"CS Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your CS Portal password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Password Reset</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">
          This link expires in 15 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendOtpEmail(
  to: string,
  name: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: `"CS Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your 2FA verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <h2>Two-Factor Authentication</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0;color:#111827;">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:14px;">
          This code expires in 10 minutes. If you didn't attempt to sign in, you can ignore this email.
        </p>
      </div>
    `,
  })
}
