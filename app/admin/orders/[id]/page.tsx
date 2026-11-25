import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import OrderStatusControls from "../order-status-controls";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailsPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      user_id,
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
      customer_note,
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

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold uppercase tracking-wider text-orange-500">
            Order Management
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            {order.order_number}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Order placed on {new Date(order.created_at).toLocaleString("en-LK")}
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${getStatusColor(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <Package className="text-orange-500" />
              <h2 className="text-xl font-bold">Ordered Products</h2>
            </div>

            <div className="space-y-5">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap justify-between gap-4 border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.product_name}
                    </p>

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
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="text-orange-500" />
              <h2 className="text-xl font-bold">Delivery Information</h2>
            </div>

            <div className="space-y-2 text-sm leading-6 text-gray-600">
              <p className="font-bold text-gray-900">
                {order.shipping_full_name}
              </p>

              <p>{order.shipping_phone}</p>
              <p>{order.shipping_address_line_1}</p>

              {order.shipping_address_line_2 && (
                <p>{order.shipping_address_line_2}</p>
              )}

              <p>
                {order.shipping_city}
                {order.shipping_district ? `, ${order.shipping_district}` : ""}
              </p>

              {order.shipping_postal_code && (
                <p>{order.shipping_postal_code}</p>
              )}
            </div>

            {order.customer_note && (
              <div className="mt-5 rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase text-gray-400">
                  Customer Note
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  {order.customer_note}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <OrderStatusControls
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.payment_status}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-bold">Order Summary</h2>

            <div className="space-y-3 text-sm">
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

              <div className="flex justify-between border-t border-gray-100 pt-4 text-lg font-extrabold text-gray-900">
                <span>Total</span>
                <span>
                  {order.currency} {formatMoney(order.total)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <CreditCard className="text-orange-500" />
              <h2 className="text-lg font-bold">Payment Details</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Payment Method</p>
                <p className="mt-1 font-bold uppercase">
                  {order.payment_method}
                </p>
              </div>

              <div>
                <p className="text-gray-400">Payment Status</p>
                <p className="mt-1 font-bold capitalize">
                  {order.payment_status}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">Order Information</h2>

            <p className="text-xs text-gray-400">Order ID</p>
            <p className="break-all text-xs text-gray-600">{order.id}</p>

            <p className="mt-4 text-xs text-gray-400">Customer ID</p>
            <p className="break-all text-xs text-gray-600">{order.user_id}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
