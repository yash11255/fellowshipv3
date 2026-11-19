"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";

export type BatchOpt = { id: number; label: string; startDate: string; endDate: string | null; seatsLeft: number; capacity: number };

const TZ = "Asia/Kolkata";
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** yyyy-mm-dd of an instant, in India time (batches are scheduled in IST). */
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const monthKey = (d: Date) => dayKey(d).slice(0, 7);
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-IN", { timeZone: TZ, ...o });

/** Seat badge copy + tone. Counts are the real remaining seats for the batch. */
export function seatBadge(b: Pick<BatchOpt, "seatsLeft">) {
  if (b.seatsLeft === 0) return { text: "Full", tone: "full" as const };
  if (b.seatsLeft <= 3) return { text: `Only ${b.seatsLeft} seat${b.seatsLeft === 1 ? "" : "s"} left`, tone: "hot" as const };
  return { text: `${b.seatsLeft} seats left`, tone: "ok" as const };
}

export function BatchCalendar({ batches, selected, onSelect }: { batches: BatchOpt[]; selected: number | null; onSelect: (id: number) => void }) {
  const months = useMemo(() => [...new Set(batches.map((b) => monthKey(new Date(b.startDate))))].sort(), [batches]);
  const firstOpen = batches.find((b) => b.seatsLeft > 0) ?? batches[0];
  const [month, setMonth] = useState(() => (firstOpen ? monthKey(new Date(firstOpen.startDate)) : months[0]));
  const [dir, setDir] = useState(1);
  const mi = months.indexOf(month);

  // day → batches starting that day, and day → batches running (start..end) that day
  const { starts, running } = useMemo(() => {
    const starts = new Map<string, BatchOpt[]>(), running = new Map<string, BatchOpt[]>();
    for (const b of batches) {
      const s = new Date(b.startDate), e = b.endDate ? new Date(b.endDate) : s;
      starts.set(dayKey(s), [...(starts.get(dayKey(s)) ?? []), b]);
      for (let t = s.getTime(); t <= e.getTime() + 1; t += 86_400_000) {
        const k = dayKey(new Date(t));
        running.set(k, [...(running.get(k) ?? []), b]);
      }
    }
    return { starts, running };
  }, [batches]);

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7; // Monday-first grid
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  }, [month]);

  const inMonth = batches.filter((b) => monthKey(new Date(b.startDate)) === month);
  const today = dayKey(new Date());
  const sel = batches.find((b) => b.id === selected);
  const go = (d: number) => { const n = months[mi + d]; if (n) { setDir(d); setMonth(n); } };
  const monthTitle = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="mt-3 overflow-hidden rounded-[24px] border border-ink/12 bg-white">
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        {/* Calendar */}
        <div className="border-b border-ink/10 p-4 sm:p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => go(-1)} disabled={mi <= 0} aria-label="Previous month with batches" className="grid size-9 place-items-center rounded-full border border-ink/15 text-[18px] transition-colors hover:border-ink disabled:opacity-30">‹</button>
            <p className="text-[15px] font-semibold" aria-live="polite">{monthTitle}</p>
            <button type="button" onClick={() => go(1)} disabled={mi >= months.length - 1} aria-label="Next month with batches" className="grid size-9 place-items-center rounded-full border border-ink/15 text-[18px] transition-colors hover:border-ink disabled:opacity-30">›</button>
          </div>
          <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-ink/40">{WEEK.map((w) => <span key={w}>{w}</span>)}</div>
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div key={month} custom={dir} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.18 }} className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((k, i) => {
                if (!k) return <span key={`e${i}`} />;
                const st = starts.get(k) ?? [];
                const run = running.get(k) ?? [];
                const open = st.find((b) => b.seatsLeft > 0);
                const isSel = !!sel && run.some((b) => b.id === sel.id);
                const isStartSel = !!sel && st.some((b) => b.id === sel.id);
                const hot = st.some((b) => b.seatsLeft > 0 && b.seatsLeft <= 3);
                return (
                  <button key={k} type="button" disabled={!st.length || !open}
                    onClick={() => open && onSelect(open.id)}
                    aria-label={st.length ? `${fmt(`${k}T12:00:00Z`, { day: "numeric", month: "long" })}: ${st.map((b) => `${b.label}, ${seatBadge(b).text}`).join("; ")}` : undefined}
                    className={clsx("relative grid aspect-square place-items-center rounded-xl text-[13px] transition-colors",
                      isStartSel ? "bg-ink font-semibold text-white" : isSel ? "bg-ink/10 font-medium" : run.length ? "bg-teal/15" : "",
                      st.length && open && !isStartSel && "cursor-pointer font-semibold ring-1 ring-ink/25 hover:bg-ink hover:text-white",
                      st.length && !open && "text-ink/35 line-through",
                      !st.length && "cursor-default text-ink/60",
                      k === today && !isStartSel && "underline decoration-2 underline-offset-4")}>
                    {Number(k.slice(8))}
                    {st.length > 0 && <span className={clsx("absolute bottom-1 size-1.5 rounded-full", !open ? "bg-ink/25" : hot ? "animate-pulse bg-[#e8590c]" : "bg-[#0c7a43]")} />}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink/55">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#0c7a43]" />Seats available</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#e8590c]" />Filling fast</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ink/25" />Full</span>
          </div>
        </div>

        {/* Batches in this month */}
        <div className="p-4 sm:p-5">
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-ink/45">{inMonth.length} batch{inMonth.length === 1 ? "" : "es"} in {monthTitle.split(" ")[0]}</p>
          <ul className="mt-3 space-y-2">
            {inMonth.map((b) => {
              const badge = seatBadge(b);
              const full = badge.tone === "full";
              const filled = Math.round(((b.capacity - b.seatsLeft) / Math.max(1, b.capacity)) * 100);
              return (
                <li key={b.id}>
                  <label className={clsx("block rounded-2xl border p-3.5 transition-colors", full ? "cursor-not-allowed border-ink/10 opacity-60" : selected === b.id ? "border-ink bg-mist" : "cursor-pointer border-ink/15 hover:border-ink/40")}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex items-start gap-3">
                        <input type="radio" name="slot" value={b.id} disabled={full} checked={selected === b.id} onChange={() => onSelect(b.id)} className="mt-1 size-4 accent-[#0f1526]" />
                        <span>
                          <span className="block text-[14px] font-semibold">{b.label}</span>
                          <span className="text-[13px] text-ink/55">{fmt(b.startDate, { day: "numeric", month: "short" })}{b.endDate ? ` – ${fmt(b.endDate, { day: "numeric", month: "short", year: "numeric" })}` : `, ${fmt(b.startDate, { year: "numeric" })}`}</span>
                        </span>
                      </span>
                      <span className={clsx("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                        full ? "bg-ink/10 text-ink/50" : badge.tone === "hot" ? "bg-[#ffe3cf] text-[#8a3b00]" : "bg-teal/20 text-ink")}>
                        {badge.tone === "hot" && <span className="size-1.5 animate-pulse rounded-full bg-[#e8590c]" />}{badge.text}
                      </span>
                    </span>
                    <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-ink/8" aria-hidden>
                      <span className={clsx("block h-full rounded-full", full ? "bg-ink/30" : badge.tone === "hot" ? "bg-[#e8590c]" : "bg-[#0c7a43]")} style={{ width: `${Math.max(filled, 6)}%` }} />
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {sel && <p className="mt-4 rounded-2xl bg-navy p-3 text-[13px] text-white">Selected: <strong>{sel.label}</strong>. {seatBadge(sel).tone === "hot" ? "Few seats remain; " : ""}your seat is confirmed once the deposit is paid.</p>}
        </div>
      </div>
    </div>
  );
}
