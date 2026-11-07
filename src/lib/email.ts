import "server-only";

/**
 * Sends via Resend when RESEND_API_KEY is set. In development without a key,
 * the email is printed to the server console so sign-in codes can be tested.
 */
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is required in production");
    console.log(`\n[dev email] to=${to}\n  subject: ${subject}\n  ${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Reverse Clinics <orders@reverseclinics.com>", to, subject, text, html }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status}`);
}
