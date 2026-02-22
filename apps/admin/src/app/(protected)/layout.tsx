import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import LeftSidebar from "./_components/left-sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAccessToken();
  if (!token) redirect("/login");

  return (
    <div className="min-h-screen bg-white text-black">
      <LeftSidebar />

      {/* Nội dung bên phải: chừa khoảng trống bên trái đúng bằng width sidebar */}
      <main className="min-h-screen pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}