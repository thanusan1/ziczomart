import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import ProfileForm from "./profile-form";
import {
  Package,
  MapPin,
  ShoppingCart,
  ShoppingBag,
  User,
  Calendar,
  Mail,
  Hash,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "My Account",
  description: "Manage your ZicZo Mart account.",
};

export const instant = false;

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "");

  const displayName = fullName || user.email?.split("@")[0] || "Customer";

  /* Order count */
  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const QUICK_LINKS = [
    {
      icon: Package,
      label: "My Orders",
      desc: `${orderCount ?? 0} order${orderCount === 1 ? "" : "s"}`,
      href: "/account/orders",
      color: "bg-blue-50 text-blue-500",
    },
    {
      icon: MapPin,
      label: "Saved Addresses",
      desc: "Manage delivery addresses",
      href: "/account/addresses",
      color: "bg-green-50 text-green-500",
    },
    {
      icon: ShoppingCart,
      label: "My Cart",
      desc: "View your shopping cart",
      href: "/cart",
      color: "bg-orange-50 text-orange-500",
    },
    {
      icon: ShoppingBag,
      label: "Continue Shopping",
      desc: "Browse our products",
      href: "/products",
      color: "bg-purple-50 text-purple-500",
    },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <Breadcrumb items={[{ label: "My Account" }]} />
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <span className="text-lg font-bold text-orange-600">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  Welcome back, {displayName}
                </h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Quick links grid */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${link.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-orange-500">
                      {link.label}
                    </p>
                    <p className="truncate text-xs text-gray-500">{link.desc}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto flex-shrink-0 text-gray-300 group-hover:text-orange-400" />
                </Link>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            {/* Profile form */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-3">
              <div className="mb-5 flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <h2 className="font-bold text-gray-900">Personal Information</h2>
              </div>
              <ProfileForm fullName={fullName} email={user.email ?? ""} />
            </div>

            {/* Account info */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-2">
              <h2 className="mb-5 font-bold text-gray-900">Account Details</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Mail size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</p>
                    <p className="mt-1 break-all text-sm font-medium text-gray-800">{user.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Member Since</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {new Date(user.created_at).toLocaleDateString("en-LK", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Hash size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account ID</p>
                    <p className="mt-1 break-all text-xs font-mono text-gray-500">{user.id}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-orange-50 p-3 text-xs text-orange-700">
                <span className="font-semibold">Total Orders:</span>{" "}
                {orderCount ?? 0}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
