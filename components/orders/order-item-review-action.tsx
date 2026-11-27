"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, PenLine } from "lucide-react";
import ReviewFormModal from "@/components/reviews/review-form-modal";

interface OrderItemReviewActionProps {
  orderId: string;
  orderItemId: string;
  orderStatus: string;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  existingReviewStatus: "pending" | "approved" | "rejected" | null;
}

export default function OrderItemReviewAction({
  orderId,
  orderItemId,
  orderStatus,
  productId,
  productName,
  productImageUrl,
  existingReviewStatus: initialReviewStatus,
}: OrderItemReviewActionProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(initialReviewStatus);

  const isDelivered = orderStatus.trim().toLowerCase() === "delivered";

  if (!productId) {
    return null;
  }

  if (reviewStatus) {
    return (
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#16A34A]">
        <CheckCircle2 size={13} />
        <span>
          Reviewed
          {reviewStatus === "pending" ? " (Pending Approval)" : ""}
        </span>
      </div>
    );
  }

  if (!isDelivered) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <Clock size={12} />
        <span>Review available after delivery</span>
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1D4ED8]"
      >
        <PenLine size={13} />
        <span>Write a Review</span>
      </button>

      {modalOpen && (
        <ReviewFormModal
          target={{
            productId,
            productName,
            productImageUrl,
            orderId,
            orderItemId,
          }}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            setReviewStatus("pending");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
