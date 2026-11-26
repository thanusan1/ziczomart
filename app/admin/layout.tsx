import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/layout/admin-nav";
import { ExternalLink } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="text-2xl font-extrabold text-gray-900">
              ZicZo<span className="text-orange-500">Mart</span>
            </span>
            <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold tracking-wider text-orange-600">
              ADMIN
            </span>
          </Link>

          {/* View Store */}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-orange-300 hover:text-orange-600"
          >
            <ExternalLink size={14} />
            View Store
          </Link>
        </div>

        {/* Active-state nav (client component) */}
        <AdminNav />
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
