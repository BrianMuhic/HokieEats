/**
 * Stripe payment integration
 * $6 total: $5 to fulfiller, $1 platform fee
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder");

const MEAL_PRICE_CENTS = 600; // $6
const FULFILLER_AMOUNT_CENTS = 500; // $5
const PLATFORM_FEE_CENTS = 100; // $1

export { stripe, MEAL_PRICE_CENTS, FULFILLER_AMOUNT_CENTS, PLATFORM_FEE_CENTS };

export async function createPaymentIntent(
  requestId: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: MEAL_PRICE_CENTS,
    currency: "usd",
    metadata: { requestId },
    automatic_payment_methods: { enabled: true },
  });
  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}
