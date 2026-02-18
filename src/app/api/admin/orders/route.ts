import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/orders
 * Admin: list all orders (meal requests with fulfillment & payment).
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const orders = await prisma.mealRequest.findMany({
      include: {
        requester: { select: { email: true } },
        fulfillment: {
          include: {
            fulfiller: { select: { email: true } },
          },
        },
        payment: true,
        dispute: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        diningHall: o.diningHall,
        restaurant: o.restaurant,
        mealDescription: o.mealDescription,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        requester: o.requester.email,
        fulfillment: o.fulfillment
          ? {
              id: o.fulfillment.id,
              fulfiller: o.fulfillment.fulfiller.email,
              status: o.fulfillment.status,
              orderConfirmationPath: o.fulfillment.orderConfirmationPath,
            }
          : null,
        payment: o.payment
          ? {
              id: o.payment.id,
              status: o.payment.status,
              amountCents: o.payment.amountCents,
            }
          : null,
        dispute: o.dispute
          ? { id: o.dispute.id, status: o.dispute.status, reason: o.dispute.reason }
          : null,
      })),
    });
  } catch (err) {
    console.error("Admin orders error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
