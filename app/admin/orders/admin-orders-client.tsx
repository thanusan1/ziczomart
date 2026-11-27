"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Package } from "lucide-react";
import OrderRealtimeSync from "@/components/orders/order-realtime-sync";
import { cn } from "@/lib/utils";

export type AdminOrderListRow = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  refund_status: string;
  total: number;
  currency: string;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_city: string;
  shipping_district: string | null;
  created_at: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  itemCount: number;
  productSummary: string;
};

const STATUS_TABS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

function getStatusBadgeClasses(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-50 text-[#16A34A] border border-green-200";
    case "cancelled":
      return "bg-red-50 text-[#DC2626] border border-red-200";
    case "confirmed":
      return "bg-[#EFF6FF] text-[#2563EB] border border-blue-200";
    case "shipped":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "processing":
      return "bg-purple-50 text-purple-700 border border-purple-200";
    default:
      return "bg-amber-50 text-amber-700 border border-amber-200";
  }
}

export default function AdminOrdersClient({
  orders,
}: {
  orders: AdminOrderListRow[];
}) {
  const [activeStatus, setActiveStatus] = useState<string>("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      const k = o.status.toLowerCase();
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    if (activeStatus === "all") return orders;
    return orders.filter((o) => o.status.toLowerCase() === activeStatus);
  }, [orders, activeStatus]);

  const formatMoney = (amount: number) =>
    Number(amount).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-5">
      <OrderRealtimeSync />

      {/* Status Filter Tabs with Accurate Counts */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-xs">
        {STATUS_TABS.map((tab) => {
          const count = counts[tab.key] ?? 0;
          const active = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition",
                active
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  active
                    ? "bg-[#2563EB] text-white"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center">
          <Package className="mx-auto text-slate-300" size={44} />
          <h2 className="mt-4 text-lg font-bold text-[#0F172A]">
            No {activeStatus === "all" ? "" : activeStatus} orders
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Matching customer orders will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((order) => {
                  const isCancelled =
                    order.status.toLowerCase() === "cancelled";

                  return (
                    <tr key={order.id} className="hover:bg-[#F8FAFC]/80">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0F172A]">
                          {order.order_number}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {order.id.slice(0, 8)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0F172A]">
                          {order.shipping_full_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {order.shipping_phone}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {order.shipping_city}
                          {order.shipping_district
                            ? `, ${order.shipping_district}`
                            : ""}
                        </p>
                      </td>

                      <td className="max-w-[220px] px-5 py-4">
                        <p className="line-clamp-2 text-xs font-semibold text-[#0F172A]">
                          {order.productSummary}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {order.itemCount} line{" "}
                          {order.itemCount === 1 ? "item" : "items"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-[#0F172A]">
                        {order.currency} {formatMoney(order.total)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-bold uppercase text-[#0F172A]">
                          {order.payment_method}
                        </p>
                        <p className="mt-0.5 text-xs capitalize text-slate-500">
                          {order.payment_status}
                        </p>
                        {isCancelled &&
                          order.refund_status === "pending_review" && (
                            <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Refund Pending Review
                            </span>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusBadgeClasses(order.status)}`}
                        >
                          {order.status}
                        </span>
                        {isCancelled && (
                          <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
                            {order.cancelled_by && (
                              <p className="font-semibold text-[#DC2626]">
                                By{" "}
                                {order.cancelled_by === "customer"
                                  ? "Customer"
                                  : "Admin"}
                              </p>
                            )}
                            {order.cancellation_reason && (
                              <p className="max-w-[180px] truncate">
                                {order.cancellation_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        <div>
                          {new Date(order.created_at).toLocaleDateString(
                            "en-LK",
                          )}
                        </div>
                        {isCancelled && order.cancelled_at && (
                          <div className="mt-1 text-[11px] text-[#DC2626]">
                            Cancelled:{" "}
                            {new Date(order.cancelled_at).toLocaleDateString(
                              "en-LK",
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0F172A] transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
