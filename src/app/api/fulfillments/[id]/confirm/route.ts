import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fulfillmentId } = await params;

  try {
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { request: { include: { payment: true } } },
    });

    if (!fulfillment || fulfillment.request.requesterId !== session.userId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (fulfillment.status !== "CLAIMED") {
      return NextResponse.json(
        { error: "Invalid fulfillment state." },
        { status: 400 }
      );
    }

    const payment = fulfillment.request.payment;
    if (!payment || payment.status !== "HELD") {
      return NextResponse.json(
        { error: "Invalid payment state." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.fulfillment.update({
        where: { id: fulfillmentId },
        data: {
          status: "CONFIRMED",
          requesterConfirmedAt: new Date(),
        },
      }),
      prisma.mealRequest.update({
        where: { id: fulfillment.requestId },
        data: { status: "CONFIRMED" },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "RELEASED", fulfillerPaidAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
