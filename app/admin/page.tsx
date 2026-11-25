import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Package, ShoppingCart, Tags, ArrowRight } from "lucide-react";

export const instant = false;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: usersCount, error: usersError },
    { count: productsCount, error: productsError },
    { count: ordersCount, error: ordersError },
    { count: categoriesCount, error: categoriesError },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),

    supabase.from("products").select("*", { count: "exact", head: true }),

    supabase.from("orders").select("*", { count: "exact", head: true }),

    supabase.from("categories").select("*", { count: "exact", head: true }),
  ]);

  const hasError =
    usersError || productsError || ordersError || categoriesError;

  const stats = [
    {
      title: "Total Customers",
      value: usersCount,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      href: "/admin/customers",
    },
    {
      title: "Total Products",
      value: productsCount,
      icon: Package,
      color: "bg-orange-50 text-orange-600",
      href: "/admin/products",
    },
    {
      title: "Total Orders",
      value: ordersCount,
      icon: ShoppingCart,
      color: "bg-green-50 text-green-600",
      href: "/admin/orders",
    },
    {
      title: "Total Categories",
      value: categoriesCount,
      icon: Tags,
      color: "bg-purple-50 text-purple-600",
      href: "/admin/categories",
    },
  ];

  return (
    <div>
      {/* Page Heading */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
          Administration
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Manage your ZicZo Mart store from one place.
        </p>
      </div>

      {/* Database Error */}
      {hasError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load some dashboard statistics. Check your Supabase database
          permissions and table configuration.
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon size={23} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-gray-300 transition group-hover:text-orange-500"
                />
              </div>

              <p className="mt-5 text-sm font-medium text-gray-500">
                {stat.title}
              </p>

              <p className="mt-2 text-3xl font-extrabold text-gray-900">
                {stat.value ?? "—"}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>

        <p className="mt-1 text-sm text-gray-500">
          Quickly access your store management pages.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Manage Products",
              description: "Add and manage store products.",
              href: "/admin/products",
            },
            {
              title: "Manage Categories",
              description: "Organize your product categories.",
              href: "/admin/categories",
            },
            {
              title: "Manage Orders",
              description: "View and manage customer orders.",
              href: "/admin/orders",
            },
            {
              title: "View Customers",
              description: "View registered customer accounts.",
              href: "/admin/customers",
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-orange-300 hover:shadow-sm"
            >
              <h3 className="font-bold text-gray-900">{action.title}</h3>

              <p className="mt-2 text-sm text-gray-500">{action.description}</p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-500">
                Open <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
