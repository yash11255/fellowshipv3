"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStaffRole } from "@/lib/admin-actions";
import { btn, input } from "./ui";

type Role = "customer" | "support" | "content" | "manager" | "owner";
const ROLES: { id: Role; label: string; can: string }[] = [
  { id: "owner", label: "Owner", can: "Everything, incl. payments, taxes, staff" },
  { id: "manager", label: "Manager", can: "Products, prices, discounts, SEO, orders" },
  { id: "support", label: "Support", can: "View & fulfil orders, customers" },
  { id: "content", label: "Content", can: "View admin (content tools coming)" },
];

export function StaffManager({ staff, me }: { staff: { email: string; role: Role; createdAt: string }[]; me: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("support");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const run = (e: string, r: Role) => start(async () => { setErr(""); const x = await setStaffRole({ email: e, role: r }); if (!x.ok) setErr(x.error); else { setEmail(""); router.refresh(); } });

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); run(email, role); }} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e3e3e3] bg-white p-4">
        <label className="min-w-64 flex-1"><span className="text-[13px] font-medium">Invite by email</span><input type="email" required className={`${input} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@reverseclinics.com" /></label>
        <label><span className="text-[13px] font-medium">Role</span>
          <select className={`${input} mt-1`} value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
        </label>
        <button className={btn} disabled={pending}>Add staff</button>
        <p className="w-full text-[12px] text-grey">They sign in at /login with that email (one-time code) and get access immediately.</p>
        {err && <p role="alert" className="w-full text-[13px] text-sale">{err}</p>}
      </form>
      <div className="rounded-xl border border-[#e3e3e3] bg-white">
        <table className="w-full text-[13px]">
          <thead className="text-left text-[12px] text-grey"><tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Staff</th><th className="px-4 py-2 font-medium">Role</th><th className="px-4 py-2" /></tr></thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {staff.map((s) => (
              <tr key={s.email}>
                <td className="px-4 py-2.5">{s.email}{s.email === me && <span className="ml-2 text-grey">(you)</span>}</td>
                <td className="px-4 py-2.5">
                  <select aria-label={`Role for ${s.email}`} className={`${input} w-40`} value={s.role} disabled={pending || s.email === me} onChange={(e) => run(s.email, e.target.value as Role)}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-right">{s.email !== me && <button className="text-[12px] text-sale hover:underline" disabled={pending} onClick={() => confirm(`Remove ${s.email} from staff?`) && run(s.email, "customer")}>Remove access</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-[#e3e3e3] bg-white p-4 text-[13px]">
        <p className="font-semibold">Roles</p>
        <ul className="mt-2 space-y-1">{ROLES.map((r) => <li key={r.id}><span className="font-medium">{r.label}:</span> <span className="text-grey">{r.can}</span></li>)}</ul>
      </div>
    </div>
  );
}
