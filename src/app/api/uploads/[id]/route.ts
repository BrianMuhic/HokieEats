import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/uploads/[id]
 * Serves images stored in the database. Works on Cloudflare (no filesystem needed).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const upload = await prisma.upload.findUnique({
    where: { id },
  });

  if (!upload) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(upload.data), {
    headers: {
      "Content-Type": upload.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
