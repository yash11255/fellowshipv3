"use client";

import { useTransition } from "react";
import { setEnquiryHandled } from "@/lib/admin-actions";
import { btn, btnGhost } from "./ui";

export function HandledToggle({ id, handled }: { id: number; handled: boolean }) {
  const [pending, start] = useTransition();
  return <button disabled={pending} className={handled ? btnGhost : btn} onClick={() => start(async () => { await setEnquiryHandled(id, !handled); })}>{handled ? "Reopen" : "Mark handled"}</button>;
}
