import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MyOrdersClient from "./MyOrdersClient";

export default async function MyOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const [myRequests, myFulfillments] = await Promise.all([
    prisma.mealRequest.findMany({
      where: { requesterId: session.userId },
      include: { fulfillment: true, payment: true, dispute: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fulfillment.findMany({
      where: { fulfillerId: session.userId },
      include: { request: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
        <h1 className="text-2xl font-bold text-vt-maroon mb-8">My Orders</h1>

        <MyOrdersClient
          requests={myRequests.map((r) => ({
            id: r.id,
            diningHall: r.diningHall,
            restaurant: r.restaurant,
            mealDescription: r.mealDescription,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            fulfillment: r.fulfillment
              ? {
                  id: r.fulfillment.id,
                  status: r.fulfillment.status,
                  orderConfirmationPath: r.fulfillment.orderConfirmationPath,
                  estimatedWaitTime: r.fulfillment.estimatedWaitTime,
                  requesterConfirmedAt: r.fulfillment.requesterConfirmedAt?.toISOString() ?? null,
                }
              : null,
            payment: r.payment
              ? {
                  id: r.payment.id,
                  status: r.payment.status,
                }
              : null,
            dispute: r.dispute
              ? { id: r.dispute.id, status: r.dispute.status }
              : null,
          }))}
          fulfillments={myFulfillments.map((f) => ({
            id: f.id,
            requestId: f.requestId,
            diningHall: f.request.diningHall,
            restaurant: f.request.restaurant,
            mealDescription: f.request.mealDescription,
            status: f.status,
            createdAt: f.createdAt.toISOString(),
            orderConfirmationPath: f.orderConfirmationPath,
            estimatedWaitTime: f.estimatedWaitTime,
          }))}
        />
      </main>
    </div>
  );
}
