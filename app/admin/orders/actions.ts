"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const nextStatus = String(formData.get("status") || "").trim().toLowerCase();
  const reason = String(formData.get("cancellation_reason") || "").trim();

  if (!id) {
    throw new Error("Order ID is missing.");
  }

  if (!ORDER_STATUSES.includes(nextStatus as (typeof ORDER_STATUSES)[number])) {
    throw new Error("Invalid order status.");
  }

  const supabase = await verifyAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("id, status, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("Order not found.");
  }

  const currentStatus = String(existing.status).trim().toLowerCase();

  if (currentStatus === nextStatus) {
    return;
  }

  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    throw new Error(
      `This order is already ${currentStatus} and cannot be changed to ${nextStatus}.`,
    );
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid status transition from "${currentStatus}" to "${nextStatus}".`,
    );
  }

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
  };

  if (nextStatus === "confirmed") {
    updatePayload.confirmed_at = new Date().toISOString();
  }

  if (nextStatus === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
    updatePayload.cancelled_by = "admin";
    if (reason) {
      updatePayload.cancellation_reason = reason.slice(0, 300);
    }
    if (String(existing.payment_status).toLowerCase() === "paid") {
      updatePayload.refund_status = "pending_review";
    }
  }

  // Optimistic concurrency guard: only update if status hasn't changed concurrently
  let { data: updatedRows, error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", existing.status)
    .select("id");

  if (error && error.message.includes("column")) {
    const fallback = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", id)
      .eq("status", existing.status)
      .select("id");
    updatedRows = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error("Could not update order status: " + error.message);
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error(
      "This order's status was modified by the customer or another admin. Please refresh and try again.",
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${id}`);
}

export async function updatePaymentStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const paymentStatus = String(formData.get("payment_status") || "");

  if (!id) {
    throw new Error("Order ID is missing.");
  }

  if (
    !PAYMENT_STATUSES.includes(
      paymentStatus as (typeof PAYMENT_STATUSES)[number],
    )
  ) {
    throw new Error("Invalid payment status.");
  }

  const supabase = await verifyAdmin();

  const updatePayload: Record<string, unknown> = {
    payment_status: paymentStatus,
  };
  if (paymentStatus === "refunded") {
    updatePayload.refund_status = "refunded";
  }

  let { error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", id);

  if (error && error.message.includes("column")) {
    const fallback = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", id);
    error = fallback.error;
  }

  if (error) {
    throw new Error("Could not update payment status: " + error.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${id}`);
}
