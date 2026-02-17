"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder"
);

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Invalid payment info.");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/my-orders`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
    } else {
      router.push("/my-orders");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-vt-maroon hover:bg-vt-burgundy text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay $6"}
      </button>
      <Link href="/my-orders" className="block text-center text-stone-600 text-sm hover:underline">
        Cancel
      </Link>
    </form>
  );
}

export default function PayForm({ requestId }: { requestId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setErr(data.error ?? "Failed to load payment form.");
      })
      .catch(() => setErr("Failed to load."))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return <p className="text-stone-600">Loading payment form…</p>;
  if (err || !clientSecret) {
    return (
      <div>
        <p className="text-red-600">{err || "Could not load payment form."}</p>
        <Link href="/my-orders" className="text-vt-maroon mt-4 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: { colorPrimary: "#861F41" },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
