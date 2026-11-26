import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export const metadata = {
  title: "My Orders",
  description: "View and track your ZicZo Mart orders.",
};

export const instant = false;

export default async function MyOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/orders");

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`id, order_number, status, payment_method, payment_status,
             total, currency, created_at, order_items(id)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load your orders.");

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            <Breadcrumb
              items={[
                { label: "My Account", href: "/account" },
                { label: "My Orders" },
              ]}
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  My Orders
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {orders?.length ?? 0} order{orders?.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500"
              >
                <ArrowLeft size={14} /> My Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {!orders || orders.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                <ShoppingBag size={28} className="text-orange-400" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">
                No orders yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your purchases will appear here after you place an order.
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
              >
                Start Shopping <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                        <Package size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {order.order_number}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-LK",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Items
                      </p>
                      <p className="mt-1 font-semibold text-gray-800">
                        {order.order_items.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Payment
                      </p>
                      <p className="mt-1 font-semibold uppercase text-gray-800">
                        {order.payment_method}
                      </p>
                      <PaymentStatusBadge
                        status={order.payment_status}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Total
                      </p>
                      <p className="mt-1 font-bold text-gray-900">
                        {formatPrice(Number(order.total))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
