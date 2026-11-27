"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import CancelOrderButton from "@/components/orders/cancel-order-button";
import OrderRealtimeSync from "@/components/orders/order-realtime-sync";
import { formatPrice } from "@/lib/utils";

export type CustomerOrderItemSummary = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  imageUrl: string | null;
};

export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  refundStatus: string;
  total: number;
  createdAt: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  items: CustomerOrderItemSummary[];
  hasUnreviewedDeliveredItems: boolean;
  allDeliveredItemsReviewed: boolean;
};

interface CustomerOrdersClientProps {
  userId: string;
  initialOrders: CustomerOrderSummary[];
}

export default function CustomerOrdersClient({
  userId,
  initialOrders,
}: CustomerOrdersClientProps) {
  const [orders, setOrders] = useState<CustomerOrderSummary[]>(initialOrders);
  const [prevInitial, setPrevInitial] = useState(initialOrders);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (initialOrders !== prevInitial) {
    setPrevInitial(initialOrders);
    setOrders(initialOrders);
  }

  function handleOrderCancelled(payload: {
    orderId: string;
    reason: string;
    refundStatus: "none" | "pending_review" | "refunded";
  }) {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === payload.orderId
          ? {
              ...o,
              status: "cancelled",
              cancellationReason: payload.reason || null,
              cancelledAt: nowIso,
              refundStatus: payload.refundStatus,
            }
          : o,
      ),
    );
    setToastMessage("Your order has been cancelled successfully.");
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <>
      <OrderRealtimeSync userId={userId} />

      {toastMessage && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[#16A34A]"
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
            <ShoppingBag size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#0F172A]">
            No orders yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your purchases will appear here after you place an order.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
          >
            Start Shopping <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCancelled = order.status.toLowerCase() === "cancelled";
            const isDelivered = order.status.toLowerCase() === "delivered";
            const totalQty = order.items.reduce(
              (sum, it) => sum + it.quantity,
              0,
            );
            const firstItem = order.items[0];

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:border-slate-300"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-[#0F172A]">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {isCancelled &&
                      order.refundStatus === "pending_review" && (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                          Refund Pending Review
                        </span>
                      )}
                  </div>
                </div>

                {/* Product Preview + Totals */}
                <div className="mt-4 flex flex-col gap-4 border-t border-[#E2E8F0] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                      {firstItem?.imageUrl ? (
                        <Image
                          src={firstItem.imageUrl}
                          alt={firstItem.productName}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-bold text-[#0F172A]">
                        {firstItem?.productName ?? "Order Items"}
                        {order.items.length > 1 &&
                          ` + ${order.items.length - 1} more`}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Qty: {totalQty} {totalQty === 1 ? "item" : "items"} ·{" "}
                        <span className="uppercase">{order.paymentMethod}</span>
                      </p>
                      <div className="mt-1">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Total Amount
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-[#0F172A]">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                {/* Cancellation details if cancelled */}
                {isCancelled && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50/70 px-3.5 py-2.5 text-xs text-slate-700">
                    <span className="font-bold text-[#DC2626]">Cancelled</span>
                    {order.cancelledAt && (
                      <span>
                        {" "}
                        on{" "}
                        {new Date(order.cancelledAt).toLocaleString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {order.cancellationReason && (
                      <p className="mt-0.5 text-slate-600">
                        Reason: {order.cancellationReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2563EB]"
                    >
                      View Details <ArrowRight size={14} />
                    </Link>

                    <CancelOrderButton
                      orderId={order.id}
                      orderNumber={order.orderNumber}
                      status={order.status}
                      paymentStatus={order.paymentStatus}
                      onCancelled={handleOrderCancelled}
                    />
                  </div>

                  {isDelivered && (
                    <div>
                      {order.hasUnreviewedDeliveredItems ? (
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#EFF6FF] px-3.5 py-2 text-xs font-bold text-[#2563EB] transition hover:bg-blue-100"
                        >
                          Write a Review
                        </Link>
                      ) : order.allDeliveredItemsReviewed ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#16A34A]">
                          Reviewed
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
