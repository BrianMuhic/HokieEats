import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-vt-maroon text-white px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">
          VT Eating
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-sm">{session.email}</span>
          <form action="/api/auth/sign-out" method="POST">
            <button type="submit" className="text-white/80 hover:text-white text-sm">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-maroon mb-2">What would you like to do?</h1>
        <p className="text-stone-600 mb-8">
          Choose to request a meal or fulfill an order to earn $5.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          <Link
            href="/request-meal"
            className="block p-8 bg-white rounded-xl border-2 border-stone-200 hover:border-vt-maroon hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-vt-maroon mb-2">Request a Meal</h2>
            <p className="text-stone-600 text-sm">
              Pick a dining hall, choose a restaurant, describe your meal. $6 total.
            </p>
          </Link>
          <Link
            href="/fulfill-orders"
            className="block p-8 bg-white rounded-xl border-2 border-stone-200 hover:border-vt-orange hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-xl font-semibold text-vt-orange mb-2">Fulfill Orders</h2>
            <p className="text-stone-600 text-sm">
              Browse open requests, pick up & deliver. Earn $5 per order.
            </p>
          </Link>
        </div>

        <div className="mt-12">
          <Link
            href="/my-orders"
            className="text-vt-maroon font-medium hover:underline"
          >
            View my orders →
          </Link>
        </div>
      </main>
    </div>
  );
}
