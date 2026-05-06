"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "register" ? { name, email, password } : { email, password },
        ),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700">TaskBoard</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {isRegister ? "Create your account" : "Log in to your workspace"}
          </h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {isRegister && (
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-600"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            className="w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Working..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            className="font-semibold text-blue-700"
            href={isRegister ? "/login" : "/register"}
          >
            {isRegister ? "Login" : "Register"}
          </Link>
        </p>
      </section>
    </main>
  );
}
