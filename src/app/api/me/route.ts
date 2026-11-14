import { currentUser } from "@/lib/auth";

/** Who is signed in (for the header account button). Never cached. */
export async function GET() {
  const u = await currentUser();
  return Response.json(u ? { email: u.email, name: u.name, staff: u.role !== "customer" } : null, { headers: { "Cache-Control": "private, no-store" } });
}
