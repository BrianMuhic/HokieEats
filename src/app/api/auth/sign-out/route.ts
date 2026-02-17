import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(req: Request) {
  await deleteSession();
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.redirect(new URL("/", req.url));
}
