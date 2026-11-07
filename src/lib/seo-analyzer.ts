// Client-safe on-page SEO checks for blog posts (Yoast-style). Used live in the editor and in the SEO dashboard.
export type SeoInput = { title: string; seoTitle?: string | null; seoDescription?: string | null; slug: string; body: string; focusKeyword?: string | null; image?: string | null; excerpt?: string | null };
export type Check = { id: string; label: string; status: "good" | "ok" | "bad"; tip?: string; weight: number };
export type SeoReport = { score: number; checks: Check[]; words: number; readingMin: number; density: number };

const strip = (h: string) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;|&#\d+;/g, " ").replace(/\s+/g, " ").trim();
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const count = (hay: string, needle: string) => (needle ? hay.split(needle).length - 1 : 0);

export function analyzeSeo(i: SeoInput): SeoReport {
  const text = strip(i.body);
  const words = text ? text.split(" ").length : 0;
  const kw = norm(i.focusKeyword ?? "");
  const kwSlug = kw.replace(/ /g, "-");
  const title = i.seoTitle?.trim() || i.title;
  const desc = i.seoDescription?.trim() || "";
  const ntext = norm(text);
  const firstPara = norm(strip(i.body.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? text.slice(0, 300)));
  const h2s = [...i.body.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].map((m) => norm(strip(m[1])));
  const imgs = [...i.body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const imgsNoAlt = imgs.filter((t) => !/alt="[^"]+"/i.test(t)).length;
  const links = [...i.body.matchAll(/<a\b[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const internal = links.filter((h) => h.startsWith("/") || /arthroscopycollege\.com/.test(h)).length;
  const external = links.length - internal;
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 2);
  const avgSentence = sentences.length ? words / sentences.length : 0;
  const longParas = [...i.body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].filter((m) => strip(m[1]).split(" ").length > 150).length;
  const kwCount = kw ? count(ntext, kw) : 0;
  const density = kw && words ? (kwCount * kw.split(" ").length * 100) / words : 0;

  const c: Check[] = [];
  const add = (id: string, label: string, status: Check["status"], weight: number, tip?: string) => c.push({ id, label, status, weight, tip });

  if (!kw) add("kw", "Focus keyword set", "bad", 3, "Pick the one search phrase this post should rank for, e.g. “ACL reconstruction recovery”.");
  else {
    add("kw-title", "Focus keyword in SEO title", norm(title).includes(kw) ? "good" : "bad", 3, "Put the keyword in the title, ideally near the start.");
    add("kw-desc", "Focus keyword in meta description", norm(desc).includes(kw) ? "good" : "bad", 2);
    add("kw-slug", "Focus keyword in URL", i.slug.includes(kwSlug) ? "good" : "ok", 1, `Try a URL like /journal/${kwSlug}.`);
    add("kw-intro", "Focus keyword in the first paragraph", firstPara.includes(kw) ? "good" : "bad", 2);
    add("kw-h2", "Focus keyword in a subheading", h2s.some((h) => h.includes(kw)) ? "good" : "ok", 1);
    add("kw-density", `Keyword density ${density.toFixed(1)}% (${kwCount}×)`, density >= 0.5 && density <= 2.5 ? "good" : density > 2.5 ? "bad" : "ok", 2, density > 2.5 ? "Too many repeats reads as keyword stuffing. Use synonyms." : "Use the keyword a few more times naturally.");
  }
  add("title-len", `SEO title length ${title.length}/60`, title.length >= 30 && title.length <= 60 ? "good" : title.length > 0 && title.length <= 70 ? "ok" : "bad", 2, "Aim for 30–60 characters so Google shows it in full.");
  add("desc-len", `Meta description ${desc.length}/160`, desc.length >= 120 && desc.length <= 160 ? "good" : desc.length >= 70 ? "ok" : "bad", 2, "Write 120–160 characters that make someone want to click.");
  add("words", `${words} words`, words >= 800 ? "good" : words >= 400 ? "ok" : "bad", 2, "Posts of 800+ words tend to rank better for competitive topics.");
  add("h2", `${h2s.length} subheadings`, h2s.length >= 2 ? "good" : h2s.length === 1 ? "ok" : "bad", 1, "Break the post into sections with H2 headings.");
  add("internal", `${internal} internal link${internal === 1 ? "" : "s"}`, internal >= 2 ? "good" : internal === 1 ? "ok" : "bad", 2, "Link to a programme page or related post, e.g. /programs/fellowship-in-arthroscopy.");
  add("external", `${external} outbound link${external === 1 ? "" : "s"}`, external >= 1 ? "good" : "ok", 1, "Cite a trusted source (journal, society) where it helps the reader.");
  add("cover", "Cover image set", i.image ? "good" : "bad", 1, "Posts with a cover image get richer previews on Google and social.");
  add("alt", imgs.length ? `${imgs.length - imgsNoAlt}/${imgs.length} images have alt text` : "No images in the post", imgs.length === 0 ? "ok" : imgsNoAlt === 0 ? "good" : "bad", 1, "Describe each image in its alt text.");
  add("read-sentence", `Average sentence ${avgSentence.toFixed(0)} words`, avgSentence <= 20 ? "good" : avgSentence <= 25 ? "ok" : "bad", 1, "Shorter sentences are easier to read on a phone.");
  add("read-para", longParas ? `${longParas} very long paragraph${longParas === 1 ? "" : "s"}` : "Paragraph length", longParas ? "ok" : "good", 1, "Keep paragraphs under ~150 words.");
  add("excerpt", "Excerpt written", (i.excerpt ?? "").trim().length >= 50 ? "good" : "ok", 1, "Shown on the blog list and used when the meta description is empty.");

  const total = c.reduce((s, x) => s + x.weight, 0);
  const got = c.reduce((s, x) => s + (x.status === "good" ? x.weight : x.status === "ok" ? x.weight / 2 : 0), 0);
  return { score: Math.round((got / total) * 100), checks: c, words, readingMin: Math.max(1, Math.round(words / 220)), density };
}

export const scoreTone = (s: number) => (s >= 80 ? { label: "Good", cls: "bg-[#cdfee1] text-[#0c5132]", bar: "bg-[#14a44d]", stroke: "stroke-[#14a44d]" } : s >= 55 ? { label: "Needs work", cls: "bg-[#fff1d6] text-[#5e4200]", bar: "bg-[#e0a100]", stroke: "stroke-[#e0a100]" } : { label: "Poor", cls: "bg-[#fee3e1] text-[#8e1f0b]", bar: "bg-[#d4351c]", stroke: "stroke-[#d4351c]" });
