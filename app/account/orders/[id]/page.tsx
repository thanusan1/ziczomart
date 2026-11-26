import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle,
  Package,
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  XCircle,
  ShoppingBag,
} from "lucide-react";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
};

const TRACKING_STEPS = [
  { status: "pending", title: "Order Placed", desc: "Your order has been received." },
  { status: "confirmed", title: "Confirmed", desc: "Your order has been confirmed." },
  { status: "processing", title: "Processing", desc: "We are preparing your order." },
  { status: "shipped", title: "Shipped", desc: "Your order is on its way." },
  { status: "delivered", title: "Delivered", desc: "Order delivered successfully." },
];

export default async function OrderDetailsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { placed } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select(`id, order_number, status, payment_method, payment_status,
             subtotal, shipping_fee, discount, total, currency,
             shipping_full_name, shipping_phone,
             shipping_address_line_1, shipping_address_line_2,
             shipping_city, shipping_district, shipping_postal_code,
             created_at,
             order_items(id, product_name, product_sku, unit_price, quantity, line_total)`)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !order) notFound();

  const currentStepIndex = TRACKING_STEPS.findIndex(
    (s) => s.status === order.status,
  );
  const isCancelled = order.status === "cancelled";

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            <Breadcrumb
              items={[
                { label: "My Account", href: "/account" },
                { label: "My Orders", href: "/account/orders" },
                { label: order.order_number },
              ]}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                  {order.order_number}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString("en-LK", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
          {/* Order placed success banner */}
          {placed === "1" && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
              <CheckCircle size={22} className="mt-0.5 flex-shrink-0 text-green-600" />
              <div>
                <p className="font-bold text-green-800">Order placed successfully!</p>
                <p className="mt-1 text-sm text-green-700">
                  Thank you for shopping with ZicZo Mart. We&apos;ll process your order shortly.
                </p>
              </div>
            </div>
          )}

          {/* Order Tracking */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Truck size={16} className="text-orange-500" />
              </div>
              <h2 className="font-bold text-gray-900">Order Tracking</h2>
            </div>

            {isCancelled ? (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <XCircle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-bold text-red-800">Order Cancelled</p>
                  <p className="mt-1 text-sm text-red-600">
                    This order has been cancelled. Contact us if you need assistance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {TRACKING_STEPS.map((step, i) => {
                  const done = i < currentStepIndex;
                  const current = i === currentStepIndex;
                  const isLast = i === TRACKING_STEPS.length - 1;
                  return (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                          done ? "bg-green-500 text-white" :
                          current ? "bg-orange-500 text-white ring-4 ring-orange-100" :
                          "border-2 border-gray-200 bg-white text-gray-400"
                        }`}>
                          {done ? <CheckCircle size={16} /> : i + 1}
                        </div>
                        {!isLast && (
                          <div className={`my-1 w-0.5 flex-1 min-h-8 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`text-sm font-semibold ${
                          done ? "text-green-700" : current ? "text-orange-600" : "text-gray-400"
                        }`}>
                          {step.title}
                          {current && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">Current</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                <Package size={16} className="text-orange-500" />
              </div>
              <h2 className="font-bold text-gray-900">Ordered Items</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    {item.product_sku && (
                      <p className="mt-0.5 text-xs text-gray-400">SKU: {item.product_sku}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(Number(item.unit_price))} × {item.quantity}
                    </p>
                  </div>
                  <p className="flex-shrink-0 font-bold text-gray-900">
                    {formatPrice(Number(item.line_total))}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>{formatPrice(Number(order.shipping_fee))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 font-extrabold text-gray-900">
                <span>Total</span>
                <span className="text-lg">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Delivery + Payment */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Delivery */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <MapPin size={16} className="text-green-500" />
                </div>
                <h2 className="font-bold text-gray-900">Delivery Address</h2>
              </div>
              <div className="space-y-1 text-sm leading-6 text-gray-600">
                <p className="font-semibold text-gray-900">{order.shipping_full_name}</p>
                <p>{order.shipping_phone}</p>
                <p>{order.shipping_address_line_1}</p>
                {order.shipping_address_line_2 && <p>{order.shipping_address_line_2}</p>}
                <p>{order.shipping_city}{order.shipping_district ? `, ${order.shipping_district}` : ""}</p>
                {order.shipping_postal_code && <p>{order.shipping_postal_code}</p>}
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <CreditCard size={16} className="text-blue-500" />
                </div>
                <h2 className="font-bold text-gray-900">Payment</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Method</p>
                  <p className="mt-1 font-semibold uppercase text-gray-800">{order.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</p>
                  <div className="mt-1">
                    <PaymentStatusBadge status={order.payment_status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600">
              <ShoppingBag size={15} /> Continue Shopping
            </Link>
            <Link href="/account/orders" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">
              <ArrowLeft size={15} /> All Orders
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
