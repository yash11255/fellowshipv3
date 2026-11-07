// Client-safe search: tolerant token matching over a small catalog (fits easily in memory).
export type SearchItem = { handle: string; title: string; image?: string; price: number; compareAt: number; kind: string; goals: string[]; actives: string[]; text: string; available: boolean };

const SYN: Record<string, string[]> = {
  joint: ["joints", "knee", "cartilage", "arthritis", "mobility"], sleep: ["insomnia", "stress", "calm", "relax"], energy: ["tired", "fatigue", "stamina"],
  skin: ["wrinkles", "glow", "ageing", "aging", "collagen"], hair: ["hairfall", "hair fall", "nails"], gut: ["bloating", "digestion", "probiotic"],
  heart: ["cholesterol", "omega", "bp"], sugar: ["diabetes", "glucose", "metabolic", "insulin"], muscle: ["gym", "recovery", "creatine", "strength", "protein"],
  longevity: ["anti aging", "anti-ageing", "nad", "nmn", "age"], weight: ["fat", "weight loss", "slim"],
};

export const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9+ ]/g, " ").replace(/\s+/g, " ").trim();

function expand(q: string) {
  const terms = new Set(norm(q).split(" ").filter(Boolean));
  for (const [k, vs] of Object.entries(SYN)) if (terms.has(k) || vs.some((v) => norm(q).includes(v))) { terms.add(k); vs.forEach((v) => v.split(" ").forEach((w) => terms.add(w))); }
  return [...terms];
}

export function search(items: SearchItem[], q: string, limit = 8) {
  const n = norm(q);
  if (!n) return [];
  const terms = expand(q);
  return items
    .map((it) => {
      const title = norm(it.title);
      let score = 0;
      if (title.startsWith(n)) score += 12;
      else if (title.includes(n)) score += 8;
      for (const t of terms) {
        if (t.length < 2) continue;
        if (title.includes(t)) score += 4;
        else if (it.actives.some((a) => norm(a).includes(t))) score += 3;
        else if (it.goals.some((g) => norm(g).includes(t))) score += 2;
        else if (it.text.includes(t)) score += 1;
      }
      if (!it.available) score -= 1;
      return { it, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}
