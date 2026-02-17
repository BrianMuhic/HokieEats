import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import RequestMealForm from "./RequestMealForm";

export default async function RequestMealPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

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

      <main className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-maroon mb-2">Request a Meal</h1>
        <p className="text-stone-600 mb-8">
          Select your dining hall and restaurant, then describe what you&apos;d like. $6 per meal.
        </p>

        <RequestMealForm userId={session.userId} />
      </main>
    </div>
  );
}
