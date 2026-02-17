import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/stripe";

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
      include: { payment: true, fulfillment: true },
    });

    if (!mealRequest || mealRequest.requesterId !== session.userId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (
      !mealRequest.fulfillment ||
      mealRequest.fulfillment.status !== "CLAIMED"
    ) {
      return NextResponse.json(
        { error: "Order not ready for payment." },
        { status: 400 }
      );
    }

    const payment = mealRequest.payment;
    if (!payment || payment.status !== "PENDING") {
      if (payment?.status === "HELD") {
        return NextResponse.json(
          { error: "Already paid." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid payment state." },
        { status: 400 }
      );
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(requestId);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    return NextResponse.json({ clientSecret });
  } catch (err) {
    console.error("Create payment intent error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
