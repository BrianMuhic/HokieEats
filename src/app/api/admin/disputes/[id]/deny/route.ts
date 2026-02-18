import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/disputes/[id]/deny
 * Admin denies a dispute. Order is completed: fulfiller receives money, buyer stays charged.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id: disputeId } = await params;

  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        request: {
          include: { fulfillment: true, payment: true },
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
    const fulfillment = request.fulfillment;

    // When denying: mark dispute DENIED and complete the order (fulfiller receives money)
    await prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id: disputeId },
        data: { status: "DENIED", resolvedAt: new Date() },
      });

      // If payment is HELD, release it to fulfiller (order complete, buyer already charged)
      if (payment?.status === "HELD" && fulfillment) {
        await tx.fulfillment.update({
          where: { id: fulfillment.id },
          data: {
            status: "CONFIRMED",
            requesterConfirmedAt: new Date(),
          },
        });
        await tx.mealRequest.update({
          where: { id: request.id },
          data: { status: "CONFIRMED" },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "RELEASED", fulfillerPaidAt: new Date() },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Deny dispute error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
