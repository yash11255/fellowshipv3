import Link from "next/link";

const cols = [
  { title: "Programs", links: [["Fellowship in Arthroscopy", "/programs/fellowship-in-arthroscopy"], ["Next-Gen ACL Course", "/programs/advance-acl-course"], ["Physiotherapy Internship", "/programs/physiotherapy-internship"], ["ACL Rehab Workshop", "/programs/acl-rehab-workshop"], ["Online Fellowship", "/programs/online-fellowship"]] },
  { title: "Admissions", links: [["Apply", "/apply"], ["Student login", "/account"], ["FAQs", "/programs/fellowship-in-arthroscopy#faq-0"]] },
  { title: "Explore", links: [["Dr. Manu Bora", "/dr-manu-bora"], ["Videos", "/videos"], ["Gallery", "/gallery"], ["Blog", "/journal"]] },
  { title: "Contact", links: [["+91 96506 20870", "tel:+919650620870"], ["orthosportin@gmail.com", "mailto:orthosportin@gmail.com"], ["WhatsApp", "https://wa.me/919650620870"], ["Visit us", "/contact-us"]] },
] as const;

/* Footer: navy, four columns, address line. */
export function Footer() {
  return (
    <footer className="bg-ink text-[14px] text-white/60">
      <div className="page py-12 md:py-16">
        <p className="border-b border-white/10 pb-4 leading-relaxed">Arthroscopy College, a training program of Orthosport × Threads Physio. F-10/4, Basement, Golf Course Rd, DLF Phase 1, Sector 27, Gurugram, Haryana 122001.</p>
        <div className="grid grid-cols-2 gap-8 py-6 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="font-semibold text-white">{c.title}</p>
              <ul className="mt-2 space-y-2">{c.links.map(([l, h]) => <li key={h}><Link href={h} className="hover:text-white hover:underline">{l}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 md:flex-row md:justify-between">
          <p>Copyright © 2026 Arthroscopy College. All rights reserved.</p>
          <p className="flex gap-4"><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link><Link href="/terms-conditions" className="hover:underline">Terms</Link><Link href="/disclaimer" className="hover:underline">Disclaimer</Link></p>
        </div>
      </div>
    </footer>
  );
}
