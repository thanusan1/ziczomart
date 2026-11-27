"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CancelOrderResult = {
  ok: boolean;
  error?: string;
  refundStatus?: "none" | "pending_review" | "refunded";
};

/**
 * Customer order cancellation action.
 * Enforces ownership, eligible status ('pending' or 'confirmed'),
 * and atomic row-level locking via cancel_customer_order RPC.
 */
export async function cancelCustomerOrderAction(
  orderId: string,
  reason: string,
): Promise<CancelOrderResult> {
  if (!orderId) {
    return { ok: false, error: "Order ID is required." };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Please sign in to cancel your order." };
  }

  // Server-side pre-check before RPC
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, status, payment_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !order) {
    return { ok: false, error: "Order not found." };
  }

  const currentStatus = String(order.status).trim().toLowerCase();
  const paymentStatus = String(order.payment_status).trim().toLowerCase();

  if (paymentStatus === "refunded") {
    return {
      ok: false,
      error: "This order has already been refunded and cannot be cancelled.",
    };
  }

  if (currentStatus === "cancelled") {
    return { ok: false, error: "This order has already been cancelled." };
  }

  if (currentStatus !== "pending" && currentStatus !== "confirmed") {
    return {
      ok: false,
      error: `This order can no longer be cancelled because it is already ${currentStatus}.`,
    };
  }

  const trimmedReason = reason.trim().slice(0, 300);

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "cancel_customer_order",
    {
      p_order_id: orderId,
      p_reason: trimmedReason || null,
    },
  );

  if (rpcError) {
    return { ok: false, error: rpcError.message };
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  const refundStatus = (
    rpcResult as { refund_status?: "none" | "pending_review" | "refunded" } | null
  )?.refund_status;

  return {
    ok: true,
    refundStatus:
      refundStatus ?? (paymentStatus === "paid" ? "pending_review" : "none"),
  };
}
