"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InitialData {
  totalEarnedCents: number;
  totalTransferredCents: number;
  availableToTransferCents: number;
  hasConnectedAccount: boolean;
  earnings: Array<{
    id: string;
    requestId: string;
    diningHall: string;
    restaurant: string;
    mealDescription: string;
    amountCents: number;
    confirmedAt: Date | null;
  }>;
  payouts: Array<{
    id: string;
    amountCents: number;
    createdAt: Date;
  }>;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function FulfillerEarningsClient({
  initialData,
  isTestMode = false,
}: {
  initialData: InitialData;
  isTestMode?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  async function handleConnectStripe() {
    setError("");
    setLoading("connect");
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${base}/fulfiller-earnings?onboard=success`;
      const refreshUrl = `${base}/fulfiller-earnings?onboard=refresh`;
      const res = await fetch("/api/fulfiller/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl, refreshUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create onboarding link.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function handleTransfer(amountCents?: number) {
    setError("");
    setLoading("transfer");
    try {
      const body: { amountCents?: number } = {};
      if (typeof amountCents === "number" && amountCents > 0) {
        body.amountCents = amountCents;
      }
      const res = await fetch("/api/fulfiller/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Transfer failed.");
        return;
      }
      setTransferAmount("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  const {
    totalEarnedCents,
    totalTransferredCents,
    availableToTransferCents,
    hasConnectedAccount,
    earnings,
    payouts,
  } = initialData;

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <p className="text-stone-500 text-sm mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-vt-maroon">
            {formatCents(totalEarnedCents)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <p className="text-stone-500 text-sm mb-1">Transferred</p>
          <p className="text-2xl font-bold text-stone-700">
            {formatCents(totalTransferredCents)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-vt-orange/30 p-6">
          <p className="text-stone-500 text-sm mb-1">Available</p>
          <p className="text-2xl font-bold text-vt-orange">
            {formatCents(availableToTransferCents)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="font-semibold text-vt-maroon mb-4">Transfer to Bank</h2>
        {!hasConnectedAccount ? (
          <div>
            <p className="text-stone-600 text-sm mb-4">
              Connect your Stripe account to receive payouts. You&apos;ll be able
              to add your bank details securely through Stripe.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={!!loading}
              className="bg-vt-orange hover:bg-orange-600 text-white py-2 px-6 rounded-lg font-medium disabled:opacity-50"
            >
              {loading === "connect" ? "Connecting…" : "Connect Stripe Account"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-stone-600 text-sm mb-4">
              Transfer your available balance to your connected bank account.
              Payouts typically arrive within 2–3 business days.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label htmlFor="transfer-amount" className="sr-only">
                  Amount to transfer
                </label>
                <input
                  id="transfer-amount"
                  type="number"
                  min="1"
                  max={availableToTransferCents / 100}
                  step="0.01"
                  placeholder={`Max ${formatCents(availableToTransferCents)}`}
                  value={transferAmount}
                  onChange={(e) => {
                    setTransferAmount(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-32 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  disabled={!!loading}
                />
                <span className="ml-2 text-stone-500 text-sm">USD</span>
              </div>
              <button
                onClick={() => {
                  const parsed = parseFloat(transferAmount);
                  if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= availableToTransferCents / 100) {
                    handleTransfer(Math.round(parsed * 100));
                  } else if (!transferAmount.trim()) {
                    setError("Enter an amount or click Transfer all.");
                  } else {
                    setError(`Enter between $1.00 and ${formatCents(availableToTransferCents)}.`);
                  }
                }}
                disabled={!!loading || availableToTransferCents < 100}
                className="bg-vt-orange hover:bg-orange-600 text-white py-2 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === "transfer" ? "Transferring…" : "Transfer"}
              </button>
              <button
                onClick={() => handleTransfer()}
                disabled={!!loading || availableToTransferCents < 100}
                className="text-vt-orange hover:text-orange-600 font-medium disabled:opacity-50"
              >
                Transfer all ({formatCents(availableToTransferCents)})
              </button>
            </div>
            <p className="text-stone-500 text-xs mt-2">
              Min $1.00 · Max {formatCents(availableToTransferCents)}
            </p>
            {isTestMode && (
              <p className="text-stone-500 text-xs mt-4">
                Transfers failed? Add funds to your Stripe balance:{" "}
                <a href="/dev/add-test-funds" className="text-vt-orange hover:underline">
                  Add test funds
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      {earnings.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="font-semibold text-vt-maroon mb-4">Earnings History</h2>
          <ul className="space-y-3">
            {earnings.map((e) => (
              <li
                key={e.id}
                className="flex justify-between items-start py-2 border-b border-stone-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-stone-800">
                    {e.diningHall} · {e.restaurant}
                  </p>
                  <p className="text-stone-500 text-sm">{e.mealDescription}</p>
                  {e.confirmedAt && (
                    <p className="text-stone-400 text-xs mt-1">
                      {new Date(e.confirmedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="font-semibold text-vt-orange">
                  +{formatCents(e.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payouts.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="font-semibold text-vt-maroon mb-4">Transfer History</h2>
          <ul className="space-y-3">
            {payouts.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0"
              >
                <span className="text-stone-500 text-sm">
                  {new Date(p.createdAt).toLocaleString()}
                </span>
                <span className="font-semibold text-stone-700">
                  -{formatCents(p.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {earnings.length === 0 && payouts.length === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-600">
          <p className="mb-2">You haven&apos;t earned any money yet.</p>
          <p className="text-sm">
            <a href="/fulfill-orders" className="text-vt-orange hover:underline">
              Fulfill orders
            </a>{" "}
            to start earning $5 per delivery.
          </p>
        </div>
      )}
    </div>
  );
}
