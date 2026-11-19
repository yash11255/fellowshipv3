"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { releaseApplicationSeat } from "@/lib/application-actions";
import { btnGhost } from "./ui";

export function ReleaseSeatButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <button disabled={pending} className={btnGhost} onClick={() => confirm("Release this confirmed seat back to the batch? Only do this if the candidate is withdrawing.") && start(async () => {
        const r = await releaseApplicationSeat(id);
        if (!r.ok) setErr(r.error); else { setErr(null); router.refresh(); }
      })}>{pending ? "Releasing…" : "Release seat"}</button>
      {err && <p className="mt-1 text-[12px] text-sale">{err}</p>}
    </div>
  );
}
