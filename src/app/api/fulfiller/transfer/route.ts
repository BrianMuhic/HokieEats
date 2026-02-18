import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  FULFILLER_AMOUNT_CENTS,
  createTransferToConnectedAccount,
} from "@/lib/stripe";

/**
 * POST /api/fulfiller/transfer
 * Transfers specified amount (or full balance) to fulfiller's connected Stripe account.
 * Body: { amountCents?: number } — optional; if omitted, transfers full available balance.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripeConnectAccountId: true },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.json(
        { error: "Please connect your Stripe account first." },
        { status: 400 }
      );
    }

    const [earnings, payouts, reversals] = await Promise.all([
      prisma.fulfillment.count({
        where: {
          fulfillerId: session.userId,
          status: "CONFIRMED",
          request: { payment: { status: "RELEASED" } },
        },
      }),
      prisma.fulfillerPayout.aggregate({
        where: { fulfillerId: session.userId },
        _sum: { amountCents: true },
      }),
      prisma.disputeReversal.aggregate({
        where: { fulfillerPayout: { fulfillerId: session.userId } },
        _sum: { amountCents: true },
      }),
    ]);

    const totalEarnedCents = earnings * FULFILLER_AMOUNT_CENTS;
    const totalTransferredCents = payouts._sum.amountCents ?? 0;
    const totalReversedCents = reversals._sum.amountCents ?? 0;
    const availableToTransferCents = totalEarnedCents - (totalTransferredCents - totalReversedCents);

    if (availableToTransferCents < 100) {
      return NextResponse.json(
        { error: "Minimum transfer amount is $1.00." },
        { status: 400 }
      );
    }

    let amountCents = availableToTransferCents;
    try {
      const body = await req.json();
      if (typeof body.amountCents === "number" && body.amountCents > 0) {
        if (body.amountCents < 100) {
          return NextResponse.json(
            { error: "Minimum transfer amount is $1.00." },
            { status: 400 }
          );
        }
        if (body.amountCents > availableToTransferCents) {
          return NextResponse.json(
            { error: `Cannot transfer more than ${(availableToTransferCents / 100).toFixed(2)} available.` },
            { status: 400 }
          );
        }
        amountCents = Math.round(body.amountCents);
      }
    } catch {
      // No body or invalid JSON — use full balance
    }

    const transfer = await createTransferToConnectedAccount(
      user.stripeConnectAccountId,
      amountCents,
      { fulfillerId: session.userId }
    );

    await prisma.fulfillerPayout.create({
      data: {
        fulfillerId: session.userId,
        amountCents,
        stripeTransferId: transfer,
      },
    });

    return NextResponse.json({
      success: true,
      amountCents,
      transferId: transfer,
    });
  } catch (err) {
    console.error("Fulfiller transfer error:", err);
    const stripeErr = err as { code?: string; message?: string };
    const message =
      stripeErr?.code === "balance_insufficient"
        ? "Platform has insufficient Stripe balance. In test mode, use the 4000000000000077 test card to add funds via a request-meal payment, then try again."
        : stripeErr?.message ?? "Transfer failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
