// Rule-based admissions assistant (client-safe). Facts come from PROGRAMS/FAQS; anything else falls back to site search.
import { PROGRAMS, inr } from "./programs";
import { norm, search, type SearchItem } from "./search";

export type Reply = { text: string; results?: SearchItem[]; links?: { label: string; href: string }[]; chips?: string[] };

export const WHATSAPP = "https://wa.me/919650620870?text=Hi%2C%20I%20have%20a%20question%20about%20Arthroscopy%20College";
export const START_CHIPS = ["Fellowship fee", "Programme duration", "Who can apply?", "How do I apply?", "Where is it?", "Talk to a human"];

const P = (slug: string) => PROGRAMS.find((p) => p.slug === slug)!;
const feeLine = (slug: string) => { const p = P(slug); return p.fee.length ? p.fee.map((f) => `${f.label}: ${inr(f.amount)}${f.note ? ` ${f.note}` : ""}`).join("; ") : "shared by our coordinator after you apply"; };

function which(q: string) {
  if (/acl course|next gen|nextgen|5 day|five day|quad|let\b/.test(q)) return "advance-acl-course";
  if (/workshop|weekend|2 day|two day/.test(q)) return "acl-rehab-workshop";
  if (/physio|internship|rehab/.test(q)) return "physiotherapy-internship";
  if (/online/.test(q)) return "online-fellowship";
  if (/fellowship|fellow/.test(q)) return "fellowship-in-arthroscopy";
  return null;
}

export function respond(input: string, items: SearchItem[]): Reply {
  const q = norm(input);
  const has = (re: RegExp) => re.test(q);
  const slug = which(q);
  const prog = slug ? P(slug) : null;
  const progLinks = (s: string) => [{ label: "Programme details", href: `/programs/${s}` }, { label: "Apply", href: `/apply?program=${s}` }];

  if (has(/chest pain|emergency|accident|injur(ed|y) (now|today)|bleeding/)) return { text: "For a medical emergency please call 112 or visit the nearest hospital. For an appointment with Dr. Manu Bora, message the clinic team.", links: [{ label: "WhatsApp the clinic", href: WHATSAPP }] };
  if (has(/^(hi|hello|hey|namaste|hii+|good (morning|evening|afternoon))\b/)) return { text: "Hi! I'm the Arthroscopy College assistant. Ask me about programmes, fees, eligibility or how to apply.", chips: START_CHIPS };
  if (has(/thank|thanks|great|awesome|perfect/)) return { text: "Happy to help! Anything else?", chips: ["How do I apply?", "Talk to a human"] };

  if (has(/fee|fees|cost|price|charges|how much|payment|pay\b|emi|installment|deposit/)) {
    if (prog) return { text: `${prog.title}: ${feeLine(prog.slug)}.${prog.deposit ? ` You pay ${prog.deposit}% at booking and the balance on joining.` : ""}`, links: progLinks(prog.slug) };
    return { text: `Fellowship in Arthroscopy: ${feeLine("fellowship-in-arthroscopy")}. Next-Gen ACL Course: ${feeLine("advance-acl-course")}. ACL Rehab Workshop: ${feeLine("acl-rehab-workshop")}. Payment is online (UPI, cards, netbanking) after your application is accepted.`, chips: ["Fellowship fee", "ACL course fee", "Physiotherapy internship fee"] };
  }
  if (has(/how long|duration|days|weeks|month|extend/)) {
    if (prog) return { text: `${prog.title} runs ${prog.duration}${prog.schedule ? `, ${prog.schedule.toLowerCase()}` : ""}.`, links: progLinks(prog.slug) };
    return { text: PROGRAMS.filter((p) => p.slug !== "online-fellowship").map((p) => `${p.title}: ${p.duration}`).join(". ") + "." };
  }
  if (has(/eligib|who can|qualif|require|criteria|mbbs|ms ortho|dnb|resident|student/)) {
    if (prog) return { text: `${prog.title} is for: ${prog.eligibility.join("; ")}.`, links: progLinks(prog.slug) };
    return { text: "Surgical programmes are for orthopaedic surgeons (MS/DNB Ortho), fellows and residents. Physiotherapy programmes are for physiotherapists, final-year students and coaches.", links: [{ label: "Compare programmes", href: "/programs" }] };
  }
  if (has(/apply|admission|enrol|enroll|register|join|seat|application|status/)) return { text: "Apply online in about three minutes. Our coordinator calls you within two working days. If you're accepted, you get a secure payment link to reserve your seat. You can track your application under Student login.", links: [{ label: "Apply now", href: slug ? `/apply?program=${slug}` : "/apply" }, { label: "Track my application", href: "/account" }] };
  if (has(/certif|arthrex/)) return { text: "Yes. Every programme ends with a certificate, and the fellowship includes a certificate from Arthrex.", links: [{ label: "See certificate photos", href: "/gallery" }] };
  if (has(/hands on|observ|operate|surgery|ot\b|theatre|cadaver|live/)) return { text: "Training is hands-on. Fellows scrub in for 30–40 surgeries a month with Dr. Manu Bora, plus knee and shoulder model training and VR sessions.", links: [{ label: "Watch from the theatre", href: "/videos" }] };
  if (has(/where|location|address|city|gurgaon|gurugram|stay|hostel|accommodation|hotel/)) return { text: "Training happens in Gurugram, Haryana (Orthosport & Threads Physio, Golf Course Road, DLF Phase 1, Sector 27). For accommodation help, ask our team on WhatsApp.", links: [{ label: "Contact & map", href: "/contact-us" }, { label: "WhatsApp us", href: WHATSAPP }] };
  if (has(/procedure|learn|curriculum|syllabus|cover|topics/)) {
    const p = prog ?? P("fellowship-in-arthroscopy");
    return { text: `${p.title} covers: ${p.curriculum.map((c) => `${c.title} (${c.items.slice(0, 3).join(", ")}${c.items.length > 3 ? "…" : ""})`).join("; ")}.`, links: progLinks(p.slug) };
  }
  if (has(/dr|doctor|manu|bora|faculty|mentor|teacher/)) return { text: "Programmes are led by Dr. Manu Bora, orthopaedic and arthroscopy surgeon and Arthrex Master Instructor. Physiotherapy programmes are led by Dr. Viraj Pandya, Head Physiotherapist at Threads Physio.", links: [{ label: "Meet Dr. Bora", href: "/dr-manu-bora" }] };
  if (has(/human|agent|call|phone|whatsapp|contact|speak|talk/)) return { text: "Our admissions team is on WhatsApp and phone (+91 96506 20870), Mon–Sat.", links: [{ label: "Chat on WhatsApp", href: WHATSAPP }, { label: "Contact form", href: "/contact-us" }] };
  if (prog) return { text: `${prog.title}: ${prog.short}`, links: progLinks(prog.slug) };

  const hits = search(items, input, 3);
  if (hits.length) return { text: "Here's what I found:", results: hits };
  return { text: "I'm not sure about that one. I can help with programmes, fees, eligibility and applications, or connect you with the team.", chips: START_CHIPS };
}
