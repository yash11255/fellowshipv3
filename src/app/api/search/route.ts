import { getProducts, GOAL_LABELS } from "@/lib/catalog";
import { norm, type SearchItem } from "@/lib/search";

// Lightweight product index for instant search + the chat assistant.
export async function GET() {
  const ps = (await getProducts()).filter((p) => p.kind !== "gift");
  const items: SearchItem[] = ps.map((p) => ({
    handle: p.handle, title: p.title, image: p.images[0], price: p.variants[0]?.price ?? 0, compareAt: p.variants[0]?.compareAt ?? 0, kind: p.kind,
    goals: (p.goals ?? []).map((g) => GOAL_LABELS[g]), actives: (p.keyActives ?? []).map((a) => a.name), available: p.available,
    text: norm(`${p.description} ${(p.goals ?? []).join(" ")}`).slice(0, 600),
  }));
  return Response.json(items, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
