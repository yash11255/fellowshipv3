import "server-only";
import { and, asc, eq, gte, isNotNull, lt, lte, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmail } from "./email";
import { totalOf } from "./fee-math";

export type SlotRow = typeof schema.programSlots.$inferSelect;

export const seatsLeft = (slot: Pick<SlotRow, "capacity" | "confirmedCount">) => Math.max(0, slot.capacity - slot.confirmedCount);

/** Slots an applicant can currently pick: open, and not already fully in the past. Soonest first. */
export async function getOpenSlots(programSlug: string): Promise<SlotRow[]> {
  await releaseExpiredHolds();
  const d = await db();
  return d.select().from(schema.programSlots)
    .where(and(eq(schema.programSlots.programSlug, programSlug), eq(schema.programSlots.status, "open"), gte(schema.programSlots.startDate, new Date(Date.now() - 86_400_000))))
    .orderBy(asc(schema.programSlots.startDate));
}

/** Every slot for a programme (any status, past or future) — for the admin slot designer. */
export async function getAllSlots(programSlug: string): Promise<SlotRow[]> {
  await releaseExpiredHolds();
  const d = await db();
  return d.select().from(schema.programSlots).where(eq(schema.programSlots.programSlug, programSlug)).orderBy(asc(schema.programSlots.startDate));
}

export async function getSlot(id: number): Promise<SlotRow | null> {
  const d = await db();
  const [s] = await d.select().from(schema.programSlots).where(eq(schema.programSlots.id, id)).limit(1);
  return s ?? null;
}

/**
 * Atomically takes one seat on a successful deposit payment. A single conditional UPDATE is the lock:
 * it only succeeds while confirmedCount < capacity, so two simultaneous payments can never both win the
 * last seat. Returns false if the slot was already full — the caller still has the applicant's money and
 * must flag it for staff to resolve by hand (reassign or refund), never silently drop the payment.
 */
export async function takeSeat(slotId: number): Promise<boolean> {
  const d = await db();
  const rows = await d.update(schema.programSlots)
    .set({ confirmedCount: sql`${schema.programSlots.confirmedCount} + 1`, updatedAt: new Date() })
    .where(and(eq(schema.programSlots.id, slotId), lt(schema.programSlots.confirmedCount, schema.programSlots.capacity)))
    .returning();
  return rows.length > 0;
}

/** Frees one seat (balance deadline missed, or staff manually releases a confirmed seat). */
export async function releaseSeat(slotId: number) {
  const d = await db();
  await d.update(schema.programSlots)
    .set({ confirmedCount: sql`greatest(${schema.programSlots.confirmedCount} - 1, 0)`, updatedAt: new Date() })
    .where(eq(schema.programSlots.id, slotId));
}

/**
 * Finds applications whose balance deadline has passed without full payment, auto-withdraws them and
 * frees their seat. There's no background job in this app, so this runs opportunistically wherever slot
 * availability or the admin applications list is read — cheap no-op when nothing is overdue.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const d = await db();
  const now = new Date();
  const overdue = await d.select().from(schema.applications).where(and(
    isNotNull(schema.applications.balanceDueAt),
    lte(schema.applications.balanceDueAt, now),
    notInArray(schema.applications.status, ["withdrawn", "rejected"]),
  ));
  let released = 0;
  for (const a of overdue) {
    const total = totalOf(a);
    if (a.amountPaid >= total) { // fully paid after all; just clear the stale deadline
      await d.update(schema.applications).set({ balanceDueAt: null }).where(eq(schema.applications.id, a.id));
      continue;
    }
    const won = await d.transaction(async (tx) => {
      // Claim the release first (conditional on the deadline still being set) so two concurrent sweeps
      // can't both free the same seat.
      const [w] = await tx.update(schema.applications).set({
        status: "withdrawn", balanceDueAt: null, updatedAt: new Date(),
        staffNote: `${a.staffNote ? a.staffNote + "\n" : ""}Seat auto-released on ${now.toLocaleDateString("en-IN")}: balance of ₹${(total - a.amountPaid).toLocaleString("en-IN")} wasn't paid by the deadline.`,
      }).where(and(eq(schema.applications.id, a.id), isNotNull(schema.applications.balanceDueAt))).returning();
      if (!w) return false;
      if (a.slotId) await tx.update(schema.programSlots).set({ confirmedCount: sql`greatest(${schema.programSlots.confirmedCount} - 1, 0)`, updatedAt: new Date() }).where(eq(schema.programSlots.id, a.slotId));
      return true;
    });
    if (!won) continue;
    released++;
    const first = a.name.split(" ")[0];
    await sendEmail({ to: a.email, subject: `Seat released: ${a.number}`, text: `Hi ${first},\n\nWe hadn't received your balance payment by the deadline, so your seat${a.cohort ? ` for ${a.cohort}` : ""} has been released to the next applicant.\n\nStill want to join? Reply to this email or call +91 96506 20870 and we'll check the next available batch.\n\nArthroscopy College` }).catch(() => {});
    await sendEmail({ to: process.env.TEAM_EMAIL ?? "orthosportin@gmail.com", subject: `Auto-released: ${a.number} (balance overdue)`, text: `${a.name} · ${a.email} · slot ${a.slotId ?? "-"} seat released automatically, balance was unpaid past the deadline.` }).catch(() => {});
  }
  return released;
}
