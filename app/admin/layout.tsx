import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/admin" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
            <span className="ml-2 text-sm font-semibold text-gray-400">
              Admin
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-orange-500"
          >
            View Store →
          </Link>
        </div>

        <nav className="border-t border-gray-100">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-6 px-6 py-4 text-sm font-medium">
            <Link href="/admin" className="hover:text-orange-500">
              Dashboard
            </Link>
            <Link href="/admin/products" className="hover:text-orange-500">
              Products
            </Link>
            <Link href="/admin/categories" className="hover:text-orange-500">
              Categories
            </Link>
            <Link href="/admin/orders" className="hover:text-orange-500">
              Orders
            </Link>
            <Link href="/admin/customers" className="hover:text-orange-500">
              Customers
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
