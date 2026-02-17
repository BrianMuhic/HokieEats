"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fulfill orders error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-bold text-vt-maroon mb-2">Something went wrong</h1>
      <p className="text-stone-600 text-sm mb-6 max-w-md text-center">
        {error.message}
      </p>
      <p className="text-stone-500 text-xs mb-6 max-w-md text-center">
        If you just added new features, run: <code className="bg-stone-200 px-1 rounded">npx prisma db push</code>
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-vt-maroon text-white px-4 py-2 rounded-lg font-medium"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="border border-stone-300 text-stone-600 px-4 py-2 rounded-lg font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
