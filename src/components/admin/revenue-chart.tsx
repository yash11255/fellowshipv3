"use client";

import { useState } from "react";

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/**
 * Single-series daily revenue. One ink colour (no legend: the card title names it),
 * thin bars with 4px rounded tops anchored to the baseline, 2px gaps, recessive grid,
 * per-bar hover tooltip with a hit target larger than the mark, and a table fallback for screen readers.
 */
export function RevenueChart({ days }: { days: { label: string; value: number; orders: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.value));
  const nice = Math.ceil(max / 1000) * 1000 || 1000;
  const W = 640, H = 190, padT = 10, padL = 44, padB = 22, gap = 2;
  const plotH = H - padB - padT;
  const bw = (W - padL) / days.length;

  return (
    <div className="relative px-4 pb-3 pt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily revenue, last 14 days">
        {[0, 0.5, 1].map((f) => {
          const y = padT + plotH * (1 - f);
          return (
            <g key={f}>
              <line x1={padL} x2={W} y1={y} y2={y} stroke="#ececec" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-[#8a8a8a] text-[10px]">{f === 0 ? "0" : `₹${((nice * f) / 1000).toFixed(nice * f < 10000 ? 1 : 0)}k`}</text>
            </g>
          );
        })}
        {days.map((d, i) => {
          const h = (d.value / nice) * plotH;
          const x = padL + i * bw + gap / 2;
          const w = bw - gap;
          const r = Math.min(4, w / 2, h);
          const y = H - padB - h;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * bw} y={0} width={bw} height={H - padB} fill="transparent" />
              {h > 0 && (
                <path d={`M${x},${H - padB} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${H - padB} Z`}
                  fill={hover === null || hover === i ? "#303030" : "#bdbdbd"} />
              )}
              {(i % 2 === 0 || days.length <= 7) && <text x={x + w / 2} y={H - 6} textAnchor="middle" className="fill-[#8a8a8a] text-[10px]">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 rounded-lg border border-[#e3e3e3] bg-white px-3 py-2 text-[12px] shadow-sm"
          style={{ left: `calc(${((padL + (hover + 0.5) * bw) / W) * 100}% - 60px)` }}>
          <p className="font-semibold">{days[hover].label}</p>
          <p>{inr(days[hover].value)} · {days[hover].orders} {days[hover].orders === 1 ? "order" : "orders"}</p>
        </div>
      )}
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <tbody>{days.map((d) => <tr key={d.label}><th>{d.label}</th><td>{inr(d.value)}</td><td>{d.orders} orders</td></tr>)}</tbody>
      </table>
    </div>
  );
}
