import { loginAction } from "./actions";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams?.next ?? "/";

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Admin Login</h1>

        <form className="mt-6 space-y-3" action={loginAction}>
          <input type="hidden" name="next" value={next} />

          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="admin@domain.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full rounded-md bg-black px-3 py-2 text-white cursor-pointer">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}