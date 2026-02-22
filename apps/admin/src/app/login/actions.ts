"use server";

import { redirect } from "next/navigation";
import { loginWithBackend } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  await loginWithBackend(email, password);

  redirect(next.startsWith("/") ? next : "/");
}