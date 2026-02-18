"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const RESERVATION_SECONDS = 5 * 60;

interface Request {
  id: string;
  diningHall: string;
  restaurant: string;
  mealDescription: string;
  createdAt: string;
  requesterEmail: string;
  reservedAt: string | null;
  reservedByMe: boolean;
}

export default function FulfillOrdersClient({
  requests = [],
}: {
  requests?: Request[];
}) {
  const router = useRouter();
  const safeRequests = Array.isArray(requests) ? requests : [];
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const initialReserved = (() => {
    const map: Record<string, number> = {};
    let firstReservedId: string | null = null;
    const now = Date.now();
    for (const r of safeRequests) {
      if (r.reservedByMe && r.reservedAt) {
        const ts = new Date(r.reservedAt).getTime();
        if (ts + RESERVATION_SECONDS * 1000 > now) {
          map[r.id] = ts;
          if (!firstReservedId) firstReservedId = r.id;
        }
      }
    }
    return { reservedAt: map, expandedId: firstReservedId };
  })();

  const [expandedId, setExpandedId] = useState<string | null>(initialReserved.expandedId);
  const [reservedAt, setReservedAt] = useState<Record<string, number>>(initialReserved.reservedAt);
  const [secondsLeft, setSecondsLeft] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const now = Date.now();
    for (const [id, ts] of Object.entries(initialReserved.reservedAt)) {
      map[id] = Math.max(0, Math.floor((ts + RESERVATION_SECONDS * 1000 - now) / 1000));
    }
    return map;
  });
  const fileInputRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [estimatedWaitTime, setEstimatedWaitTime] = useState("");

  useEffect(() => {
    if (Object.keys(reservedAt).length === 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next: Record<string, number> = {};
        for (const [id, timestamp] of Object.entries(reservedAt)) {
          const secs = Math.max(0, Math.floor((timestamp + RESERVATION_SECONDS * 1000 - Date.now()) / 1000));
          next[id] = secs;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reservedAt]);

  async function handleStartClaim(requestId: string) {
    setError("");
    setLoadingId(requestId);
    try {
      const res = await fetch("/api/fulfillments/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to reserve.");
        setLoadingId(null);
        return;
      }
      const now = Date.now();
      setReservedAt((r) => ({ ...r, [requestId]: now }));
      setSecondsLeft((s) => ({ ...s, [requestId]: RESERVATION_SECONDS }));
      setExpandedId(requestId);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCancelReservation(requestId: string) {
    setError("");
    setLoadingId(requestId);
    try {
      const res = await fetch("/api/fulfillments/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to release reservation.");
        return;
      }
      setExpandedId((cur) => (cur === requestId ? null : cur));
      setEstimatedWaitTime("");
      setReservedAt((r) => {
        const u = { ...r };
        delete u[requestId];
        return u;
      });
      setSecondsLeft((s) => {
        const u = { ...s };
        delete u[requestId];
        return u;
      });
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleClaim(requestId: string) {
    const input = fileInputRef.current[requestId];
    if (!input?.files?.length) {
      setError("Please upload an order confirmation screenshot.");
      return;
    }
    setError("");
    setLoadingId(requestId);
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("screenshot", input.files[0]);
      if (estimatedWaitTime.trim()) formData.append("estimatedWaitTime", estimatedWaitTime.trim());
      const res = await fetch("/api/fulfillments/claim", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to claim.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoadingId(null);
      setExpandedId(null);
      setEstimatedWaitTime("");
    }
  }

  if (safeRequests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-600">
        No open requests right now. Check back later!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {safeRequests.map((r) => {
        const showForm = expandedId === r.id;
        const secs = showForm ? (secondsLeft[r.id] ?? RESERVATION_SECONDS) : null;

        return (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-stone-200 p-6"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-vt-maroon">
                {r.diningHall} · {r.restaurant}
              </h3>
              <span className="text-stone-400 text-sm">
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-stone-600 text-sm mb-4">{r.mealDescription}</p>
            <p className="text-stone-500 text-xs mb-4">
              Place the order at the dining hall, then upload a screenshot of your order confirmation. You have 5 minutes once you start.
            </p>
            {showForm ? (
              <div className="space-y-3">
                {secs != null && secs > 0 ? (
                  <p className="text-sm text-vt-orange font-medium">
                    Time left: {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
                  </p>
                ) : secs != null && secs <= 0 ? (
                  <p className="text-sm text-amber-600">Reservation expired. Refresh to try again.</p>
                ) : null}
                <input
                  ref={(el) => { fileInputRef.current[r.id] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="block w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-vt-orange/20 file:text-vt-orange hover:file:bg-vt-orange/30"
                />
                <div>
                  <label htmlFor={`estimated-wait-${r.id}`} className="block text-sm font-medium text-stone-700 mb-1">
                    Estimated wait time for buyer
                  </label>
                  <input
                    id={`estimated-wait-${r.id}`}
                    type="text"
                    placeholder="e.g. 10–15 min"
                    value={estimatedWaitTime}
                    onChange={(e) => setEstimatedWaitTime(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-vt-orange/30 focus:border-vt-orange"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClaim(r.id)}
                    disabled={!!loadingId || (secs != null && secs <= 0)}
                    className="flex-1 bg-vt-orange hover:bg-orange-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {loadingId === r.id ? "Submitting…" : "Submit & Claim (Earn $5)"}
                  </button>
                  <button
                    onClick={() => handleCancelReservation(r.id)}
                    disabled={!!loadingId}
                    className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {loadingId === r.id ? "Releasing…" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleStartClaim(r.id)}
                disabled={!!loadingId}
                className="w-full bg-vt-orange hover:bg-orange-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {loadingId === r.id ? "Reserving…" : "Claim Order (Earn $5)"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
