import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingBag, ArrowRight, ClipboardList } from "lucide-react";

export const instant = false;

export default async function MyOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/orders");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_method,
      payment_status,
      total,
      currency,
      created_at,
      order_items (
        id
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load your orders.");
  }

  const formatMoney = (amount: number) =>
    Number(amount).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      case "shipped":
        return "bg-blue-50 text-blue-700";
      case "processing":
        return "bg-purple-50 text-purple-700";
      default:
        return "bg-yellow-50 text-yellow-700";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/account"
            className="text-sm font-semibold text-gray-600 hover:text-orange-500"
          >
            My Account
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-semibold uppercase tracking-wider text-orange-500">
            Your Shopping Activity
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
            My Orders
          </h1>
          <p className="mt-3 text-gray-500">
            View and track all your ZicZo Mart purchases.
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
              <ShoppingBag size={36} className="text-orange-500" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="mt-3 text-gray-500">
              Your purchases will appear here after you place an order.
            </p>

            <Link
              href="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Package className="text-orange-500" size={22} />
                      <h2 className="text-lg font-bold text-gray-900">
                        {order.order_number}
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString("en-LK")}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Products
                    </p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {order.order_items.length} item(s)
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Payment
                    </p>
                    <p className="mt-1 font-semibold uppercase text-gray-900">
                      {order.payment_method}
                    </p>
                    <p className="text-xs capitalize text-gray-500">
                      {order.payment_status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase text-gray-400">
                      Order Total
                    </p>
                    <p className="mt-1 font-bold text-gray-900">
                      {order.currency} {formatMoney(order.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500"
                  >
                    View Order Details
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500"
          >
            <ClipboardList size={17} />
            Back to My Account
          </Link>
        </div>
      </section>
    </main>
  );
}
