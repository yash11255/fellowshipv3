import seed from "../prisma/seed-data/products.json";
import { recommend } from "../src/lib/stack-engine";
const P = (seed.products as any[]).filter(p => p.available && p.kind !== "gift").map(p => ({ handle: p.handle, title: p.title, kind: p.kind, goals: p.goals ?? [], price: p.variants[0].price, compareAt: p.variants[0].compareAt, includes: p.includes }));
const base = { age: "30-44", activity: "moderate", sleep: "ok", diet: "nonveg", flags: ["none"], budget: 3000 } as any;
const cases: [string, any][] = [
  ["joints+heart, nonveg", { ...base, goals: ["joints-bones", "heart"] }],
  ["joints+heart, VEG", { ...base, goals: ["joints-bones", "heart"], diet: "veg" }],
  ["joints, BLOOD THINNERS", { ...base, goals: ["joints-bones", "heart"], flags: ["blood-thinners"] }],
  ["energy+metabolic, DIABETES", { ...base, goals: ["energy", "metabolic"], flags: ["diabetes-meds"] }],
  ["longevity+skin, 60+, poor sleep, ₹6000", { ...base, age: "60+", sleep: "poor", goals: ["longevity", "skin-hair-nails"], budget: 6000 }],
  ["sport athlete, ₹1000", { ...base, activity: "athlete", goals: ["sport"], budget: 1000 }],
  ["pregnant", { ...base, goals: ["energy"], flags: ["pregnant"] }],
];
for (const [name, a] of cases) {
  const r = recommend(P as any, a);
  if (r.kind === "consult") { console.log(`\n# ${name}\n  → CONSULT`); continue; }
  console.log(`\n# ${name}  total ₹${r.total}`);
  r.picks.forEach(p => console.log(`  - ${p.product.title}: ${p.reasons.join(" | ")}`));
  if (r.pack) console.log(`  pack: ${r.pack.product.title} saves ₹${r.pack.saving}`);
  if (r.excluded.length) console.log(`  excluded: ${r.excluded.length}`);
}
