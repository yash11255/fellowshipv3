"use client";
export function PrintButton() {
  return <button onClick={() => window.print()} className="h-9 rounded-lg bg-black px-4 text-[13px] font-medium text-white">Print / Save PDF</button>;
}
