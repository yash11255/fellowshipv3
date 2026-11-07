import type { Metadata } from "next";
import { Reveal } from "@/components/college/reveal";
import { EnquiryForm } from "@/components/content/enquiry-form";

export const metadata: Metadata = { title: "Contact us", description: "Arthroscopy College, F-10/4, Golf Course Rd, DLF Phase 1, Sector 27, Gurugram. Call +91 96506 20870 or write to orthosportin@gmail.com.", alternates: { canonical: "/contact-us" } };

const WAYS = [
  ["Call", "+91 96506 20870", "tel:+919650620870"],
  ["WhatsApp", "Chat with admissions", "https://wa.me/919650620870?text=Hi%2C%20I%20have%20a%20question%20about%20Arthroscopy%20College"],
  ["Email", "orthosportin@gmail.com", "mailto:orthosportin@gmail.com"],
];

export default function Contact() {
  return (
    <div className="text-ink">
      <section className="page grid gap-10 py-10 md:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal>
          <h1 className="text-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] font-semibold leading-[0.97] tracking-[-0.045em]">Talk to us.</h1>
          <p className="mt-5 max-w-[42ch] text-[18px] text-ink/65">Questions about a programme, dates, fees or an appointment with Dr. Bora? We reply within one working day.</p>
          <ul className="mt-10 space-y-3">
            {WAYS.map(([k, v, h]) => (
              <li key={k}><a href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border border-ink/10 px-5 py-4 transition-colors hover:border-ink">
                <span><span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">{k}</span><span className="text-[17px] font-semibold">{v}</span></span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </a></li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl bg-mist px-5 py-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">Visit</p>
            <p className="mt-1 text-[16px] leading-relaxed">F-10/4, Basement, Golf Course Rd, DLF Phase 1, Sector 27, Gurugram, Haryana 122001</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-[32px] bg-navy p-6 text-white sm:p-10">
            <h2 className="mb-6 text-[26px] font-semibold tracking-[-0.02em]">Send a message</h2>
            <EnquiryForm dark />
          </div>
        </Reveal>
      </section>
      <section className="page pb-10">
        <div className="overflow-hidden rounded-[32px] border border-ink/10">
          <iframe title="Map: Arthroscopy College, Gurugram" src="https://www.google.com/maps?q=F-10%2F4+Golf+Course+Rd+DLF+Phase+1+Sector+27+Gurugram&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[360px] w-full md:h-[440px]" />
        </div>
      </section>
    </div>
  );
}
