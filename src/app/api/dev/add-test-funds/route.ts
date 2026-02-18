import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

/**
 * Creates a PaymentIntent to add test funds to the platform's Stripe balance.
 * Use card 4000000000000077 to add funds immediately.
 * Only available in test mode.
 */
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key.startsWith("sk_test_")) {
    return NextResponse.json(
      { error: "Only available in Stripe test mode." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const amountCents = Math.min(
      Math.max(Number(body.amountCents) || 2000, 100),
      100000
    ); // $1–$1000

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      capture_method: "automatic",
      metadata: { purpose: "add_test_funds" },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: pi.client_secret!,
      amountCents,
    });
  } catch (err) {
    console.error("Add test funds error:", err);
    return NextResponse.json(
      { error: "Failed to create payment." },
      { status: 500 }
    );
  }
}
