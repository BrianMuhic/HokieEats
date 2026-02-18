import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";

/**
 * GET /api/admin/check
 * Returns whether current user is admin.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ isAdmin: false });
  }
  return NextResponse.json({ isAdmin: isAdmin(session.email) });
}
