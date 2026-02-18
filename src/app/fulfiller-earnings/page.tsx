import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import FulfillerEarningsClient from "./FulfillerEarningsClient";
import { prisma } from "@/lib/db";
import { FULFILLER_AMOUNT_CENTS } from "@/lib/stripe";

export default async function FulfillerEarningsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  let balanceData: {
    totalEarnedCents: number;
    totalTransferredCents: number;
    availableToTransferCents: number;
    hasConnectedAccount: boolean;
    earnings: Array<{
      id: string;
      requestId: string;
      diningHall: string;
      restaurant: string;
      mealDescription: string;
      amountCents: number;
      confirmedAt: Date | null;
    }>;
    payouts: Array<{
      id: string;
      amountCents: number;
      createdAt: Date;
    }>;
  };

  try {
    const [earnings, payouts, user] = await Promise.all([
      prisma.fulfillment.findMany({
        where: {
          fulfillerId: session.userId,
          status: "CONFIRMED",
          request: { payment: { status: "RELEASED" } },
        },
        include: {
          request: {
            select: {
              diningHall: true,
              restaurant: true,
              mealDescription: true,
              id: true,
            },
          },
        },
        orderBy: { requesterConfirmedAt: "desc" },
      }),
      prisma.fulfillerPayout.findMany({
        where: { fulfillerId: session.userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { stripeConnectAccountId: true },
      }),
    ]);

    const totalEarnedCents = earnings.length * FULFILLER_AMOUNT_CENTS;
    const totalTransferredCents = payouts.reduce((sum, p) => sum + p.amountCents, 0);
    const availableToTransferCents = totalEarnedCents - totalTransferredCents;

    balanceData = {
      totalEarnedCents,
      totalTransferredCents,
      availableToTransferCents,
      hasConnectedAccount: !!user?.stripeConnectAccountId,
      earnings: earnings.map((e) => ({
        id: e.id,
        requestId: e.requestId,
        diningHall: e.request.diningHall,
        restaurant: e.request.restaurant,
        mealDescription: e.request.mealDescription,
        amountCents: FULFILLER_AMOUNT_CENTS,
        confirmedAt: e.requesterConfirmedAt,
      })),
      payouts: payouts.map((p) => ({
        id: p.id,
        amountCents: p.amountCents,
        createdAt: p.createdAt,
      })),
    };
  } catch (err) {
    console.error("Fulfiller earnings page error:", err);
    throw err;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-vt-maroon text-white px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">
          VT Eating
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/fulfill-orders" className="text-white/80 hover:text-white text-sm">
            Fulfill Orders
          </Link>
          <Link href="/dashboard" className="text-white/80 hover:text-white text-sm">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-orange mb-2">My Earnings</h1>
        <p className="text-stone-600 mb-8">
          Track your fulfiller income and transfer money to your bank account.
        </p>

        <FulfillerEarningsClient
          initialData={balanceData}
          isTestMode={(process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_")}
        />
      </main>
    </div>
  );
}
