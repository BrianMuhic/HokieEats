import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { FULFILLER_AMOUNT_CENTS } from "@/lib/stripe";

/**
 * GET /api/fulfiller/balance
 * Returns fulfiller's earnings summary and available balance to transfer.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [earnings, payouts, totalReversedCents, user] = await Promise.all([
      prisma.fulfillment.findMany({
        where: {
          fulfillerId: session.userId,
          status: "CONFIRMED",
          request: { payment: { status: "RELEASED" } },
        },
        include: {
          request: {
            select: {
              diningHall: true,
              restaurant: true,
              mealDescription: true,
              id: true,
            },
          },
        },
        orderBy: { requesterConfirmedAt: "desc" },
      }),
      prisma.fulfillerPayout.findMany({
        where: { fulfillerId: session.userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.disputeReversal.aggregate({
        where: { fulfillerPayout: { fulfillerId: session.userId } },
        _sum: { amountCents: true },
      }).then((r) => r._sum.amountCents ?? 0),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { stripeConnectAccountId: true },
      }),
    ]);

    const totalEarnedCents = earnings.length * FULFILLER_AMOUNT_CENTS;
    const totalTransferredCents = payouts.reduce((sum, p) => sum + p.amountCents, 0);
    const netTransferredCents = totalTransferredCents - totalReversedCents;
    const availableToTransferCents = totalEarnedCents - netTransferredCents;

    return NextResponse.json({
      totalEarnedCents,
      totalTransferredCents,
      totalReversedCents,
      availableToTransferCents,
      hasConnectedAccount: !!user?.stripeConnectAccountId,
      earnings: earnings.map((e) => ({
        id: e.id,
        requestId: e.requestId,
        diningHall: e.request.diningHall,
        restaurant: e.request.restaurant,
        mealDescription: e.request.mealDescription,
        amountCents: FULFILLER_AMOUNT_CENTS,
        confirmedAt: e.requesterConfirmedAt,
      })),
      payouts: payouts.map((p) => ({
        id: p.id,
        amountCents: p.amountCents,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("Fulfiller balance error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
