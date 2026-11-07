"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requestOtp, signOut, verifyOtp } from "./auth";

const Email = z.string().trim().email();

export async function sendCode(email: string) {
  if (!Email.safeParse(email).success) return { ok: false as const, error: "Enter a valid email address." };
  return requestOtp(email);
}

export async function checkCode(email: string, code: string) {
  if (!/^\d{6}$/.test(code.trim())) return { ok: false as const, error: "Enter the 6-digit code." };
  return verifyOtp(email, code);
}

export async function logout() {
  await signOut();
  redirect("/");
}
