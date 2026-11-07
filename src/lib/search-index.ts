import "server-only";
import { FAQS } from "./programs";
import { getPrograms } from "./program-store";
import { VIDEOS } from "./videos";
import { getArticles } from "./content";
import { norm, type SearchItem } from "./search";

const STATIC_PAGES: [string, string, string][] = [
  ["/dr-manu-bora", "Dr. Manu Bora", "orthopaedic arthroscopy surgeon arthrex master instructor mentor director"],
  ["/gallery", "Gallery", "photos certificates fellows operating theatre"],
  ["/videos", "Videos", "surgery films fellowship testimonials"],
  ["/apply", "Apply online", "admission application form enrol"],
  ["/contact-us", "Contact us", "address phone whatsapp email gurugram location"],
  ["/journal", "Blog", "articles arthroscopy knee shoulder"],
];

export async function buildSearchIndex(): Promise<SearchItem[]> {
  const articles = await getArticles(200);
  const PROGRAMS = await getPrograms();
  return [
    ...PROGRAMS.map((p) => ({ href: `/programs/${p.slug}`, title: p.title, kind: "Programme" as const, sub: `${p.duration} · ${p.format}`, image: p.image,
      text: norm(`${p.short} ${p.audience} ${p.highlights.join(" ")} ${p.curriculum.flatMap((c) => c.items).join(" ")}`).slice(0, 1200) })),
    ...STATIC_PAGES.map(([href, title, text]) => ({ href, title, kind: "Page" as const, text })),
    ...FAQS.map((f, i) => ({ href: `/programs/fellowship-in-arthroscopy#faq-${i}`, title: f.q, kind: "FAQ" as const, sub: f.a.slice(0, 110), text: norm(f.a).slice(0, 600) })),
    ...articles.map((a) => ({ href: `/journal/${a.slug}`, title: a.title, kind: "Article" as const, sub: a.excerpt?.slice(0, 110), image: a.image ?? undefined, text: norm(a.excerpt ?? "").slice(0, 400) })),
    ...VIDEOS.map((v) => ({ href: `/videos?v=${v.id}`, title: v.title, kind: "Film" as const, image: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`, text: norm(v.title) })),
  ];
}
