import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <header className="bg-[#861F41] text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">VT Eating</h1>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-white/90 hover:text-white font-medium">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-[#E87722] hover:bg-[#d96a1a] px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-[#861F41] mb-4">
          Get VT Dining, Delivered.
        </h2>
        <p className="text-lg text-stone-600 max-w-xl mb-8">
          Request a meal from any Virginia Tech dining hall, or fulfill orders
          and earn $5 per delivery. Only @vt.edu emails.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/sign-up"
            className="bg-[#861F41] hover:bg-[#6B2D3C] text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="border-2 border-[#861F41] text-[#861F41] hover:bg-[#861F41]/5 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 gap-8 max-w-2xl text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="font-semibold text-[#861F41] mb-2">Request a Meal</h3>
            <p className="text-stone-600 text-sm">
              Pick your dining hall & restaurant, describe your meal, pay $6. A
              fellow Hokie delivers it.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="font-semibold text-[#E87722] mb-2">Fulfill Orders</h3>
            <p className="text-stone-600 text-sm">
              Browse open requests, pick up food, deliver it. Earn $5 per order.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-stone-500 text-sm">
        © VT Eating — Virginia Tech Dining Services partner
      </footer>
    </div>
  );
}
