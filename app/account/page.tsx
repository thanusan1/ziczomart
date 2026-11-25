import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export const instant = false;

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Get the latest profile information from Supabase.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "Customer");

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold text-gray-900">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-orange-500"
          >
            Back to Store
          </Link>
        </div>
      </header>

      {/* Account Content */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-semibold uppercase tracking-widest text-orange-500">
            My Account
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            Welcome, {fullName}
          </h1>

          <p className="mt-2 text-gray-500">Manage your ZicZo Mart account.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Management */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900">
              Edit Personal Information
            </h2>

            <p className="mt-2 mb-6 text-sm text-gray-500">
              Update your name and manage your account details.
            </p>

            <ProfileForm fullName={fullName} email={user.email ?? ""} />

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900">Account Information</h3>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {user.email ?? "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Account ID</p>
                  <p className="mt-1 break-all text-sm font-medium text-gray-700">
                    {user.id}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {new Date(user.created_at).toLocaleDateString("en-LK")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Quick Links</h2>

            <div className="mt-6 space-y-4">
              <Link
                href="/account/orders"
                className="block rounded-lg border border-gray-200 px-4 py-3 font-medium transition hover:border-orange-500 hover:text-orange-500"
              >
                My Orders
              </Link>

              <Link
                href="/cart"
                className="block rounded-lg border border-gray-200 px-4 py-3 font-medium transition hover:border-orange-500 hover:text-orange-500"
              >
                My Cart
              </Link>

              <Link
                href="/products"
                className="block rounded-lg border border-gray-200 px-4 py-3 font-medium transition hover:border-orange-500 hover:text-orange-500"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
