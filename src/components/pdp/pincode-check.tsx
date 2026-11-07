"use client";

import { useEffect, useState, useTransition } from "react";
import { checkPincode } from "@/lib/pincode";

type R = Awaited<ReturnType<typeof checkPincode>>;

export function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [res, setRes] = useState<R | null>(null);
  const [pending, start] = useTransition();
  const run = (p = pin) => start(async () => { const r = await checkPincode(p); setRes(r); if (r.ok) try { localStorage.setItem("rc-pin", p); } catch {} });

  useEffect(() => {
    // restore the last pincode once on mount (client-only storage)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { const saved = localStorage.getItem("rc-pin"); if (saved) { setPin(saved); run(saved); } } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="text-[13px] font-semibold">Check delivery</p>
      <form className="mt-2 flex" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <label htmlFor="pin" className="sr-only">Pincode</label>
        <input id="pin" inputMode="numeric" maxLength={6} placeholder="Enter pincode" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="h-11 flex-1 border border-line px-3 text-[14px] outline-none focus:border-black" />
        <button disabled={pin.length !== 6 || pending} className="h-11 border border-l-0 border-black px-5 text-[12px] font-semibold uppercase tracking-[0.06em] disabled:opacity-40">{pending ? "…" : "Check"}</button>
      </form>
      {res && (
        <div aria-live="polite" className="mt-2 text-[13px]">
          {!res.ok ? <p className="text-sale">{res.error}</p> : res.serviceable ? (
            <ul className="space-y-0.5">
              <li>Delivery by <span className="font-semibold">{res.eta}</span>{res.city ? ` to ${res.city}` : ""}{res.source === "estimate" ? " (estimated)" : ""}</li>
              <li className={res.cod ? "text-ok" : "text-grey"}>{res.cod ? "✓ Cash on Delivery available" : "Prepaid only for this pincode"}</li>
            </ul>
          ) : <p className="text-sale">Sorry, we don&apos;t deliver to {pin} yet.</p>}
        </div>
      )}
    </div>
  );
}
