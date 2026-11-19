"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireStaff } from "./admin";

const SlotInput = z.object({
  programSlug: z.string().trim().min(1).max(80),
  label: z.string().trim().min(2, "Give the batch a name").max(120),
  startDate: z.string().min(1, "Set a start date"),
  endDate: z.string().optional(),
  capacity: z.coerce.number().int().min(1, "At least 1 seat").max(500),
  balanceDueDays: z.coerce.number().int().min(0).max(120).default(14),
});

/** Admin times are entered in India time. `<input type=datetime-local>` sends no offset, and the server
 * runs in UTC, so pin offset-less values to IST instead of letting them shift by 5½ hours. */
const IST = "+05:30";
function parseIst(v: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(v);
  const withTime = /T\d{2}:\d{2}/.test(v) ? v : `${v}T00:00`;
  return new Date(hasZone ? v : `${withTime}${IST}`);
}

function revalidate(programSlug: string) {
  revalidatePath(`/admin/programs/edit?slug=${encodeURIComponent(programSlug)}`);
  revalidatePath(`/programs/${programSlug}`);
  revalidatePath("/apply");
}

export async function createSlot(raw: z.input<typeof SlotInput>) {
  await requireStaff("manager");
  const p = SlotInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const start = parseIst(p.data.startDate);
  if (Number.isNaN(start.getTime())) return { ok: false as const, error: "Invalid start date." };
  const end = p.data.endDate ? parseIst(p.data.endDate) : null;
  const d = await db();
  const [row] = await d.insert(schema.programSlots).values({
    programSlug: p.data.programSlug, label: p.data.label, startDate: start, endDate: end && !Number.isNaN(end.getTime()) ? end : null,
    capacity: p.data.capacity, balanceDueDays: p.data.balanceDueDays,
  }).returning();
  revalidate(p.data.programSlug);
  return { ok: true as const, slot: row };
}

const UpdateSlot = SlotInput.partial().extend({ id: z.number().int(), programSlug: z.string().trim().min(1).max(80) });

export async function updateSlot(raw: z.input<typeof UpdateSlot>) {
  await requireStaff("manager");
  const p = UpdateSlot.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const d = await db();
  const patch: Partial<typeof schema.programSlots.$inferInsert> = { updatedAt: new Date() };
  if (p.data.label !== undefined) patch.label = p.data.label;
  if (p.data.capacity !== undefined) patch.capacity = p.data.capacity;
  if (p.data.balanceDueDays !== undefined) patch.balanceDueDays = p.data.balanceDueDays;
  if (p.data.startDate !== undefined) { const s = parseIst(p.data.startDate); if (!Number.isNaN(s.getTime())) patch.startDate = s; }
  if (p.data.endDate !== undefined) { const e = p.data.endDate ? parseIst(p.data.endDate) : null; patch.endDate = e && !Number.isNaN(e.getTime()) ? e : null; }
  const [cur] = await d.select().from(schema.programSlots).where(eq(schema.programSlots.id, p.data.id)).limit(1);
  if (!cur) return { ok: false as const, error: "Not found" };
  if (patch.capacity !== undefined && patch.capacity < cur.confirmedCount) return { ok: false as const, error: `Can't set capacity below the ${cur.confirmedCount} seat(s) already confirmed.` };
  const [row] = await d.update(schema.programSlots).set(patch).where(eq(schema.programSlots.id, p.data.id)).returning();
  if (!row) return { ok: false as const, error: "Not found" };
  revalidate(p.data.programSlug);
  return { ok: true as const, slot: row };
}

export async function setSlotStatus(id: number, programSlug: string, status: "open" | "closed" | "cancelled") {
  await requireStaff("manager");
  const d = await db();
  const [row] = await d.update(schema.programSlots).set({ status, updatedAt: new Date() }).where(eq(schema.programSlots.id, id)).returning();
  if (!row) return { ok: false as const, error: "Not found" };
  revalidate(programSlug);
  return { ok: true as const };
}

export async function deleteSlot(id: number, programSlug: string) {
  await requireStaff("manager");
  const d = await db();
  const [s] = await d.select().from(schema.programSlots).where(eq(schema.programSlots.id, id)).limit(1);
  if (!s) return { ok: false as const, error: "Not found" };
  if (s.confirmedCount > 0) return { ok: false as const, error: "Seats are already confirmed in this batch — close it instead of deleting." };
  await d.delete(schema.programSlots).where(eq(schema.programSlots.id, id));
  revalidate(programSlug);
  return { ok: true as const };
}

// ── Bulk "slot designer": generate N monthly batches in one go ──
const BulkInput = z.object({
  programSlug: z.string().trim().min(1).max(80),
  labelTemplate: z.string().trim().min(1).max(80).default("{month} {year} batch"), // {month} / {year} placeholders
  startMonth: z.string().min(1, "Pick a starting month"), // "2026-12" (<input type=month>)
  count: z.coerce.number().int().min(1).max(24),
  dayOfMonth: z.coerce.number().int().min(1).max(28).default(1),
  durationDays: z.coerce.number().int().min(0).max(90).default(0), // 0 = single-day / no fixed end
  capacity: z.coerce.number().int().min(1).max(500),
  balanceDueDays: z.coerce.number().int().min(0).max(120).default(14),
});

export async function generateMonthlySlots(raw: z.input<typeof BulkInput>) {
  await requireStaff("manager");
  const p = BulkInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const [y0, m0] = p.data.startMonth.split("-").map(Number);
  if (!y0 || !m0) return { ok: false as const, error: "Invalid start month." };
  const d = await db();
  let made = 0;
  for (let i = 0; i < p.data.count; i++) {
    const ym = new Date(Date.UTC(y0, m0 - 1 + i, 1));
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = parseIst(`${ym.getUTCFullYear()}-${pad(ym.getUTCMonth() + 1)}-${pad(p.data.dayOfMonth)}T09:00`); // 9 AM IST
    const label = p.data.labelTemplate
      .replace("{month}", start.toLocaleDateString("en-IN", { month: "long", timeZone: "Asia/Kolkata" }))
      .replace("{year}", String(ym.getUTCFullYear()));
    const end = p.data.durationDays > 0 ? new Date(start.getTime() + p.data.durationDays * 86_400_000) : null;
    await d.insert(schema.programSlots).values({ programSlug: p.data.programSlug, label, startDate: start, endDate: end, capacity: p.data.capacity, balanceDueDays: p.data.balanceDueDays });
    made++;
  }
  revalidate(p.data.programSlug);
  return { ok: true as const, count: made };
}
