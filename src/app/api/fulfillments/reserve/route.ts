import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isReservationValid } from "@/lib/reservation";

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

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.mealRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          status: true,
          requesterId: true,
          reservedById: true,
          reservedAt: true,
        },
      });

      if (!request) return { success: false, error: "Request not found." };
      if (request.status !== "PENDING") return { success: false, error: "Order already claimed." };
      if (request.requesterId === session.userId) return { success: false, error: "Cannot fulfill your own request." };

      const reservedByOther = request.reservedById && request.reservedById !== session.userId;
      if (reservedByOther && isReservationValid(request.reservedAt)) {
        return { success: false, error: "Someone else is claiming this order. Try another." };
      }

      await tx.mealRequest.update({
        where: { id: requestId },
        data: {
          reservedById: session.userId,
          reservedAt: new Date(),
        },
      });

      return { success: true };
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reserve error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
