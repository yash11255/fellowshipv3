import { buildSearchIndex } from "@/lib/search-index";

// Site index for instant search + the chat assistant.
export async function GET() {
  return Response.json(await buildSearchIndex(), { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
