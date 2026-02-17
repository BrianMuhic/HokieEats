import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isReservationValid } from "@/lib/reservation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const requestId = formData.get("requestId") as string | null;
    const file = formData.get("screenshot") as File | null;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID required." },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "Order confirmation screenshot is required." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 5MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const claimResult = await prisma.$transaction(async (tx) => {
      const request = await tx.mealRequest.findUnique({
        where: { id: requestId },
        include: { fulfillment: true },
      });

      if (!request) return { ok: false, error: "Request not found." };
      if (request.fulfillment) return { ok: false, error: "Order already claimed by someone else." };
      if (request.status !== "PENDING") return { ok: false, error: "This request is no longer available." };
      if (request.requesterId === session.userId) return { ok: false, error: "You cannot fulfill your own request." };

      const hasValidReservation =
        request.reservedById === session.userId && isReservationValid(request.reservedAt);
      if (!hasValidReservation) {
        return { ok: false, error: "Reservation expired or someone else claimed it. Please try another order." };
      }

      return { ok: true };
    });

    if (!claimResult.ok) {
      return NextResponse.json(
        { error: claimResult.error },
        claimResult.error === "Request not found." ? { status: 404 } : { status: 400 }
      );
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${requestId}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "fulfillments");
    const filepath = path.join(uploadDir, filename);
    const publicPath = `/uploads/fulfillments/${filename}`;

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    await prisma.$transaction([
      prisma.fulfillment.create({
        data: {
          requestId,
          fulfillerId: session.userId,
          orderConfirmationPath: publicPath,
          status: "CLAIMED",
        },
      }),
      prisma.mealRequest.update({
        where: { id: requestId },
        data: {
          status: "AWAITING_PAYMENT",
          reservedById: null,
          reservedAt: null,
        },
      }),
      prisma.payment.create({
        data: {
          requestId,
          amountCents: 600,
          status: "PENDING",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Claim fulfillment error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
