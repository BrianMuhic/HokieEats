import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

    const request = await prisma.mealRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        reservedById: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Order already claimed." }, { status: 400 });
    }
    if (request.reservedById !== session.userId) {
      return NextResponse.json(
        { error: "You have not reserved this order." },
        { status: 400 }
      );
    }

    await prisma.mealRequest.update({
      where: { id: requestId },
      data: {
        reservedById: null,
        reservedAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Release reservation error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
