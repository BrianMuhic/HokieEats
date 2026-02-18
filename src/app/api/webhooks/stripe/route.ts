import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const requestId = paymentIntent.metadata?.requestId;
    if (!requestId) return NextResponse.json({ received: true });

    const payment = await prisma.payment.findFirst({
      where: {
        requestId,
        stripePaymentIntentId: paymentIntent.id,
      },
    });
    if (!payment) return NextResponse.json({ received: true });

    if (payment.status === "PENDING" && paymentIntent.status === "requires_capture") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PRE_AUTHORIZED" },
      });
    } else if (
      payment.status === "PRE_AUTHORIZED" &&
      paymentIntent.status === "succeeded"
    ) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "HELD",
          requesterChargedAt: new Date(),
        },
      });
      await prisma.mealRequest.update({
        where: { id: requestId },
        data: { status: "PAID" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
