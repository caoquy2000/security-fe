import { decodeJwtPayload, getAccessToken } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default async function AdminHomePage() {
  const token = await getAccessToken();
  // middleware/layout đã chặn rồi, nhưng vẫn check cho chắc
  if (!token) return null;

  const payload = decodeJwtPayload(token);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Admin Home</h1>

      <div className="mt-4 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">You are logged in.</p>

        {payload?.email && <p className="mt-2 text-sm">Email: {payload.email}</p>}
        {payload?.sub && <p className="mt-1 text-sm">User ID: {payload.sub}</p>}

        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}