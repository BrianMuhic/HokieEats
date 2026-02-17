"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RequestItem {
  id: string;
  diningHall: string;
  restaurant: string;
  mealDescription: string;
  status: string;
  createdAt: string;
  fulfillment: {
    id: string;
    status: string;
    orderConfirmationPath: string | null;
    requesterConfirmedAt: string | null;
  } | null;
  payment: { id: string; status: string } | null;
}

interface FulfillmentItem {
  id: string;
  requestId: string;
  diningHall: string;
  restaurant: string;
  mealDescription: string;
  status: string;
  createdAt: string;
  orderConfirmationPath: string | null;
}

export default function MyOrdersClient({
  requests,
  fulfillments,
}: {
  requests: RequestItem[];
  fulfillments: FulfillmentItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function confirmReceipt(fulfillmentId: string) {
    setError("");
    setLoading(fulfillmentId);
    try {
      const res = await fetch(`/api/fulfillments/${fulfillmentId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  const statusLabels: Record<string, string> = {
    PENDING: "Awaiting fulfiller",
    FULFILLED: "Order placed, pay now",
    AWAITING_PAYMENT: "Pay to complete",
    PAID: "Confirm you received it",
    CONFIRMED: "Complete ✓",
    CANCELLED: "Cancelled",
    CLAIMED: "Order placed",
  };

  return (
    <div className="space-y-8">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {requests.length > 0 && (
        <section>
          <h2 className="font-semibold text-vt-maroon mb-4">My Requests</h2>
          <div className="space-y-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-stone-200 p-6"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {r.diningHall} · {r.restaurant}
                  </h3>
                  <span className="text-stone-500 text-sm">
                    {statusLabels[r.status] ?? r.status}
                  </span>
                </div>
                <p className="text-stone-600 text-sm mb-4">{r.mealDescription}</p>
                {r.fulfillment?.orderConfirmationPath && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-stone-700 mb-2">
                      Order confirmation
                    </p>
                    <a
                      href={r.fulfillment.orderConfirmationPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-stone-200 hover:opacity-90"
                    >
                      <img
                        src={r.fulfillment.orderConfirmationPath}
                        alt="Order confirmation"
                        className="object-cover w-full h-full"
                      />
                    </a>
                    <a
                      href={r.fulfillment.orderConfirmationPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-vt-maroon hover:underline mt-1 inline-block"
                    >
                      View full image
                    </a>
                  </div>
                )}
                {r.status === "AWAITING_PAYMENT" && r.payment?.status === "PENDING" && (
                  <div className="space-y-3">
                    <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                      Your order has been placed. Payment of $6 is required—you can pick up your food at the dining hall. This cannot be cancelled.
                    </p>
                    <Link
                      href={`/pay/${r.id}`}
                      className="inline-block bg-vt-maroon text-white px-4 py-2 rounded-lg font-medium hover:bg-vt-burgundy"
                    >
                      Pay $6 (Required)
                    </Link>
                  </div>
                )}
                {r.status === "PAID" && r.fulfillment?.status === "CLAIMED" && (
                  <button
                    onClick={() => confirmReceipt(r.fulfillment!.id)}
                    disabled={!!loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading === r.fulfillment.id ? "Confirming…" : "I received my food"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {fulfillments.length > 0 && (
        <section>
          <h2 className="font-semibold text-vt-orange mb-4">Orders I Fulfilled</h2>
          <div className="space-y-4">
            {fulfillments.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-stone-200 p-6"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {f.diningHall} · {f.restaurant}
                  </h3>
                  <span className="text-stone-500 text-sm">
                    {statusLabels[f.status] ?? f.status}
                  </span>
                </div>
                <p className="text-stone-600 text-sm mb-2">{f.mealDescription}</p>
                <p className="text-stone-400 text-xs">
                  Awaiting buyer payment & confirmation. You&apos;ll receive $5 when they confirm.
                </p>
                {f.orderConfirmationPath && (
                  <a
                    href={f.orderConfirmationPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-vt-orange hover:underline mt-2 inline-block"
                  >
                    View your confirmation
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {requests.length === 0 && fulfillments.length === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-600">
          <p className="mb-4">No orders yet.</p>
          <Link href="/request-meal" className="text-vt-maroon font-medium hover:underline">
            Request a meal
          </Link>
          {" or "}
          <Link href="/fulfill-orders" className="text-vt-orange font-medium hover:underline">
            fulfill an order
          </Link>
        </div>
      )}
    </div>
  );
}
