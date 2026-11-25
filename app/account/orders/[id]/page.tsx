import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CheckCircle,
  Package,
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  XCircle,
} from "lucide-react";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
};

const trackingSteps = [
  {
    status: "pending",
    title: "Order Placed",
    description: "Your order has been successfully received.",
  },
  {
    status: "processing",
    title: "Processing",
    description: "We are preparing your order.",
  },
  {
    status: "shipped",
    title: "Shipped",
    description: "Your order is on its way.",
  },
  {
    status: "delivered",
    title: "Delivered",
    description: "Your order has been successfully delivered.",
  },
];

export default async function OrderDetailsPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { placed } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_method,
      payment_status,
      subtotal,
      shipping_fee,
      discount,
      total,
      currency,
      shipping_full_name,
      shipping_phone,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_city,
      shipping_district,
      shipping_postal_code,
      created_at,
      order_items (
        id,
        product_name,
        product_sku,
        unit_price,
        quantity,
        line_total
      )
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !order) {
    notFound();
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

  const currentStepIndex = trackingSteps.findIndex(
    (step) => step.status === order.status,
  );

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

      <section className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/account"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          Back to Account
        </Link>

        {placed === "1" && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={28} />
              <div>
                <h1 className="text-xl font-bold text-green-800">
                  Order placed successfully!
                </h1>
                <p className="mt-1 text-sm text-green-700">
                  Thank you for shopping with ZicZo Mart.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold uppercase tracking-wider text-orange-500">
                Order Details
              </p>

              <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                {order.order_number}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Placed on {new Date(order.created_at).toLocaleString("en-LK")}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getStatusColor(order.status)}`}
            >
              {order.status}
            </span>
          </div>

          {/* Order Tracking Timeline */}
          <div className="my-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Truck className="text-orange-500" size={24} />
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Track Your Order
                </h3>
                <p className="text-sm text-gray-500">
                  Follow your order's progress.
                </p>
              </div>
            </div>

            {order.status === "cancelled" ? (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <XCircle className="mt-0.5 shrink-0 text-red-600" size={24} />
                <div>
                  <p className="font-bold text-red-800">Order Cancelled</p>
                  <p className="mt-1 text-sm text-red-700">
                    This order has been cancelled. Please contact our store if
                    you need assistance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {trackingSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isLast = index === trackingSteps.length - 1;

                  return (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : isCurrent
                                ? "bg-orange-500 text-white ring-4 ring-orange-100"
                                : "border-2 border-gray-300 bg-white text-gray-400"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle size={20} />
                          ) : (
                            <span className="text-sm font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {!isLast && (
                          <div
                            className={`my-1 min-h-10 w-0.5 ${
                              isCompleted ? "bg-green-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>

                      <div className="pb-8">
                        <p
                          className={`font-bold ${
                            isCompleted
                              ? "text-green-700"
                              : isCurrent
                                ? "text-orange-600"
                                : "text-gray-400"
                          }`}
                        >
                          {step.title}
                          {isCurrent && (
                            <span className="ml-2 text-xs font-semibold">
                              (Current)
                            </span>
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="my-8 border-t border-gray-100" />

          <div className="mb-6 flex items-center gap-3">
            <Package className="text-orange-500" />
            <h3 className="text-xl font-bold">Ordered Products</h3>
          </div>

          <div className="space-y-5">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap justify-between gap-4 border-b border-gray-100 pb-5"
              >
                <div>
                  <p className="font-bold text-gray-900">{item.product_name}</p>

                  {item.product_sku && (
                    <p className="mt-1 text-xs text-gray-400">
                      SKU: {item.product_sku}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-gray-500">
                    Rs. {formatMoney(item.unit_price)} × {item.quantity}
                  </p>
                </div>

                <p className="font-bold text-gray-900">
                  Rs. {formatMoney(item.line_total)}
                </p>
              </div>
            ))}
          </div>

          <div className="my-8 border-t border-gray-100" />

          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {formatMoney(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>Rs. {formatMoney(order.shipping_fee)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>Rs. {formatMoney(order.discount)}</span>
            </div>

            <div className="flex justify-between border-t border-gray-100 pt-4 text-xl font-extrabold">
              <span>Total</span>
              <span>
                {order.currency} {formatMoney(order.total)}
              </span>
            </div>
          </div>

          <div className="my-8 border-t border-gray-100" />

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <MapPin className="text-orange-500" />
                <h3 className="font-bold">Delivery Address</h3>
              </div>

              <div className="space-y-1 text-sm leading-6 text-gray-600">
                <p className="font-semibold text-gray-900">
                  {order.shipping_full_name}
                </p>
                <p>{order.shipping_phone}</p>
                <p>{order.shipping_address_line_1}</p>

                {order.shipping_address_line_2 && (
                  <p>{order.shipping_address_line_2}</p>
                )}

                <p>
                  {order.shipping_city}
                  {order.shipping_district
                    ? `, ${order.shipping_district}`
                    : ""}
                </p>

                {order.shipping_postal_code && (
                  <p>{order.shipping_postal_code}</p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center gap-3">
                <CreditCard className="text-orange-500" />
                <h3 className="font-bold">Payment Information</h3>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Method:{" "}
                  <span className="font-semibold uppercase text-gray-900">
                    {order.payment_method}
                  </span>
                </p>

                <p>
                  Payment Status:{" "}
                  <span className="font-semibold capitalize text-gray-900">
                    {order.payment_status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/products"
            className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Continue Shopping
          </Link>

          <Link
            href="/account"
            className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            My Account
          </Link>
        </div>
      </section>
    </main>
  );
}
