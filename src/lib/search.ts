// Client-safe search over a small site index (programmes, articles, films, FAQs, pages).
export type SearchKind = "Programme" | "Article" | "Film" | "FAQ" | "Page";
export type SearchItem = { href: string; title: string; kind: SearchKind; sub?: string; image?: string; text: string };

const SYN: Record<string, string[]> = {
  fellowship: ["fellow", "training", "course", "program", "programme"],
  acl: ["ligament", "cruciate", "knee", "internal brace", "quad"],
  shoulder: ["rotator", "bankart", "cuff", "pasta"],
  fee: ["fees", "cost", "price", "charges", "how much"],
  physio: ["physiotherapy", "rehab", "rehabilitation", "physiotherapist"],
  apply: ["admission", "enrol", "enroll", "register", "join"],
};

export const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9+ ]/g, " ").replace(/\s+/g, " ").trim();

function expand(q: string) {
  const n = norm(q);
  const terms = new Set(n.split(" ").filter(Boolean));
  for (const [k, vs] of Object.entries(SYN)) if (terms.has(k) || vs.some((v) => n.includes(v))) { terms.add(k); vs.forEach((v) => v.split(" ").forEach((w) => terms.add(w))); }
  return [...terms];
}

const WEIGHT: Record<SearchKind, number> = { Programme: 3, Page: 1, FAQ: 1, Article: 0, Film: 0 };

export function search(items: SearchItem[], q: string, limit = 8) {
  const n = norm(q);
  if (!n) return [];
  const terms = expand(q).filter((t) => t.length > 1);
  return items
    .map((it) => {
      const title = norm(it.title);
      let score = title.startsWith(n) ? 12 : title.includes(n) ? 8 : 0;
      for (const t of terms) score += title.includes(t) ? 4 : it.text.includes(t) ? 1 : 0;
      return { it, score: score ? score + WEIGHT[it.kind] : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}
