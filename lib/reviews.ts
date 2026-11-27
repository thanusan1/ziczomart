import type { SupabaseClient } from "@supabase/supabase-js";

export type ReviewEligibilityState =
  | "NOT_LOGGED_IN"
  | "NOT_PURCHASED"
  | "ORDER_NOT_DELIVERED"
  | "ELIGIBLE"
  | "ALREADY_REVIEWED"
  | "PENDING_APPROVAL";

export type ReviewEligibilityResult = {
  state: ReviewEligibilityState;
  orderId: string | null;
  orderItemId: string | null;
};

export type PublicReviewItem = {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  is_verified_purchase: boolean;
  created_at: string;
  display_name: string;
};

/**
 * Determines the authenticated customer's review eligibility for a product.
 * Enforces: 1 review per customer per product, only after order is 'delivered'.
 */
export async function getProductReviewEligibility(
  supabase: SupabaseClient,
  productId: string,
  userId: string | null,
): Promise<ReviewEligibilityResult> {
  if (!userId) {
    return { state: "NOT_LOGGED_IN", orderId: null, orderItemId: null };
  }

  // 1. Check if customer has already reviewed this product (1 review per product policy)
  const { data: existingReview, error: revErr } = await supabase
    .from("reviews")
    .select("id, is_published, status")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (revErr && revErr.message.includes("status")) {
    const { data: fallbackRev } = await supabase
      .from("reviews")
      .select("id, is_published")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fallbackRev) {
      return {
        state: fallbackRev.is_published
          ? "ALREADY_REVIEWED"
          : "PENDING_APPROVAL",
        orderId: null,
        orderItemId: null,
      };
    }
  } else if (existingReview) {
    const status = (existingReview as { status?: string }).status;
    if (status === "pending" || (!status && !existingReview.is_published)) {
      return { state: "PENDING_APPROVAL", orderId: null, orderItemId: null };
    }
    return { state: "ALREADY_REVIEWED", orderId: null, orderItemId: null };
  }

  // 2. Check customer's orders containing this product
  const { data: ordersWithProduct } = await supabase
    .from("orders")
    .select("id, status, created_at, order_items!inner(id, product_id)")
    .eq("user_id", userId)
    .eq("order_items.product_id", productId)
    .order("created_at", { ascending: false });

  if (!ordersWithProduct || ordersWithProduct.length === 0) {
    return { state: "NOT_PURCHASED", orderId: null, orderItemId: null };
  }

  // 3. Find a delivered order (case-insensitive check for 'delivered')
  const deliveredOrder = ordersWithProduct.find(
    (o) => String(o.status).trim().toLowerCase() === "delivered",
  );

  if (!deliveredOrder) {
    return { state: "ORDER_NOT_DELIVERED", orderId: null, orderItemId: null };
  }

  const itemsRaw = deliveredOrder.order_items as
    | { id: string; product_id: string }
    | { id: string; product_id: string }[];
  const firstItem = Array.isArray(itemsRaw) ? itemsRaw[0] : itemsRaw;

  return {
    state: "ELIGIBLE",
    orderId: deliveredOrder.id,
    orderItemId: firstItem?.id ?? null,
  };
}

/**
 * Fetches publicly approved reviews with privacy-preserving customer display names.
 */
export async function fetchPublicProductReviews(
  supabase: SupabaseClient,
  productId: string,
): Promise<PublicReviewItem[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_public_product_reviews",
    { p_product_id: productId },
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return (rpcData as PublicReviewItem[]).map((r) => ({
      id: r.id,
      product_id: r.product_id,
      rating: Number(r.rating),
      title: r.title,
      comment: r.comment,
      images: Array.isArray(r.images) ? r.images : [],
      is_verified_purchase: Boolean(r.is_verified_purchase),
      created_at: r.created_at,
      display_name: r.display_name || "ZicZo Customer",
    }));
  }

  // Fallback if 004_reviews_system.sql RPC is not yet deployed
  const { data: rows } = await supabase
    .from("reviews")
    .select("id, product_id, rating, title, comment, created_at")
    .eq("product_id", productId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (rows ?? []).map((r) => ({
    id: r.id,
    product_id: r.product_id,
    rating: Number(r.rating),
    title: r.title,
    comment: r.comment,
    images: [],
    is_verified_purchase: true,
    created_at: r.created_at,
    display_name: "ZicZo Customer",
  }));
}
