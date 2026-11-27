import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import OrderItemReviewAction from "@/components/orders/order-item-review-action";
import CancelOrderButton from "@/components/orders/cancel-order-button";
import OrderRealtimeSync from "@/components/orders/order-realtime-sync";
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

  let { data: order, error } = await supabase
    .from("orders")
    .select(`id, order_number, status, payment_method, payment_status,
             subtotal, shipping_fee, discount, total, currency,
             shipping_full_name, shipping_phone,
             shipping_address_line_1, shipping_address_line_2,
             shipping_city, shipping_district, shipping_postal_code,
             cancellation_reason, cancelled_at, cancelled_by, confirmed_at, refund_status,
             created_at,
             order_items(id, product_id, product_name, product_sku, unit_price, quantity, line_total,
               products(slug, product_images(storage_path, sort_order)))`)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && error.message.includes("column")) {
    const fallback = await supabase
      .from("orders")
      .select(`id, order_number, status, payment_method, payment_status,
               subtotal, shipping_fee, discount, total, currency,
               shipping_full_name, shipping_phone,
               shipping_address_line_1, shipping_address_line_2,
               shipping_city, shipping_district, shipping_postal_code,
               created_at,
               order_items(id, product_id, product_name, product_sku, unit_price, quantity, line_total,
                 products(slug, product_images(storage_path, sort_order)))`)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    order = fallback.data as typeof order;
    error = fallback.error;
  }

  if (error || !order) notFound();

  const productIds = (order.order_items ?? [])
    .map((i) => i.product_id)
    .filter((pid): pid is string => Boolean(pid));

  const reviewStatusMap = new Map<
    string,
    "pending" | "approved" | "rejected"
  >();
  if (productIds.length > 0) {
    const { data: userReviews } = await supabase
      .from("reviews")
      .select("product_id, is_published")
      .eq("user_id", user.id)
      .in("product_id", productIds);

    for (const r of userReviews ?? []) {
      reviewStatusMap.set(
        r.product_id,
        r.is_published ? "approved" : "pending",
      );
    }
  }

  const currentStepIndex = TRACKING_STEPS.findIndex(
    (s) => s.status === order.status,
  );
  const isCancelled = order.status === "cancelled";

  const extOrder = order as typeof order & {
    cancellation_reason?: string | null;
    cancelled_at?: string | null;
    cancelled_by?: string | null;
    confirmed_at?: string | null;
    refund_status?: string | null;
  };

  return (
    <>
      <OrderRealtimeSync orderId={order.id} />
      <Header />

      <main className="min-h-screen bg-[#F8FAFC]">
        {/* Header */}
        <div className="border-b border-[#E2E8F0] bg-white">
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
                <h1 className="text-xl font-extrabold text-[#0F172A] sm:text-2xl">
                  {order.order_number}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString("en-LK", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <OrderStatusBadge status={order.status} />
                <CancelOrderButton
                  orderId={order.id}
                  orderNumber={order.order_number}
                  status={order.status}
                  paymentStatus={order.payment_status}
                />
              </div>
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
              <div className="space-y-4">
                <div className="relative">
                  {/* Step 1: Order Placed */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
                        <CheckCircle size={16} />
                      </div>
                      <div className="my-1 min-h-8 w-0.5 flex-1 bg-red-300" />
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Order Placed
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleString("en-LK")}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Cancelled */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-white ring-4 ring-red-100">
                        <XCircle size={16} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#DC2626]">
                        Cancelled
                        {extOrder.cancelled_by && (
                          <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
                            By {extOrder.cancelled_by === "customer" ? "Customer" : "Admin"}
                          </span>
                        )}
                      </p>
                      {extOrder.cancelled_at && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(extOrder.cancelled_at).toLocaleString("en-LK")}
                        </p>
                      )}
                      {extOrder.cancellation_reason && (
                        <p className="mt-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-slate-700">
                          Reason: {extOrder.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {extOrder.refund_status === "pending_review" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-800">
                    Payment Status: Paid · <span className="font-bold">Refund pending review</span>
                  </div>
                )}
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
                          current ? "bg-[#2563EB] text-white ring-4 ring-blue-100" :
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
                          done ? "text-green-700" : current ? "text-[#2563EB]" : "text-gray-400"
                        }`}>
                          {step.title}
                          {current && <span className="ml-2 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-xs text-[#2563EB]">Current</span>}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{step.desc}</p>
                        {step.status === "confirmed" && extOrder.confirmed_at && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Confirmed on {new Date(extOrder.confirmed_at).toLocaleString("en-LK")}
                          </p>
                        )}
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
              {order.order_items.map((item) => {
                const prodRaw = item.products as
                  | {
                      slug: string;
                      product_images: {
                        storage_path: string;
                        sort_order: number;
                      }[];
                    }
                  | {
                      slug: string;
                      product_images: {
                        storage_path: string;
                        sort_order: number;
                      }[];
                    }[]
                  | null;
                const prod = Array.isArray(prodRaw) ? prodRaw[0] : prodRaw;
                const sortedImgs = [...(prod?.product_images ?? [])].sort(
                  (a, b) => a.sort_order - b.sort_order,
                );
                const imgUrl = sortedImgs[0]
                  ? supabase.storage
                      .from("product-images")
                      .getPublicUrl(sortedImgs[0].storage_path).data.publicUrl
                  : null;
                const existingReviewStatus = item.product_id
                  ? reviewStatusMap.get(item.product_id) ?? null
                  : null;

                return (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 py-4"
                  >
                    <div>
                      {prod?.slug ? (
                        <Link
                          href={`/products/${prod.slug}`}
                          className="font-semibold text-gray-900 hover:text-[#2563EB]"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-900">
                          {item.product_name}
                        </p>
                      )}
                      {item.product_sku && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          SKU: {item.product_sku}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        {formatPrice(Number(item.unit_price))} ×{" "}
                        {item.quantity}
                      </p>
                      <OrderItemReviewAction
                        orderId={order.id}
                        orderItemId={item.id}
                        orderStatus={order.status}
                        productId={item.product_id}
                        productName={item.product_name}
                        productImageUrl={imgUrl}
                        existingReviewStatus={existingReviewStatus}
                      />
                    </div>
                    <p className="flex-shrink-0 font-bold text-gray-900">
                      {formatPrice(Number(item.line_total))}
                    </p>
                  </div>
                );
              })}
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
