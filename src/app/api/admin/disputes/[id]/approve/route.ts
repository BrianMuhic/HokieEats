import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  FULFILLER_AMOUNT_CENTS,
  refundPaymentIntent,
  reverseTransfer,
} from "@/lib/stripe";

/**
 * POST /api/admin/disputes/[id]/approve
 * Admin approves a dispute: refund buyer, reverse fulfiller transfer if paid.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id: disputeId } = await params;

  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        request: {
          include: {
            fulfillment: true,
            payment: true,
          },
        },
      },
    });

    if (!dispute || dispute.status !== "PENDING") {
      return NextResponse.json(
        { error: "Dispute not found or already resolved." },
        { status: 404 }
      );
    }

    const { request } = dispute;
    const payment = request.payment;

    if (!payment?.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "Payment record missing." },
        { status: 400 }
      );
    }

    if (!["HELD", "RELEASED"].includes(payment.status)) {
      return NextResponse.json(
        { error: "Payment cannot be refunded." },
        { status: 400 }
      );
    }

    // 1. Refund the buyer
    await refundPaymentIntent(payment.stripePaymentIntentId);

    // 2. Reverse fulfiller transfer if payment was RELEASED (they've been paid)
    const fulfillerId = request.fulfillment?.fulfillerId;
    if (payment.status === "RELEASED" && fulfillerId) {
      // Find payouts to reverse from (newest first). We need to reverse FULFILLER_AMOUNT_CENTS.
      const payouts = await prisma.fulfillerPayout.findMany({
        where: { fulfillerId },
        orderBy: { createdAt: "desc" },
      });

      let remainingToReverse = FULFILLER_AMOUNT_CENTS;
      for (const payout of payouts) {
        if (remainingToReverse <= 0) break;

        const alreadyReversed = await prisma.disputeReversal.aggregate({
          where: { fulfillerPayoutId: payout.id },
          _sum: { amountCents: true },
        });
        const netAmount = payout.amountCents - (alreadyReversed._sum.amountCents ?? 0);
        if (netAmount <= 0) continue;

        const toReverse = Math.min(remainingToReverse, netAmount);
        const reversalId = await reverseTransfer(payout.stripeTransferId, toReverse);

        await prisma.disputeReversal.create({
          data: {
            disputeId,
            fulfillerPayoutId: payout.id,
            amountCents: toReverse,
            stripeReversalId: reversalId,
          },
        });

        remainingToReverse -= toReverse;
      }
    }

    // 3. Update DB: payment REFUNDED, dispute APPROVED, request/fulfillment status
    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: disputeId },
        data: { status: "APPROVED", resolvedAt: new Date(), resolvedById: session.userId },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      }),
      prisma.mealRequest.update({
        where: { id: request.id },
        data: { status: "CANCELLED" },
      }),
      request.fulfillment
        ? prisma.fulfillment.update({
            where: { id: request.fulfillment.id },
            data: { status: "CANCELLED" },
          })
        : prisma.$executeRaw`SELECT 1`,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve dispute error:", err);
    const msg = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
