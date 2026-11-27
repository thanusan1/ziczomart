"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { updateOrderStatus, updatePaymentStatus } from "./actions";

type Props = {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
};

const ALLOWED_NEXT_STATUSES: Record<string, string[]> = {
  pending: ["pending", "confirmed", "processing", "cancelled"],
  confirmed: ["confirmed", "processing", "cancelled"],
  processing: ["processing", "shipped"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered", "refunded"],
  cancelled: ["cancelled"],
  refunded: ["refunded"],
};

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export default function OrderStatusControls({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [prevCurrentStatus, setPrevCurrentStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [prevPaymentStatus, setPrevPaymentStatus] =
    useState(currentPaymentStatus);
  const [cancelReason, setCancelReason] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (currentStatus !== prevCurrentStatus) {
    setPrevCurrentStatus(currentStatus);
    setStatus(currentStatus);
  }
  if (currentPaymentStatus !== prevPaymentStatus) {
    setPrevPaymentStatus(currentPaymentStatus);
    setPaymentStatus(currentPaymentStatus);
  }

  const normalizedCurrent = currentStatus.toLowerCase();
  const isTerminal =
    normalizedCurrent === "cancelled" || normalizedCurrent === "refunded";
  const statusOptions = ALLOWED_NEXT_STATUSES[normalizedCurrent] ?? [
    normalizedCurrent,
  ];

  function saveOrderStatus() {
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("id", orderId);
    formData.set("status", status);
    if (status === "cancelled" && cancelReason.trim()) {
      formData.set("cancellation_reason", cancelReason.trim());
    }

    startTransition(async () => {
      try {
        await updateOrderStatus(formData);
        setMessage("Order status updated successfully.");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not update order status.",
        );
      }
    });
  }

  function savePaymentStatus() {
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("id", orderId);
    formData.set("payment_status", paymentStatus);

    startTransition(async () => {
      try {
        await updatePaymentStatus(formData);
        setMessage("Payment status updated successfully.");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not update payment status.",
        );
      }
    });
  }

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
      <h2 className="text-lg font-extrabold text-[#0F172A]">Manage Order</h2>

      <div className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="order-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Order Status
          </label>

          {isTerminal ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium text-[#DC2626]">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>
                This order is{" "}
                <strong className="capitalize">{normalizedCurrent}</strong>{" "}
                (terminal status) and cannot be transitioned to another status.
              </span>
            </div>
          ) : (
            <>
              <select
                id="order-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isPending}
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>

              {status === "cancelled" && currentStatus !== "cancelled" && (
                <div className="mt-3">
                  <label
                    htmlFor="admin-cancel-reason"
                    className="mb-1 block text-xs font-semibold text-slate-600"
                  >
                    Cancellation Reason (optional)
                  </label>
                  <input
                    id="admin-cancel-reason"
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    maxLength={300}
                    placeholder="Reason for cancellation"
                    className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs outline-none focus:border-[#2563EB]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={saveOrderStatus}
                disabled={isPending || status === currentStatus}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Order Status
              </button>
            </>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] pt-5">
          <label
            htmlFor="payment-status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Payment Status
          </label>

          <select
            id="payment-status"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            {PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={savePaymentStatus}
            disabled={isPending || paymentStatus === currentPaymentStatus}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Payment Status
          </button>
        </div>

        {message && (
          <p className="rounded-xl bg-green-50 p-3 text-xs font-semibold text-[#16A34A]">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-[#DC2626]">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
