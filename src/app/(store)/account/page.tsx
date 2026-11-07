import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { desc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { inr, type Program } from "@/lib/programs";
import { getAllPrograms } from "@/lib/program-store";
import { FEATURED_VIDEOS } from "@/lib/videos";
import { LiteYouTube } from "@/components/video/lite-youtube";

export const metadata: Metadata = { title: "Student dashboard", robots: { index: false } };
const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const WA = "https://wa.me/919650620870?text=Hi%2C%20my%20application%20number%20is%20";

type App = typeof schema.applications.$inferSelect;
const STAGES = ["Applied", "Accepted", "Seat reserved", "Enrolled"];
const STAGE: Record<App["status"], number> = { new: 1, reviewing: 1, accepted: 2, paid: 3, enrolled: 4, rejected: 0, withdrawn: 0 };
const LABEL: Record<App["status"], string> = { new: "Received", reviewing: "Under review", accepted: "Accepted, payment due", paid: "Seat reserved", enrolled: "Enrolled", rejected: "Not selected", withdrawn: "Withdrawn" };

function NextStep({ a }: { a: App }) {
  const box = "rounded-[24px] p-6 md:p-8";
  if (a.status === "accepted" && a.paymentToken) return (
    <div className={`${box} bg-navy text-white`}>
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-teal">Next step</p>
      <p className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Pay {inr(a.payNow ?? 0)} to reserve your seat</p>
      <p className="mt-2 text-white/70">Seats are allotted in order of payment{a.cohort ? ` for the ${a.cohort} batch` : ""}.</p>
      <Link href={`/pay/${a.paymentToken}`} className="mt-5 inline-flex h-12 items-center rounded-full bg-teal px-6 text-[15px] font-semibold text-ink">Pay now</Link>
    </div>
  );
  if (a.status === "paid") return (
    <div className={`${box} bg-[#e6f6ec]`}>
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-[#0c5132]">You&apos;re in</p>
      <p className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Your seat is reserved{a.cohort ? ` for ${a.cohort}` : ""}.</p>
      <p className="mt-2 text-ink/65">Our coordinator will share joining dates, reporting time and what to bring. The balance is payable on joining.</p>
    </div>
  );
  if (a.status === "enrolled") return <div className={`${box} bg-mist`}><p className="text-[24px] font-semibold tracking-[-0.02em]">You&apos;re enrolled. See you in Gurugram!</p></div>;
  if (a.status === "rejected" || a.status === "withdrawn") return <div className={`${box} bg-mist`}><p className="text-[20px] font-semibold">{a.status === "rejected" ? "We couldn't offer a seat this time." : "This application was withdrawn."}</p><Link href="/apply" className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white">Apply for another cohort</Link></div>;
  return (
    <div className={`${box} bg-mist`}>
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-brand">What happens now</p>
      <p className="mt-2 text-[24px] font-semibold tracking-[-0.02em]">Our coordinator will call you within two working days.</p>
      <p className="mt-2 text-ink/65">Keep your phone handy. If you&apos;re accepted, a secure payment link appears right here and in your email.</p>
    </div>
  );
}

function AppCard({ a, p }: { a: App; p?: Program }) {
  const stage = STAGE[a.status];
  const total = a.feeAmount ? Math.round(a.feeAmount * (1 + a.gstRate / 100)) : null;
  return (
    <article className="overflow-hidden rounded-[32px] border border-ink/10">
      <div className="grid md:grid-cols-[260px_1fr]">
        <div className="relative aspect-[16/9] bg-mist md:aspect-auto">{p && <Image src={p.image} alt="" fill sizes="(min-width:768px) 260px, 100vw" className="object-cover" />}</div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-ink/50">{a.number} · applied {date(a.createdAt)}</p>
              <h2 className="mt-1 text-[clamp(1.3rem,1.1rem+0.8vw,1.75rem)] font-semibold leading-tight tracking-[-0.025em]">{p?.title ?? a.programSlug}</h2>
              <p className="mt-1 text-[14px] text-ink/55">{p?.duration} · {p?.format}{a.cohort ? ` · ${a.cohort} batch` : ""}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${stage >= 3 ? "bg-[#e6f6ec] text-[#0c5132]" : stage === 2 ? "bg-[#fff4d6] text-[#6b4e00]" : stage === 0 ? "bg-ink/5 text-ink/60" : "bg-mist"}`}>{LABEL[a.status]}</span>
          </div>
          {stage > 0 && (
            <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
              {STAGES.map((t, i) => (
                <li key={t}><div className={`h-1.5 rounded-full transition-colors ${i < stage ? "bg-ink" : "bg-ink/10"}`} /><p className={`mt-2 text-[12px] ${i < stage ? "font-medium text-ink" : "text-ink/40"}`}>{t}</p></li>
              ))}
            </ol>
          )}
        </div>
      </div>
      <div className="grid gap-4 border-t border-ink/10 p-4 md:grid-cols-[1.4fr_1fr] md:p-6">
        <NextStep a={a} />
        <div className="rounded-[24px] border border-ink/10 p-6">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink/45">Fees</p>
          {total ? (
            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-ink/60">Programme fee + {a.gstRate}% GST</dt><dd className="font-semibold">{inr(total)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/60">{a.paidAt ? "Paid" : "Due to reserve"}</dt><dd className="font-semibold">{inr(a.payNow ?? 0)}</dd></div>
              {a.paidAt && <div className="flex justify-between"><dt className="text-ink/60">Balance on joining</dt><dd className="font-semibold">{inr(Math.max(0, total - (a.payNow ?? 0)))}</dd></div>}
              {a.paidAt && <p className="pt-2 text-[12px] text-ink/45">Paid {date(a.paidAt)} · ref {a.razorpayPaymentId}</p>}
            </dl>
          ) : <p className="mt-3 text-[14px] text-ink/60">Shared by our coordinator after review.</p>}
          <a href={`${WA}${a.number}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-[14px] font-semibold text-brand hover:underline">Message your coordinator →</a>
        </div>
      </div>
    </article>
  );
}

async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const apps = await (await db()).select().from(schema.applications).where(or(eq(schema.applications.email, user.email.toLowerCase()), eq(schema.applications.userId, user.id))).orderBy(desc(schema.applications.createdAt));
  const all = await getAllPrograms();
  const first = apps[0]?.name.split(" ")[0];
  const enrolled = apps.some((a) => a.status === "paid" || a.status === "enrolled");
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[14px] text-ink/50">{user.email}</p>
          <h1 className="mt-1 text-[clamp(2.2rem,1.5rem+2.4vw,3.5rem)] font-semibold leading-[1] tracking-[-0.04em]">{first ? `Hi, ${first}.` : "Your dashboard"}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/apply" className="inline-flex h-10 items-center rounded-full border border-ink/15 px-4 text-[14px] font-medium hover:border-ink">New application</Link>
          <form action={logout}><button className="h-10 rounded-full px-4 text-[14px] font-medium text-ink/60 hover:text-ink">Sign out</button></form>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="mt-10 grid overflow-hidden rounded-[32px] bg-mist md:grid-cols-2">
          <div className="p-8 md:p-12">
            <p className="text-[24px] font-semibold tracking-[-0.02em]">No applications under this email yet.</p>
            <p className="mt-2 text-ink/60">You&apos;re signed in as <strong>{user.email}</strong>. Applied with a different email? Sign out and sign in with that one.</p>
            <Link href="/apply" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-white hover:bg-brand">Start an application</Link>
          </div>
          <div className="relative min-h-[220px]"><Image src="/img/cert-1.jpg" alt="" fill sizes="50vw" className="object-cover" /></div>
        </div>
      ) : <div className="mt-10 space-y-6">{apps.map((a) => <AppCard key={a.id} a={a} p={all.find((x) => x.slug === a.programSlug)} />)}</div>}

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-mist p-7 md:col-span-1">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">{enrolled ? "Before you join" : "Good to know"}</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink/75">
            {["Medical degree and registration certificate (copies)", "Government photo ID", "Two passport-size photos", "Scrubs and OT footwear", "Reach the clinic by 9am on day one"].map((t) => (
              <li key={t} className="flex gap-3"><svg className="mt-1 shrink-0 text-brand" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M5 12l5 5L19 7" /></svg>{t}</li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] text-ink/50">Your coordinator confirms the final list by email.</p>
        </div>
        <div className="rounded-[28px] border border-ink/10 p-7 md:col-span-2">
          <div className="flex items-end justify-between gap-4"><h2 className="text-[20px] font-semibold tracking-[-0.02em]">Prepare with these films</h2><Link href="/videos" className="text-[14px] font-semibold text-brand hover:underline">All films →</Link></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FEATURED_VIDEOS.slice(0, 2).map((v) => <div key={v.id}><LiteYouTube id={v.id} title={v.title} /><p className="mt-2 line-clamp-2 text-[14px] font-medium">{v.title}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[28px] border border-ink/10 p-7 md:flex-row md:items-center">
        <div><p className="text-[18px] font-semibold">Questions about your application?</p><p className="text-[14px] text-ink/60">Admissions: +91 96506 20870 · Mon–Sat</p></div>
        <div className="flex gap-2"><a href="tel:+919650620870" className="inline-flex h-11 items-center rounded-full border border-ink/15 px-5 text-[14px] font-semibold hover:border-ink">Call</a><a href={WA.replace("my%20application%20number%20is%20", "I%20have%20a%20question")} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white">WhatsApp</a></div>
      </section>
    </>
  );
}

export default function Page() {
  return <div className="page max-w-6xl py-10 text-ink md:py-14"><Suspense fallback={<div className="min-h-[60vh]" aria-busy />}><Dashboard /></Suspense></div>;
}
