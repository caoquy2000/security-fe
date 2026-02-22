import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAccessToken();
  if (!token) redirect("/login");
  return <div className="min-h-screen">{children}</div>;
}