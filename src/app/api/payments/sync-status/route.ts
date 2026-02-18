import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/**
 * Syncs payment status from Stripe when returning from authorize flow.
 * Use when webhooks haven't run (e.g. stripe listen not running).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID required." },
        { status: 400 }
      );
    }

    const mealRequest = await prisma.mealRequest.findUnique({
      where: { id: requestId },
      include: { payment: true },
    });

    if (!mealRequest || mealRequest.requesterId !== session.userId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const payment = mealRequest.payment;
    if (!payment || !payment.stripePaymentIntentId) {
      return NextResponse.json({ updated: false });
    }

    if (payment.status !== "PENDING" && payment.status !== "PRE_AUTHORIZED") {
      return NextResponse.json({ updated: false });
    }

    const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

    if (payment.status === "PENDING" && pi.status === "requires_capture") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PRE_AUTHORIZED" },
      });
      return NextResponse.json({ updated: true });
    }

    if (
      payment.status === "PRE_AUTHORIZED" &&
      pi.status === "succeeded"
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
      return NextResponse.json({ updated: true });
    }

    return NextResponse.json({ updated: false });
  } catch (err) {
    console.error("Sync payment status error:", err);
    return NextResponse.json(
      { error: "Failed to sync status." },
      { status: 500 }
    );
  }
}
