// Deterministic stack recommendation engine. Pure + client-safe.
// Rules are intentionally conservative. Interaction flags should be reviewed by Dr. Bora's team
// before launch, and become admin-editable in Phase 6.

import type { Goal } from "./catalog";

export type StackProduct = {
  handle: string;
  title: string;
  kind: "single" | "pack";
  goals: Goal[];
  image?: string;
  price: number;        // 1-month price
  compareAt: number;
  includes?: string[];
  keyActive?: string;
};

export type Answers = {
  age: "u30" | "30-44" | "45-59" | "60+" | null;
  goals: Goal[];                       // ordered by priority, max 3
  activity: "low" | "moderate" | "athlete" | null;
  sleep: "poor" | "ok" | "good" | null;
  diet: "veg" | "nonveg" | "vegan" | null;
  flags: Flag[];
  budget: number;                      // ₹ per month
};

export type Flag = "pregnant" | "blood-thinners" | "diabetes-meds" | "bp-meds" | "none";

export type Pick = { product: StackProduct; reasons: string[] };
export type Result =
  | { kind: "consult"; message: string }
  | { kind: "stack"; picks: Pick[]; total: number; pack?: { product: StackProduct; saving: number }; excluded: string[]; uncovered: Goal[] };

// Why each product helps, per goal. Phrased as support, not cure.
const WHY: Record<string, Partial<Record<Goal, string>> & { default: string }> = {
  "nad-longevity-shots-10-bottle": { default: "NR + resveratrol to support NAD+ levels", longevity: "Supports NAD+, which declines with age", energy: "Supports cellular energy production", brain: "Supports mental clarity" },
  "liposomal-nmn-with-trans-resveratrol": { default: "Liposomal NMN for NAD+ support", longevity: "Liposomal NMN for better absorption of an NAD+ precursor" },
  "nmn-supplement-1000mg-anti-aging-cellular-energy-support-reverse-clinics-60": { default: "NMN, an NAD+ precursor", longevity: "NAD+ precursor for cellular repair pathways" },
  "resveratrol-with-fisetin": { default: "Resveratrol + fisetin, a senolytic pairing", longevity: "Senolytic pairing that targets ageing cells" },
  "quercetin-bromelain-immunity-allergy-relief-reverse-clinics-60": { default: "Antioxidant + anti-inflammatory support", immunity: "Antioxidant support for immune function", longevity: "Quercetin is studied for cellular ageing" },
  "collagen-skin-age-rewind": { default: "Plant collagen, hyaluronic acid, vitamin C", "skin-hair-nails": "Supports skin elasticity and hydration", longevity: "Supports skin as it ages" },
  "hair-skin-nail-multivitamin": { default: "Biotin, zinc and vitamins A, C, E", "skin-hair-nails": "Covers common nutrient gaps behind hair fall and brittle nails" },
  "collagen-joint-repair": { default: "Chondroitin 800mg, glucosamine, collagen", "joints-bones": "Supports cartilage and joint comfort", sport: "Supports joints under training load" },
  "collagen-bone-health-60-tablets-copy": { default: "Calcium, K2, D and plant collagen", "joints-bones": "Supports bone density and calcium use" },
  "moringa-with-curcumin": { default: "Moringa + curcumin", "joints-bones": "Curcumin supports joint comfort", immunity: "Antioxidant-rich daily greens" },
  "omega-3-fish-oil": { default: "EPA + DHA omega-3", heart: "Supports healthy cholesterol and heart function", brain: "DHA supports brain health", "joints-bones": "Supports joint mobility" },
  "magnesium-complex": { default: "Highly absorbable magnesium blend", "sleep-stress": "Supports relaxation and sleep quality", sport: "Helps with cramps and recovery", "joints-bones": "Needed for bone formation" },
  "micronised-creatine-monohydrate": { default: "Micronised creatine monohydrate", sport: "The most researched supplement for strength and power", brain: "Emerging research on cognitive energy", energy: "Supports ATP for short bursts of energy" },
  "sports-multivitamin": { default: "Vitamins and minerals for active people", sport: "Covers micronutrient needs of regular training", energy: "Fills gaps that drive fatigue" },
  "shilajit-gold": { default: "Himalayan shilajit with ashwagandha", energy: "Traditional support for energy and stamina", sport: "Supports endurance", weight: "Supports metabolism" },
  "pre-probiotic-gut-health": { default: "Prebiotics + multi-strain probiotics", gut: "Supports a balanced microbiome and digestion", immunity: "Most immune tissue sits in the gut", "skin-hair-nails": "Gut health supports nutrient absorption" },
  "ala-300mg-boost-energy-antioxidant-support-reverse-clinics-60": { default: "Alpha-lipoic acid 300mg", metabolic: "Supports healthy blood sugar", energy: "Supports mitochondrial energy" },
  "cinnamon-chromium-blood-sugar-balance-reverse-clinics-copy": { default: "Cinnamon + chromium", metabolic: "Supports insulin sensitivity", weight: "Helps with sugar cravings" },
  "egcg-green-tea-extract-capsules": { default: "Green tea EGCG", metabolic: "Antioxidant support for metabolism", weight: "Supports fat metabolism" },
  "policosanol-heart-health-cholesterol-support-reverse-clinics-60": { default: "Policosanol", heart: "Supports healthy cholesterol levels" },
};

// Conservative exclusions. Reason text is shown to the user.
const EXCLUDE: Record<Exclude<Flag, "none" | "pregnant">, { handles: string[]; reason: string }> = {
  "blood-thinners": {
    handles: ["omega-3-fish-oil", "resveratrol-with-fisetin", "liposomal-nmn-with-trans-resveratrol", "moringa-with-curcumin", "policosanol-heart-health-cholesterol-support-reverse-clinics-60", "quercetin-bromelain-immunity-allergy-relief-reverse-clinics-60", "nad-longevity-shots-10-bottle", "egcg-green-tea-extract-capsules"],
    reason: "may affect clotting alongside blood thinners",
  },
  "diabetes-meds": {
    handles: ["cinnamon-chromium-blood-sugar-balance-reverse-clinics-copy", "ala-300mg-boost-energy-antioxidant-support-reverse-clinics-60"],
    reason: "can lower blood sugar further alongside diabetes medication",
  },
  "bp-meds": {
    handles: ["shilajit-gold"],
    reason: "may interact with blood-pressure medication",
  },
};

const NOT_VEG = ["omega-3-fish-oil"];

// First-choice formula per goal (falls back to scoring if excluded, sold out or over budget).
// TODO: confirm with Dr. Bora; becomes admin-editable.
const HERO: Partial<Record<Goal, string[]>> = {
  "joints-bones": ["collagen-joint-repair", "collagen-bone-health-60-tablets-copy"],
  longevity: ["liposomal-nmn-with-trans-resveratrol", "nad-longevity-shots-10-bottle"],
  "sleep-stress": ["magnesium-complex"],
  gut: ["pre-probiotic-gut-health"],
  "skin-hair-nails": ["collagen-skin-age-rewind", "hair-skin-nail-multivitamin"],
  sport: ["micronised-creatine-monohydrate", "sports-multivitamin"],
  heart: ["omega-3-fish-oil", "policosanol-heart-health-cholesterol-support-reverse-clinics-60"],
  energy: ["shilajit-gold", "nad-longevity-shots-10-bottle"],
  metabolic: ["cinnamon-chromium-blood-sugar-balance-reverse-clinics-copy", "ala-300mg-boost-energy-antioxidant-support-reverse-clinics-60"],
  weight: ["cinnamon-chromium-blood-sugar-balance-reverse-clinics-copy", "egcg-green-tea-extract-capsules"],
  brain: ["omega-3-fish-oil", "micronised-creatine-monohydrate"],
  immunity: ["quercetin-bromelain-immunity-allergy-relief-reverse-clinics-60", "pre-probiotic-gut-health"],
};

export const GOAL_WEIGHT = [3, 2, 1];

export function recommend(products: StackProduct[], a: Answers): Result {
  if (a.flags.includes("pregnant")) {
    return { kind: "consult", message: "If you're pregnant or breastfeeding, please speak to your doctor before starting any supplement. Our clinic team can help you choose safely." };
  }

  const excluded = new Map<string, string>();
  for (const f of a.flags) {
    if (f === "none" || f === "pregnant") continue;
    for (const h of EXCLUDE[f].handles) excluded.set(h, EXCLUDE[f].reason);
  }
  if (a.diet === "veg" || a.diet === "vegan") for (const h of NOT_VEG) excluded.set(h, "not vegetarian");

  // implicit goals from lifestyle answers (lower weight than chosen goals)
  const implicit: Partial<Record<Goal, number>> = {};
  if (a.sleep === "poor") implicit["sleep-stress"] = 1.5;
  if (a.activity === "athlete") implicit.sport = 1.5;
  if (a.age === "45-59" || a.age === "60+") { implicit.longevity = 1; implicit["joints-bones"] = 1; }

  const goalScore = (g: Goal) => {
    const i = a.goals.indexOf(g);
    return (i >= 0 ? GOAL_WEIGHT[i] ?? 1 : 0) + (implicit[g] ?? 0);
  };

  const singles = products.filter((p) => p.kind === "single" && !excluded.has(p.handle));
  const scored = singles
    .map((p) => ({ p, s: p.goals.reduce((s, g) => s + goalScore(g), 0) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || x.p.price - y.p.price);

  // Greedy: cover each chosen goal first (in priority order), then fill by score, within budget, max 3.
  const picks: StackProduct[] = [];
  let total = 0;
  const fits = (p: StackProduct) => total + p.price <= a.budget;
  for (const g of a.goals) {
    if (picks.some((p) => p.goals.includes(g))) continue;
    // prefer a product whose primary purpose is this goal, then any that covers it
    const ok = (x: { p: StackProduct }) => !picks.includes(x.p) && fits(x.p);
    const hero = (HERO[g] ?? []).map((h) => scored.find((x) => x.p.handle === h)).find((x) => x && ok(x));
    const best = hero ?? scored.find((x) => x.p.goals[0] === g && ok(x)) ?? scored.find((x) => x.p.goals.includes(g) && ok(x));
    if (best && picks.length < 3) { picks.push(best.p); total += best.p.price; }
  }
  for (const x of scored) {
    if (picks.length >= 3) break;
    if (!picks.includes(x.p) && fits(x.p)) { picks.push(x.p); total += x.p.price; }
  }

  // nothing fits the budget: suggest the cheapest relevant formula rather than nothing
  if (!picks.length && scored.length) {
    const cheapest = [...scored].sort((x, y) => x.p.price - y.p.price)[0].p;
    picks.push(cheapest); total = cheapest.price;
  }

  const reasons = (p: StackProduct) => {
    const w = WHY[p.handle];
    const matched = [...a.goals, ...(Object.keys(implicit) as Goal[])].filter((g, i, arr) => arr.indexOf(g) === i && p.goals.includes(g));
    const lines = matched.map((g) => w?.[g]).filter((x): x is string => !!x);
    return lines.length ? lines.slice(0, 2) : [w?.default ?? "Matches your goals"];
  };

  // A pack that contains ≥2 of the picks and is cheaper than buying those separately.
  let pack: { product: StackProduct; saving: number } | undefined;
  for (const pk of products.filter((p) => p.kind === "pack" && p.includes?.length)) {
    if (pk.includes!.some((h) => excluded.has(h))) continue;
    const overlap = picks.filter((p) => pk.includes!.includes(p.handle));
    if (overlap.length < 2) continue;
    const sep = pk.includes!.map((h) => products.find((p) => p.handle === h)?.price ?? 0).reduce((s, n) => s + n, 0);
    const saving = sep - pk.price;
    if (saving > 0 && (!pack || saving > pack.saving)) pack = { product: pk, saving };
  }

  return {
    kind: "stack",
    picks: picks.map((p) => ({ product: p, reasons: reasons(p) })),
    total,
    pack,
    uncovered: a.goals.filter((g) => !picks.some((p) => p.goals.includes(g))),
    excluded: [...new Set([...excluded.entries()].filter(([h]) => products.some((p) => p.handle === h)).map(([h, r]) => `${products.find((p) => p.handle === h)!.title} (${r})`))],
  };
}
