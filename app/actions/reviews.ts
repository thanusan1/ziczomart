"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitReviewInput = {
  productId: string;
  orderId: string;
  orderItemId?: string | null;
  rating: number;
  title: string;
  comment: string;
  images: string[];
};

export type SubmitReviewResult = {
  ok: boolean;
  error?: string;
};

export async function submitProductReviewAction(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in to submit a review." };
  }

  const rating = Math.round(Number(input.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Please select a star rating between 1 and 5." };
  }

  const title = input.title.trim();
  const comment = input.comment.trim();

  if (title.length > 120) {
    return { ok: false, error: "Review title must be 120 characters or less." };
  }

  if (comment.length < 10) {
    return {
      ok: false,
      error: "Please write at least 10 characters in your review.",
    };
  }

  if (comment.length > 1500) {
    return {
      ok: false,
      error: "Review description must be 1500 characters or less.",
    };
  }

  const sanitizedImages = (input.images ?? [])
    .filter((url) => typeof url === "string" && url.startsWith("https://"))
    .slice(0, 4);

  // Server-side verification: order must belong to user, be delivered, and contain product
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, order_items(id, product_id)")
    .eq("id", input.orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError || !order) {
    return { ok: false, error: "Matching order could not be verified." };
  }

  if (String(order.status).trim().toLowerCase() !== "delivered") {
    return {
      ok: false,
      error: "You can only review a product after its order has been delivered.",
    };
  }

  const orderItems = (order.order_items ?? []) as {
    id: string;
    product_id: string | null;
  }[];
  const matchedItem = orderItems.find(
    (item) =>
      item.product_id === input.productId &&
      (!input.orderItemId || item.id === input.orderItemId),
  );

  if (!matchedItem) {
    return {
      ok: false,
      error: "This product was not found in the specified delivered order.",
    };
  }

  // Enforce 1 review per customer per product at server level
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", input.productId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingReview) {
    return { ok: false, error: "You have already reviewed this product." };
  }

  // Insert review (always pending approval, verified purchase enforced by DB trigger too)
  let { error: insertError } = await supabase.from("reviews").insert({
    product_id: input.productId,
    user_id: user.id,
    order_id: order.id,
    order_item_id: matchedItem.id,
    rating,
    title: title || null,
    comment,
    images: sanitizedImages,
    status: "pending",
    is_published: false,
  });

  // Fallback if 004_reviews_system.sql hasn't been applied yet
  if (
    insertError &&
    (insertError.message.includes("order_item_id") ||
      insertError.message.includes("images") ||
      insertError.message.includes("status"))
  ) {
    const fallback = await supabase.from("reviews").insert({
      product_id: input.productId,
      user_id: user.id,
      order_id: order.id,
      rating,
      title: title || null,
      comment,
      is_published: false,
    });
    insertError = fallback.error;
  }

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "You have already reviewed this product." };
    }
    return { ok: false, error: insertError.message };
  }

  const { data: prod } = await supabase
    .from("products")
    .select("slug")
    .eq("id", input.productId)
    .maybeSingle();

  if (prod?.slug) {
    revalidatePath(`/products/${prod.slug}`);
  }
  revalidatePath(`/account/orders/${order.id}`);
  revalidatePath("/account/orders");
  revalidatePath("/admin/reviews");

  return { ok: true };
}

export async function moderateReviewAction(
  reviewId: string,
  action: "approve" | "reject" | "delete",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("id, product_id, products(slug)")
    .eq("id", reviewId)
    .maybeSingle();

  if (!review) {
    return { ok: false, error: "Review not found." };
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);
    if (error) return { ok: false, error: error.message };
  } else {
    const nextStatus = action === "approve" ? "approved" : "rejected";
    const nextPublished = action === "approve";

    let { error } = await supabase
      .from("reviews")
      .update({ status: nextStatus, is_published: nextPublished })
      .eq("id", reviewId);

    if (error && error.message.includes("status")) {
      const fallback = await supabase
        .from("reviews")
        .update({ is_published: nextPublished })
        .eq("id", reviewId);
      error = fallback.error;
    }

    if (error) return { ok: false, error: error.message };
  }

  const prodRaw = review.products as
    | { slug: string }
    | { slug: string }[]
    | null;
  const prodSlug = Array.isArray(prodRaw) ? prodRaw[0]?.slug : prodRaw?.slug;

  if (prodSlug) {
    revalidatePath(`/products/${prodSlug}`);
  }
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/admin/reviews");

  return { ok: true };
}
