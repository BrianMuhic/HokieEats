import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FulfillOrdersClient from "./FulfillOrdersClient";

export default async function FulfillOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  let pendingRequests: Array<{
    id: string;
    diningHall: string;
    restaurant: string;
    mealDescription: string;
    createdAt: Date;
    reservedById: string | null;
    reservedAt: Date | null;
    requester: { email: string };
  }>;
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    pendingRequests = await prisma.mealRequest.findMany({
      where: {
        status: "PENDING",
        requesterId: { not: session.userId },
        OR: [
          { reservedById: null },
          { reservedById: session.userId },
          { reservedAt: { lt: fiveMinutesAgo } },
        ],
      },
      select: {
        id: true,
        diningHall: true,
        restaurant: true,
        mealDescription: true,
        createdAt: true,
        reservedById: true,
        reservedAt: true,
        requester: { select: { email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    console.error("Fulfill orders DB error:", err);
    throw err;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-vt-maroon text-white px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">
          VT Eating
        </Link>
        <Link href="/dashboard" className="text-white/80 hover:text-white text-sm">
          ← Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-orange mb-2">Fulfill Orders</h1>
        <p className="text-stone-600 mb-8">
          Place the order at the dining hall, upload your confirmation screenshot, and earn $5. Orders are reserved for 5 minutes when you start claiming.
        </p>

        <FulfillOrdersClient
          requests={pendingRequests.map((r) => ({
            id: r.id,
            diningHall: r.diningHall,
            restaurant: r.restaurant,
            mealDescription: r.mealDescription,
            createdAt: r.createdAt.toISOString(),
            requesterEmail: r.requester?.email ?? "",
            reservedAt: r.reservedAt?.toISOString() ?? null,
            reservedByMe: r.reservedById === session.userId,
          }))}
        />
      </main>
    </div>
  );
}
