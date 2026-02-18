import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PayForm from "./PayForm";

export default async function PayPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { requestId } = await params;

  const request = await prisma.mealRequest.findUnique({
    where: { id: requestId },
    include: { payment: true, fulfillment: true },
  });

  if (!request || request.requesterId !== session.userId) {
    redirect("/my-orders");
  }

  const payment = request.payment;
  if (!payment) redirect("/my-orders");
  if (payment.status === "PRE_AUTHORIZED" || payment.status === "HELD") {
    redirect("/my-orders");
  }
  if (payment.status !== "PENDING") {
    redirect("/my-orders");
  }

  const isPreAuth = !request.fulfillment;
  const title = isPreAuth ? "Authorize Payment" : "Complete Payment";
  const subtitle = isPreAuth
    ? `Your card will be held for $6. You'll only be charged when a fulfiller submits proof that your order from ${request.diningHall} · ${request.restaurant} was placed. You can cancel before then to release the hold.`
    : `Your order from ${request.diningHall} · ${request.restaurant} has been placed. Pay $6 to complete.`;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-vt-maroon text-white px-6 py-4">
        <Link href="/my-orders" className="text-xl font-bold">
          VT Eating
        </Link>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-maroon mb-2">{title}</h1>
        <p className="text-stone-600 mb-6">{subtitle}</p>

        <PayForm requestId={requestId} isPreAuth={isPreAuth} />
      </main>
    </div>
  );
}
