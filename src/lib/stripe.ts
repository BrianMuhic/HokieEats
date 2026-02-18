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
    capture_method: "manual",
    metadata: { requestId },
    automatic_payment_methods: { enabled: true },
  });
  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

export async function capturePaymentIntent(
  paymentIntentId: string
): Promise<void> {
  await stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string): Promise<void> {
  await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Stripe Connect - Express accounts for fulfiller payouts
 */

export async function createConnectAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email,
  });
  return account.id;
}

export async function createAccountLink(
  connectedAccountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: connectedAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

export async function createTransferToConnectedAccount(
  connectedAccountId: string,
  amountCents: number,
  metadata?: Record<string, string>
): Promise<string> {
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: "usd",
    destination: connectedAccountId,
    metadata,
  });
  return transfer.id;
}

export async function reverseTransfer(
  transferId: string,
  amountCents: number
): Promise<string> {
  const reversal = await stripe.transfers.createReversal(transferId, {
    amount: amountCents,
  });
  return reversal.id;
}

export async function refundPaymentIntent(paymentIntentId: string): Promise<void> {
  await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
}
