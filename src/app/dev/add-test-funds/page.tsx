import { redirect } from "next/navigation";
import Link from "next/link";
import AddTestFundsClient from "./AddTestFundsClient";

export default async function AddTestFundsPage() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key.startsWith("sk_test_")) {
    redirect("/fulfiller-earnings");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-vt-maroon text-white px-6 py-4">
        <Link href="/fulfiller-earnings" className="text-xl font-bold">
          VT Eating
        </Link>
      </header>

      <main className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-orange mb-2">
          Add Test Funds
        </h1>
        <p className="text-stone-600 mb-6">
          In test mode, the platform needs available balance to transfer to
          fulfillers. Use card{" "}
          <code className="bg-stone-200 px-1 rounded">4000000000000077</code> to
          add funds directly to your Stripe balance.
        </p>

        <AddTestFundsClient />
      </main>
    </div>
  );
}
