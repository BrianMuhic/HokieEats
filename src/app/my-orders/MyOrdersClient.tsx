"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    estimatedWaitTime: string | null;
    requesterConfirmedAt: string | null;
  } | null;
  payment: { id: string; status: string } | null;
  dispute: { id: string; status: string } | null;
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
  estimatedWaitTime: string | null;
}

export default function MyOrdersClient({
  requests,
  fulfillments,
}: {
  requests: RequestItem[];
  fulfillments: FulfillmentItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [disputeModal, setDisputeModal] = useState<{ requestId: string } | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeImage1, setDisputeImage1] = useState<File | null>(null);
  const [disputeImage2, setDisputeImage2] = useState<File | null>(null);

  useEffect(() => {
    const authorized = searchParams.get("authorized") === "1";
    const requestId = searchParams.get("requestId");
    if (authorized && requestId) {
      fetch("/api/payments/sync-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })
        .then(() => {
          router.replace("/my-orders");
          router.refresh();
        })
        .catch(() => {
          router.replace("/my-orders");
          router.refresh();
        });
    } else if (authorized) {
      router.replace("/my-orders");
      router.refresh();
    }
  }, [searchParams, router]);

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

  async function cancelRequest(requestId: string) {
    setError("");
    setLoading(requestId);
    try {
      const res = await fetch(`/api/meal-requests/${requestId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to cancel.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function submitDispute() {
    if (!disputeModal || disputeReason.trim().length < 10) {
      setError("Please provide a reason (at least 10 characters).");
      return;
    }
    if (!disputeImage1) {
      setError("Please upload at least one image.");
      return;
    }
    setError("");
    setLoading(disputeModal.requestId);
    try {
      const formData = new FormData();
      formData.append("requestId", disputeModal.requestId);
      formData.append("reason", disputeReason.trim());
      formData.append("image1", disputeImage1);
      if (disputeImage2) formData.append("image2", disputeImage2);
      const res = await fetch("/api/disputes", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit dispute.");
        return;
      }
      setDisputeModal(null);
      setDisputeReason("");
      setDisputeImage1(null);
      setDisputeImage2(null);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  const statusLabels: Record<string, string> = {
    PENDING: "Awaiting fulfiller",
    FULFILLED: "Order placed",
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
                    {r.status === "PENDING" && r.payment?.status === "PRE_AUTHORIZED"
                      ? "Card authorized ✓"
                      : statusLabels[r.status] ?? r.status}
                  </span>
                </div>
                <p className="text-stone-600 text-sm mb-4">{r.mealDescription}</p>
                {r.fulfillment?.orderConfirmationPath && (
                  <div className="mb-4">
                    {r.fulfillment.estimatedWaitTime && (
                      <p className="text-sm text-stone-600 mb-2">
                        <span className="font-medium">Estimated wait:</span> {r.fulfillment.estimatedWaitTime}
                      </p>
                    )}
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
                {r.status === "PENDING" && r.payment?.status === "PENDING" && (
                  <div className="space-y-3">
                    <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                      Authorize your card to make this request live. You&apos;ll only be charged when a fulfiller submits proof.
                    </p>
                    <Link
                      href={`/pay/${r.id}`}
                      className="inline-block bg-vt-maroon text-white px-4 py-2 rounded-lg font-medium hover:bg-vt-burgundy"
                    >
                      Authorize $6
                    </Link>
                  </div>
                )}
                {r.status === "PENDING" && r.payment?.status === "PRE_AUTHORIZED" && (
                  <div className="space-y-3">
                    <p className="text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                      ✓ Card authorized. A fulfiller will place your order and upload proof—you&apos;ll be charged when they do.
                    </p>
                    <button
                      onClick={() => cancelRequest(r.id)}
                      disabled={!!loading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {loading === r.id ? "Cancelling…" : "Cancel request & release hold"}
                    </button>
                  </div>
                )}
                {r.status === "PAID" && r.fulfillment?.status === "CLAIMED" && !r.dispute && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => confirmReceipt(r.fulfillment!.id)}
                      disabled={!!loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading === r.fulfillment.id ? "Confirming…" : "I received my food"}
                    </button>
                    <button
                      onClick={() => setDisputeModal({ requestId: r.id })}
                      disabled={!!loading}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium disabled:opacity-50"
                    >
                      Dispute order
                    </button>
                  </div>
                )}
                {(["PAID", "CONFIRMED"].includes(r.status) &&
                  r.payment?.status &&
                  ["HELD", "RELEASED"].includes(r.payment.status) &&
                  !r.dispute &&
                  !(r.status === "PAID" && r.fulfillment?.status === "CLAIMED")) && (
                  <button
                    onClick={() => setDisputeModal({ requestId: r.id })}
                    disabled={!!loading}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium disabled:opacity-50"
                  >
                    Dispute order
                  </button>
                )}
                {r.dispute && (
                  <p className="text-stone-500 text-sm">
                    Dispute: {r.dispute.status}
                    {r.dispute.status === "DENIED" && " — Order completed."}
                  </p>
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

      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-vt-maroon mb-2">Dispute this order</h3>
            <p className="text-stone-600 text-sm mb-4">
              Describe why you are disputing this order and upload at least one image. An admin will review your request. If approved, you will be refunded.
            </p>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain the issue (min 10 characters)..."
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm min-h-[80px] mb-4"
              maxLength={2000}
            />
            <p className="text-stone-400 text-xs mb-3">{disputeReason.length}/2000</p>

            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-stone-700">
                Image 1 (required) *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setDisputeImage1(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700"
              />
              {disputeImage1 && <p className="text-xs text-green-600">{disputeImage1.name}</p>}

              <label className="block text-sm font-medium text-stone-700 mt-3">
                Image 2 (optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setDisputeImage2(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700"
              />
              {disputeImage2 && <p className="text-xs text-green-600">{disputeImage2.name}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitDispute}
                disabled={!!loading || disputeReason.trim().length < 10 || !disputeImage1}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? "Submitting…" : "Submit dispute"}
              </button>
              <button
                onClick={() => {
                  setDisputeModal(null);
                  setDisputeReason("");
                  setDisputeImage1(null);
                  setDisputeImage2(null);
                  setError("");
                }}
                disabled={!!loading}
                className="bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-medium hover:bg-stone-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
