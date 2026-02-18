import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/admin/disputes
 * Admin: list all disputes.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        request: {
          include: {
            requester: { select: { email: true } },
            fulfillment: {
              include: { fulfiller: { select: { email: true } } },
            },
            payment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      disputes: disputes.map((d) => ({
        id: d.id,
        requestId: d.requestId,
        reason: d.reason,
        image1Path: d.image1Path,
        image2Path: d.image2Path,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        resolvedAt: d.resolvedAt?.toISOString() ?? null,
        order: {
          id: d.request.id,
          diningHall: d.request.diningHall,
          restaurant: d.request.restaurant,
          mealDescription: d.request.mealDescription,
          requester: d.request.requester.email,
          fulfiller: d.request.fulfillment?.fulfiller?.email ?? null,
          paymentStatus: d.request.payment?.status ?? null,
        },
      })),
    });
  } catch (err) {
    console.error("Admin disputes error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
