"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Email is required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
        credentials: "same-origin",
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = { error: res.ok ? undefined : "Verification failed." };
      }

      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendCooldown(60);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to resend.");
      }
    } catch {
      setError("Failed to resend.");
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-stone-50">
        <p className="text-stone-600">Invalid verification link.</p>
        <Link href="/sign-up" className="text-vt-maroon mt-4">Try again</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-stone-50">
      <div className="w-full max-w-md">
        <Link href="/" className="text-vt-maroon font-bold text-lg block mb-8">
          ← VT Eating
        </Link>
        <h1 className="text-2xl font-bold text-vt-maroon mb-2">Verify your email</h1>
        <p className="text-stone-600 mb-6">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-stone-700 mb-1">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-vt-maroon focus:border-transparent text-center text-lg tracking-widest"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vt-maroon hover:bg-vt-burgundy text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <p className="mt-6 text-center text-stone-600 text-sm">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-vt-maroon font-medium hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
