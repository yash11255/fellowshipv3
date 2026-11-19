import "server-only";
import { db, schema } from "@/db";

/**
 * Outgoing email. Provider order:
 *   1. SMTP (any mail server: Gmail/Google Workspace, Zoho, Outlook, Hostinger…) when SMTP_HOST is set
 *   2. Resend when RESEND_API_KEY is set
 *   3. Development only: printed to the server console
 * Every message is recorded in email_log (Admin → Emails).
 */
const FROM = () => process.env.EMAIL_FROM ?? "Arthroscopy College <admissions@arthroscopycollege.com>";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
/** Branded HTML version of a plain-text email (links become buttons/anchors). */
export function brandedHtml(subject: string, text: string) {
  const site = (process.env.SITE_URL ?? "https://arthroscopycollege.com").replace(/\/$/, "");
  const body = esc(text)
    .replace(/(https?:\/\/[^\s<]+)/g, (u) => (/\/pay\/|\/account|\/login/.test(u) ? `<a href="${u}" style="display:inline-block;margin:8px 0;padding:12px 22px;background:#0f1526;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">${/\/pay\//.test(u) ? "Pay securely" : "Open your dashboard"}</a>` : `<a href="${u}" style="color:#4c6fb4">${u}</a>`))
    .replace(/\n/g, "<br>");
  return `<!doctype html><html><body style="margin:0;background:#eef3f6;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#0f1526">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden">
<tr><td style="background:#192136;padding:20px 28px;color:#fff;font-weight:600;font-size:16px">Arthroscopy College</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6"><p style="margin:0 0 12px;font-size:20px;font-weight:600">${esc(subject)}</p>${body}</td></tr>
<tr><td style="padding:18px 28px;background:#f6f8fa;font-size:12px;color:#6b7280">Arthroscopy College · F-10/4, Golf Course Rd, DLF Phase 1, Sector 27, Gurugram · +91 96506 20870<br><a href="${site}" style="color:#6b7280">${site.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

async function log(row: { to: string; subject: string; body: string; provider: string; status: string; error?: string }) {
  try { await (await db()).insert(schema.emailLog).values({ ...row, error: row.error ?? null }); } catch { /* logging must never block sending */ }
}

export function emailProvider() {
  return process.env.SMTP_HOST ? "smtp" : process.env.RESEND_API_KEY ? "resend" : "dev";
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  const provider = emailProvider();
  const htmlBody = html ?? brandedHtml(subject, text);
  try {
    if (provider === "smtp") {
      const { default: nodemailer } = await import("nodemailer");
      const port = Number(process.env.SMTP_PORT ?? 587);
      const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
      await t.sendMail({ from: FROM(), to, subject, text, html: htmlBody });
    } else if (provider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM(), to, subject, text, html: htmlBody }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } else {
      if (process.env.NODE_ENV === "production") throw new Error("No mail server configured (set SMTP_HOST or RESEND_API_KEY)");
      console.log(`\n[dev email] to=${to}\n  subject: ${subject}\n  ${text}\n`);
    }
    await log({ to, subject, body: text, provider, status: provider === "dev" ? "logged" : "sent" });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await log({ to, subject, body: text, provider, status: "failed", error });
    throw e;
  }
}

/** Sends a lead notification to the leads team inboxes configured in Admin → Settings → General. No-op when none are set. */
export async function sendLeadEmail(subject: string, fields: [string, string | number | null | undefined][], note?: string) {
  const { getSettings } = await import("./settings");
  const to = (await getSettings()).leadEmails.split(",").map((e) => e.trim()).filter(Boolean);
  if (!to.length) return;
  const rows = fields.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "").map(([k, v]) => `${k}: ${v}`);
  const text = `New lead from the website.\n\n${rows.join("\n")}${note ? `\n\n${note}` : ""}\n\nReceived ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`;
  await Promise.all(to.map((addr) => sendEmail({ to: addr, subject: `[Lead] ${subject}`, text }).catch(() => {})));
}
