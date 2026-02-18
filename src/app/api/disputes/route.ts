import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/disputes
 * Buyer opens a dispute on an order. Requires 1 image, optional 2nd image.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const requestId = formData.get("requestId") as string | null;
    const reason = (formData.get("reason") as string | null)?.trim() ?? "";
    const image1 = formData.get("image1") as File | null;
    const image2 = formData.get("image2") as File | null;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID required." }, { status: 400 });
    }

    if (reason.length < 10 || reason.length > 2000) {
      return NextResponse.json(
        { error: "Reason must be 10-2000 characters." },
        { status: 400 }
      );
    }

    if (!image1 || image1.size === 0) {
      return NextResponse.json(
        { error: "At least one image is required." },
        { status: 400 }
      );
    }

    if (image1.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Images must be under 5MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(image1.type)) {
      return NextResponse.json(
        { error: "Images must be JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    const request = await prisma.mealRequest.findUnique({
      where: { id: requestId },
      include: { fulfillment: true, payment: true, dispute: true },
    });

    if (!request || request.requesterId !== session.userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (request.dispute) {
      return NextResponse.json(
        { error: "A dispute already exists for this order." },
        { status: 400 }
      );
    }

    if (!["PAID", "CONFIRMED"].includes(request.status)) {
      return NextResponse.json(
        { error: "This order cannot be disputed." },
        { status: 400 }
      );
    }

    const payment = request.payment;
    if (!payment || !["HELD", "RELEASED"].includes(payment.status)) {
      return NextResponse.json(
        { error: "This order cannot be disputed." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "disputes");
    await mkdir(uploadDir, { recursive: true });

    const ext1 = path.extname(image1.name) || ".jpg";
    const filename1 = `dispute-${requestId}-1-${Date.now()}${ext1}`;
    const filepath1 = path.join(uploadDir, filename1);
    const publicPath1 = `/uploads/disputes/${filename1}`;
    await writeFile(filepath1, Buffer.from(await image1.arrayBuffer()));

    let publicPath2: string | null = null;
    if (image2 && image2.size > 0) {
      if (image2.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Second image must be under 5MB." },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.includes(image2.type)) {
        return NextResponse.json(
          { error: "Second image must be JPEG, PNG, WebP, or GIF." },
          { status: 400 }
        );
      }
      const ext2 = path.extname(image2.name) || ".jpg";
      const filename2 = `dispute-${requestId}-2-${Date.now()}${ext2}`;
      const filepath2 = path.join(uploadDir, filename2);
      publicPath2 = `/uploads/disputes/${filename2}`;
      await writeFile(filepath2, Buffer.from(await image2.arrayBuffer()));
    }

    await prisma.dispute.create({
      data: {
        requestId,
        requesterId: session.userId,
        reason,
        image1Path: publicPath1,
        image2Path: publicPath2,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Dispute create error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
