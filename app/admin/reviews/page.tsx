import { createClient } from "@/lib/supabase/server";
import AdminReviewsClient, {
  type AdminReviewRow,
} from "./admin-reviews-client";

export const metadata = {
  title: "Review Management",
  description: "Moderate customer product reviews and ratings.",
};

export const instant = false;

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  // Fetch all reviews (admin RLS allows viewing all)
  const { data: reviewsRaw, error } = await supabase
    .from("reviews")
    .select(
      `id, product_id, user_id, order_id, rating, title, comment, is_published, created_at,
       products(name, slug)`,
    )
    .order("created_at", { ascending: false });

  // Also try fetching extended columns if 004_reviews_system.sql is applied
  const { data: extRaw } = await supabase
    .from("reviews")
    .select("id, status, images, is_verified_purchase")
    .order("created_at", { ascending: false });

  const extMap = new Map(
    (extRaw ?? []).map((r) => [
      r.id,
      {
        status: r.status as "pending" | "approved" | "rejected" | undefined,
        images: (r.images as string[] | null) ?? [],
        isVerified: Boolean(r.is_verified_purchase),
      },
    ]),
  );

  // Fetch customer names from profiles (admin RLS allows viewing all profiles)
  const userIds = Array.from(
    new Set((reviewsRaw ?? []).map((r) => r.user_id)),
  );
  const profileMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    for (const p of profiles ?? []) {
      if (p.full_name) profileMap.set(p.id, p.full_name);
    }
  }

  const rows: AdminReviewRow[] = (reviewsRaw ?? []).map((r) => {
    const prodRaw = r.products as
      | { name: string; slug: string }
      | { name: string; slug: string }[]
      | null;
    const prod = Array.isArray(prodRaw) ? prodRaw[0] : prodRaw;
    const ext = extMap.get(r.id);

    const status: "pending" | "approved" | "rejected" =
      ext?.status ?? (r.is_published ? "approved" : "pending");

    return {
      id: r.id,
      productId: r.product_id,
      productName: prod?.name ?? "Unknown Product",
      productSlug: prod?.slug ?? null,
      customerName: profileMap.get(r.user_id) ?? "ZicZo Customer",
      rating: Number(r.rating),
      title: r.title,
      comment: r.comment,
      images: ext?.images ?? [],
      status,
      isVerifiedPurchase: ext?.isVerified ?? true,
      createdAt: r.created_at,
      orderId: r.order_id,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          Customer Reviews
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve, reject, or remove customer product reviews. Only approved
          reviews are visible on product pages.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load reviews: {error.message}
        </div>
      ) : (
        <AdminReviewsClient reviews={rows} />
      )}
    </div>
  );
}
