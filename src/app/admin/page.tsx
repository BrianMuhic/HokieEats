import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!isAdmin(session.email)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-vt-maroon text-white px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold">
          VT Eating Admin
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/80 text-sm">{session.email}</span>
          <Link href="/dashboard" className="text-white/80 hover:text-white text-sm">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-vt-maroon mb-8">Admin Panel</h1>
        <AdminClient />
      </main>
    </div>
  );
}
