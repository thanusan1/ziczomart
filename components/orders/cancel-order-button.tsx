"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, X, XCircle } from "lucide-react";
import { cancelCustomerOrderAction } from "@/app/actions/orders";
import { cn } from "@/lib/utils";

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Delivery taking too long",
  "Changed my mind",
  "Other",
] as const;

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  size?: "sm" | "md";
  onCancelled?: (payload: {
    orderId: string;
    reason: string;
    refundStatus: "none" | "pending_review" | "refunded";
  }) => void;
}

export default function CancelOrderButton({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  size = "sm",
  onCancelled,
}: CancelOrderButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedStatus = status.trim().toLowerCase();
  const normalizedPayment = paymentStatus.trim().toLowerCase();
  const canCancel =
    (normalizedStatus === "pending" || normalizedStatus === "confirmed") &&
    normalizedPayment !== "refunded";

  if (!canCancel) return null;

  async function handleConfirmCancel() {
    setLoading(true);
    setError("");

    const finalReason =
      selectedReason === "Other"
        ? customReason.trim() || "Other"
        : selectedReason;

    try {
      const result = await cancelCustomerOrderAction(orderId, finalReason);
      if (!result.ok) {
        setError(result.error ?? "Could not cancel this order.");
        return;
      }

      setOpen(false);
      onCancelled?.({
        orderId,
        reason: finalReason,
        refundStatus: result.refundStatus ?? "none",
      });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not cancel this order.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white font-semibold text-[#DC2626] transition hover:border-[#DC2626] hover:bg-red-50",
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        )}
      >
        <XCircle size={size === "sm" ? 14 : 16} />
        <span>Cancel Order</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cancel-order-title-${orderId}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-[#DC2626]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2
                    id={`cancel-order-title-${orderId}`}
                    className="text-lg font-extrabold text-[#0F172A]"
                  >
                    Cancel this order?
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    Order {orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                aria-label="Close modal"
                className="rounded-full p-1 text-slate-400 hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>

            {normalizedPayment === "paid" && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                Since this order is already paid, a refund review will be
                flagged automatically after cancellation.
              </div>
            )}

            <div className="mt-4 space-y-2">
              <label
                htmlFor={`cancel-reason-${orderId}`}
                className="block text-xs font-bold uppercase tracking-wider text-[#0F172A]"
              >
                Cancellation Reason{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <select
                id={`cancel-reason-${orderId}`}
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                <option value="">Select a reason (optional)</option>
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {selectedReason === "Other" && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={2}
                  maxLength={300}
                  disabled={loading}
                  placeholder="Tell us why you are cancelling (optional)..."
                  className="mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              )}
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-[#DC2626]">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-bold text-[#0F172A] transition hover:bg-[#F8FAFC]"
              >
                Keep My Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>
                  {loading ? "Cancelling..." : "Confirm Cancellation"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
