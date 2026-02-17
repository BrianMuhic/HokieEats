/**
 * Email service for OTP delivery
 * Uses Resend in production; logs to console in development
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "VT Eating <noreply@vteating.com>";

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #861F41;">VT Eating</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p style="color: #666;">This code expires in 10 minutes.</p>
      <p style="color: #666;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Your VT Eating verification code",
        html,
      });
      return !error;
    } catch (err) {
      console.error("Resend error:", err);
      return false;
    }
  }

  // Development fallback: log to console
  console.log(`[DEV] OTP for ${to}: ${code}`);
  return true;
}
