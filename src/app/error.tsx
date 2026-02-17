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
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-bold text-vt-maroon mb-2">Something went wrong</h1>
      <p className="text-stone-600 text-sm mb-6 max-w-md text-center">
        {error.message}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-vt-maroon text-white px-4 py-2 rounded-lg font-medium"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-stone-300 text-stone-600 px-4 py-2 rounded-lg font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
