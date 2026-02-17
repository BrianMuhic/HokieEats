"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith("@vt.edu")) {
      setError("You must use a @vt.edu email address.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
        credentials: "same-origin",
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: res.ok ? undefined : "Invalid response from server." };
      }

      if (!res.ok) {
        setError(data.error ?? "Sign up failed.");
        setLoading(false);
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-stone-50">
      <div className="w-full max-w-md">
        <Link href="/" className="text-vt-maroon font-bold text-lg block mb-8">
          ← VT Eating
        </Link>
        <h1 className="text-2xl font-bold text-vt-maroon mb-2">Create account</h1>
        <p className="text-stone-600 mb-6">
          Use your @vt.edu email to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vt.edu"
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-vt-maroon focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-vt-maroon focus:border-transparent"
              required
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vt-maroon hover:bg-vt-burgundy text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-stone-600 text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-vt-maroon font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
