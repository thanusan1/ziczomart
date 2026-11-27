import { createClient } from "@/lib/supabase/server";
import { ShoppingCart } from "lucide-react";
import AdminOrdersClient, {
  type AdminOrderListRow,
} from "./admin-orders-client";

export const instant = false;

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  let { data: ordersRaw, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_method,
      payment_status,
      refund_status,
      total,
      currency,
      shipping_full_name,
      shipping_phone,
      shipping_city,
      shipping_district,
      cancellation_reason,
      cancelled_at,
      cancelled_by,
      created_at,
      order_items (
        id,
        product_name,
        quantity
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error && error.message.includes("column")) {
    const fallback = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        user_id,
        status,
        payment_method,
        payment_status,
        total,
        currency,
        shipping_full_name,
        shipping_phone,
        shipping_city,
        shipping_district,
        created_at,
        order_items (
          id,
          product_name,
          quantity
        )
      `,
      )
      .order("created_at", { ascending: false });
    ordersRaw = fallback.data as typeof ordersRaw;
    error = fallback.error;
  }

  if (error) {
    throw new Error("Could not load orders: " + error.message);
  }

  type RawAdminOrderRow = {
    id: string;
    order_number: string;
    status: string;
    payment_method: string;
    payment_status: string;
    refund_status?: string | null;
    total: number | string;
    currency: string;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_city: string;
    shipping_district?: string | null;
    created_at: string;
    cancellation_reason?: string | null;
    cancelled_at?: string | null;
    cancelled_by?: string | null;
    order_items:
      | {
          id: string;
          product_name?: string;
          quantity?: number;
        }[]
      | null;
  };

  const orders: AdminOrderListRow[] = ((ordersRaw ?? []) as RawAdminOrderRow[]).map((o) => {
    const items = o.order_items ?? [];
    const first = items[0];
    const productSummary = first
      ? `${first.product_name ?? "Product"} × ${first.quantity ?? 1}${
          items.length > 1 ? ` + ${items.length - 1} more` : ""
        }`
      : "No items";

    return {
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      refund_status: o.refund_status ?? "none",
      total: Number(o.total),
      currency: o.currency,
      shipping_full_name: o.shipping_full_name,
      shipping_phone: o.shipping_phone,
      shipping_city: o.shipping_city,
      shipping_district: o.shipping_district ?? null,
      created_at: o.created_at,
      cancellation_reason: o.cancellation_reason ?? null,
      cancelled_at: o.cancelled_at ?? null,
      cancelled_by: o.cancelled_by ?? null,
      itemCount: items.length,
      productSummary,
    };
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold uppercase tracking-wider text-[#2563EB]">
            Store Management
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#0F172A]">
            Customer Orders
          </h1>
          <p className="mt-2 text-slate-500">
            View, filter, and manage all orders placed through ZicZo Mart.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 shadow-xs">
          <ShoppingCart className="text-[#2563EB]" size={22} />
          <div>
            <p className="text-xs text-slate-500">Total Orders</p>
            <p className="text-xl font-extrabold text-[#0F172A]">
              {orders.length}
            </p>
          </div>
        </div>
      </div>

      <AdminOrdersClient orders={orders} />
    </div>
  );
}
