import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  createConnectAccount,
  createAccountLink,
} from "@/lib/stripe";

/**
 * POST /api/fulfiller/connect/onboard
 * Creates or retrieves Stripe Connect Express account and returns onboarding link.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { returnUrl, refreshUrl } = await req.json();
    if (!returnUrl || !refreshUrl) {
      return NextResponse.json(
        { error: "returnUrl and refreshUrl are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { stripeConnectAccountId: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let accountId = user.stripeConnectAccountId;
    if (!accountId) {
      accountId = await createConnectAccount(user.email);
      await prisma.user.update({
        where: { id: session.userId },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const url = await createAccountLink(accountId, returnUrl, refreshUrl);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Stripe Connect onboard error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
