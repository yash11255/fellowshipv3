import "server-only";
import { Redis } from "@upstash/redis";

/**
 * Lazy Redis client for Vercel's Redis (Upstash) marketplace integration.
 *
 * The integration sets either:
 *  - KV_REST_API_URL / KV_REST_API_TOKEN      (Vercel KV naming), or
 *  - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash naming)
 *
 * Unset in local dev → redis() returns null and callers should fall back
 * to their normal (Postgres / in-memory) behaviour. This mirrors the
 * DATABASE_URL-optional pattern in src/db/index.ts.
 */
function create(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  // Also guards against an unresolved placeholder value (e.g. "[SENSITIVE]")
  // showing up in a pulled .env file instead of the real secret.
  if (!url || !token || !/^https?:\/\//.test(url)) return null;
  return new Redis({ url, token });
}

const g = globalThis as unknown as { __redis?: Redis | null; __redisInit?: boolean };

export function redis(): Redis | null {
  if (!g.__redisInit) {
    g.__redis = create();
    g.__redisInit = true;
  }
  return g.__redis ?? null;
}

export const redisConfigured = () => redis() !== null;
