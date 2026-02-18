import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cancelPaymentIntent } from "@/lib/stripe";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: requestId } = await params;

    const request = await prisma.mealRequest.findUnique({
      where: { id: requestId },
      include: { payment: true, fulfillment: true },
    });

    if (!request || request.requesterId !== session.userId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only cancel requests that have not been fulfilled." },
        { status: 400 }
      );
    }

    if (request.fulfillment) {
      return NextResponse.json(
        { error: "Cannot cancel after a fulfiller has claimed the order." },
        { status: 400 }
      );
    }

    const payment = request.payment;
    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 400 }
      );
    }

    if (payment.status === "PRE_AUTHORIZED" && payment.stripePaymentIntentId) {
      try {
        await cancelPaymentIntent(payment.stripePaymentIntentId);
      } catch (cancelErr) {
        console.error("Cancel payment intent error:", cancelErr);
        return NextResponse.json(
          { error: "Failed to release payment hold." },
          { status: 500 }
        );
      }
    }

    await prisma.$transaction([
      prisma.mealRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cancel request error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
