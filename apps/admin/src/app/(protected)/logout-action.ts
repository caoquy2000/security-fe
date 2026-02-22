"use server";

import { redirect } from "next/navigation";
import { clearAccessToken } from "@/lib/auth";

export async function logoutAction() {
  await clearAccessToken();
  redirect("/login");
}