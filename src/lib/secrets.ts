import "server-only";
import crypto from "node:crypto";
import { secret } from "./auth";

// AES-256-GCM for integration credentials stored in the DB (keys entered in admin).
const key = () => crypto.createHash("sha256").update(`integrations:${secret()}`).digest();

export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

export function decrypt(blob: string) {
  const [v, iv, tag, data] = blob.split(".");
  if (v !== "v1") throw new Error("bad secret format");
  const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
}

export const mask = (s?: string | null) => (s ? `••••${s.slice(-4)}` : "");
