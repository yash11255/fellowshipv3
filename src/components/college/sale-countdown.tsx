"use client";

import { useEffect, useState } from "react";

function left(endsAt: string) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (ms === 0) return "ending";
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

/** Small ticking countdown for a sale banner. Renders a static value on the server, then updates client-side every minute. */
export function SaleCountdown({ endsAt }: { endsAt: string }) {
  const [text, setText] = useState(() => left(endsAt));
  useEffect(() => {
    const id = setInterval(() => setText(left(endsAt)), 60_000);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span className="ml-1 font-normal text-ink/70">· {text}</span>;
}
