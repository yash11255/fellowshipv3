"use client";
import { useTransition } from "react";
import { moderateReview } from "@/lib/review-actions";
import { btn, btnGhost } from "./ui";

export function ReviewActions({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      {status !== "approved" && <button disabled={pending} className={btn} onClick={() => start(async () => { await moderateReview(id, "approved"); })}>Approve</button>}
      {status !== "rejected" && <button disabled={pending} className={btnGhost} onClick={() => start(async () => { await moderateReview(id, "rejected"); })}>Reject</button>}
      <button disabled={pending} className="px-2 text-[12px] text-sale hover:underline" onClick={() => confirm("Delete this review?") && start(async () => { await moderateReview(id, "delete"); })}>Delete</button>
    </div>
  );
}
