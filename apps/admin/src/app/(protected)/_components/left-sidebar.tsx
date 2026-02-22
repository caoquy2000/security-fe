"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../logout-button";

const NAV_ITEMS = [
  { href: "/", label: "Trang Chủ" },
  { href: "/gioi-thieu", label: "Giới Thiệu" },
  { href: "/dich-vu", label: "Dịch Vụ" },
  { href: "/tin-tuc", label: "Tin Tức" },
  { href: "/thanh-vien", label: "Thành Viên" },
  { href: "/chat", label: "Chat" },
];

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-black/10 bg-white">
      <div className="flex h-full flex-col p-4">
        <div className="mb-4">
          <div className="text-sm font-semibold tracking-wide">ADMIN</div>
          <div className="text-xs text-black/60">Security CMS</div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-md px-3 py-2 text-sm transition",
                  "hover:bg-black hover:text-white",
                  active ? "bg-black text-white" : "text-black",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-black/10">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}