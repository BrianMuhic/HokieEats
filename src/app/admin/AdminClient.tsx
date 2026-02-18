"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  diningHall: string;
  restaurant: string;
  mealDescription: string;
  status: string;
  createdAt: string;
  requester: string;
  fulfillment: {
    id: string;
    fulfiller: string;
    status: string;
    orderConfirmationPath: string | null;
  } | null;
  payment: { id: string; status: string; amountCents: number } | null;
  dispute: { id: string; status: string; reason: string } | null;
};

type Dispute = {
  id: string;
  requestId: string;
  reason: string;
  image1Path: string | null;
  image2Path: string | null;
  status: string;
  createdAt: string;
  order: {
    id: string;
    diningHall: string;
    restaurant: string;
    mealDescription: string;
    requester: string;
    fulfiller: string | null;
    paymentStatus: string | null;
  };
};

export default function AdminClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "disputes">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  function fetchOrders() {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(() => setError("Failed to load orders"));
  }

  function fetchDisputes() {
    fetch("/api/admin/disputes")
      .then((r) => r.json())
      .then((data) => {
        if (data.disputes) setDisputes(data.disputes);
      })
      .catch(() => setError("Failed to load disputes"));
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/disputes").then((r) => r.json()),
    ])
      .then(([ordersRes, disputesRes]) => {
        if (ordersRes.orders) setOrders(ordersRes.orders);
        if (disputesRes.disputes) setDisputes(disputesRes.disputes);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  async function approveDispute(id: string) {
    setError("");
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/disputes/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to approve");
        return;
      }
      fetchOrders();
      fetchDisputes();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function denyDispute(id: string) {
    setError("");
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/disputes/${id}/deny`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to deny");
        return;
      }
      fetchOrders();
      fetchDisputes();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    DENIED: "bg-stone-100 text-stone-600",
    PAID: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    HELD: "bg-amber-100 text-amber-800",
    RELEASED: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <div className="text-stone-500 py-12 text-center">Loading…</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-stone-200">
        <button
          onClick={() => setTab("orders")}
          className={`pb-3 px-1 font-medium border-b-2 -mb-px transition-colors ${
            tab === "orders"
              ? "border-vt-maroon text-vt-maroon"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Order History
        </button>
        <button
          onClick={() => setTab("disputes")}
          className={`pb-3 px-1 font-medium border-b-2 -mb-px transition-colors ${
            tab === "disputes"
              ? "border-vt-maroon text-vt-maroon"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Disputes
          {disputes.filter((d) => d.status === "PENDING").length > 0 && (
            <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
              {disputes.filter((d) => d.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-stone-500 py-8">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-xl border border-stone-200 p-6"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-vt-maroon">
                    {o.diningHall} · {o.restaurant}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${statusColors[o.status] ?? "bg-stone-100"}`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="text-stone-600 text-sm mb-3">{o.mealDescription}</p>
                <div className="text-sm text-stone-500 space-y-1">
                  <p>Buyer: {o.requester}</p>
                  {o.fulfillment && (
                    <p>Fulfiller: {o.fulfillment.fulfiller}</p>
                  )}
                  {o.payment && (
                    <p>
                      Payment: {o.payment.status} · $
                      {(o.payment.amountCents / 100).toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs">{new Date(o.createdAt).toLocaleString()}</p>
                  {o.dispute && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                      <p className="font-medium text-amber-800">Dispute: {o.dispute.status}</p>
                      <p className="text-sm text-amber-700">{o.dispute.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "disputes" && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <p className="text-stone-500 py-8">No disputes.</p>
          ) : (
            disputes.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-stone-200 p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-vt-maroon">
                    {d.order.diningHall} · {d.order.restaurant}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${statusColors[d.status] ?? "bg-stone-100"}`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="text-stone-600 text-sm mb-2">{d.order.mealDescription}</p>
                <div className="text-sm text-stone-500 mb-4">
                  <p>Buyer: {d.order.requester}</p>
                  <p>Fulfiller: {d.order.fulfiller ?? "—"}</p>
                  <p>{new Date(d.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-4 mb-4">
                  <p className="font-medium text-stone-700 mb-1">Dispute reason:</p>
                  <p className="text-stone-600 whitespace-pre-wrap">{d.reason}</p>
                </div>
                {(d.image1Path || d.image2Path) && (
                  <div className="flex gap-4 mb-4">
                    {d.image1Path && (
                      <div>
                        <p className="text-xs font-medium text-stone-500 mb-1">Image 1</p>
                        <a href={d.image1Path} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={d.image1Path} alt="Dispute evidence 1" className="max-w-xs max-h-48 object-cover rounded-lg border border-stone-200" />
                        </a>
                      </div>
                    )}
                    {d.image2Path && (
                      <div>
                        <p className="text-xs font-medium text-stone-500 mb-1">Image 2</p>
                        <a href={d.image2Path} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={d.image2Path} alt="Dispute evidence 2" className="max-w-xs max-h-48 object-cover rounded-lg border border-stone-200" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {d.status === "PENDING" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveDispute(d.id)}
                      disabled={!!actionLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === d.id ? "Processing…" : "Approve (refund buyer)"}
                    </button>
                    <button
                      onClick={() => denyDispute(d.id)}
                      disabled={!!actionLoading}
                      className="bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-medium hover:bg-stone-300 disabled:opacity-50"
                    >
                      {actionLoading === d.id ? "…" : "Deny"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
