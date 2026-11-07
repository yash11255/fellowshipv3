import "server-only";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "./auth";

const RANK = { customer: 0, support: 1, content: 1, manager: 2, owner: 3 } as const;
export type Role = keyof typeof RANK;

/** Gate for admin pages and actions. Non-staff get a 404 so /admin isn't advertised. */
export async function requireStaff(min: Role = "support") {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (RANK[user.role] < RANK[min]) notFound();
  return user;
}
