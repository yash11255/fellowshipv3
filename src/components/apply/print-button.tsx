"use client";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white">Print / Save PDF</button>;
}
