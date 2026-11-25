"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateOrderStatus, updatePaymentStatus } from "./actions";

type Props = {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
};

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export default function OrderStatusControls({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function saveOrderStatus() {
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.set("id", orderId);
    formData.set("status", status);

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
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold">Manage Order</h2>

      <div className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="order-status"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Order Status
          </label>

          <select
            id="order-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
          >
            {ORDER_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={saveOrderStatus}
            disabled={isPending || status === currentStatus}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Order Status
          </button>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label
            htmlFor="payment-status"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Payment Status
          </label>

          <select
            id="payment-status"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
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
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Payment Status
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
