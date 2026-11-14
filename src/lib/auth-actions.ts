"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { passwordLogin, requestOtp, setOwnPassword, signOut, verifyOtp, type OtpPurpose } from "./auth";

const Email = z.string().trim().email();

export async function sendCode(email: string, purpose: OtpPurpose = "signin") {
  if (!Email.safeParse(email).success) return { ok: false as const, error: "Enter a valid email address." };
  return requestOtp(email, purpose);
}

export async function checkCode(email: string, code: string) {
  if (!/^\d{6}$/.test(code.trim())) return { ok: false as const, error: "Enter the 6-digit code." };
  return verifyOtp(email, code);
}

export async function signInWithPassword(email: string, password: string) {
  if (!Email.safeParse(email).success) return { ok: false as const, error: "Enter a valid email address." };
  if (!password) return { ok: false as const, error: "Enter your password." };
  return passwordLogin(email, password);
}

export async function savePassword(password: string) {
  return setOwnPassword(password);
}

export async function logout() {
  await signOut();
  redirect("/");
}
