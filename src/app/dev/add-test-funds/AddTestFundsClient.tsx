"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder"
);

function AddFundsForm({
  clientSecret,
  amountCents,
}: {
  clientSecret: string;
  amountCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
        return_url: `${window.location.origin}/dev/add-test-funds?success=1`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg">
        Payment submitted. Funds should appear in your Stripe balance shortly.
        <Link href="/fulfiller-earnings" className="block mt-4 text-vt-orange font-medium hover:underline">
          Back to earnings →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Use this test card:</p>
        <code className="block bg-white px-2 py-1 rounded font-mono">
          4000 0000 0000 0077
        </code>
        <p className="mt-2 text-amber-700">
          Any future expiry, any CVC. This card adds funds directly to your
          platform balance.
        </p>
      </div>
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-vt-orange hover:bg-orange-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "Processing…" : `Pay $${(amountCents / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function AddTestFundsClient() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dev/add-test-funds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: 2000 }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setAmountCents(data.amountCents ?? 2000);
        } else {
          setError(data.error ?? "Failed to load.");
        }
      })
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-stone-600">Loading…</p>;
  if (error) {
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <Link href="/fulfiller-earnings" className="mt-4 inline-block text-vt-orange hover:underline">
          Back to earnings
        </Link>
      </div>
    );
  }
  if (!clientSecret) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: { colorPrimary: "#e87722" },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <AddFundsForm clientSecret={clientSecret} amountCents={amountCents} />
    </Elements>
  );
}
