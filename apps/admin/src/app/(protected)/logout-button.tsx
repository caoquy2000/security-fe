"use client";

import { useTransition } from "react";
import { logoutAction } from "./logout-action";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {pending ? "Logging out..." : "Logout"}
    </button>
  );
}