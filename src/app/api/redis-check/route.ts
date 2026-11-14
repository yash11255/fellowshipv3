import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

/**
 * Demo / health-check endpoint for the Redis (Upstash) integration.
 * GET /api/redis-check → increments a counter in Redis and returns it,
 * so you can confirm the Vercel Redis integration is wired up after deploy.
 * Safe to leave in place; returns ok:false (no error) if Redis isn't configured.
 */
export async function GET() {
  const r = redis();
  if (!r) {
    return NextResponse.json({ ok: false, configured: false, message: "Redis not configured (KV_REST_API_URL/TOKEN not set)." });
  }
  const visits = await r.incr("demo:visits");
  await r.set("demo:last-ping", new Date().toISOString());
  return NextResponse.json({ ok: true, configured: true, visits });
}
