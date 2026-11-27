"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquare,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { moderateReviewAction } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

export type AdminReviewRow = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string | null;
  customerName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  status: "pending" | "approved" | "rejected";
  isVerifiedPurchase: boolean;
  createdAt: string;
  orderId: string;
};

interface AdminReviewsClientProps {
  reviews: AdminReviewRow[];
}

export default function AdminReviewsClient({
  reviews,
}: AdminReviewsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d">("all");
  const [referenceNow] = useState(() => Date.now());
  const [selectedReview, setSelectedReview] = useState<AdminReviewRow | null>(
    null,
  );
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === "pending").length;
    const approvedList = reviews.filter((r) => r.status === "approved");
    const approved = approvedList.length;
    const rejected = reviews.filter((r) => r.status === "rejected").length;
    const avg =
      approved > 0
        ? approvedList.reduce((s, r) => s + r.rating, 0) / approved
        : 0;
    return { total, pending, approved, rejected, avg };
  }, [reviews]);

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reviews) {
      map.set(r.productId, r.productName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
      if (productFilter !== "all" && r.productId !== productFilter)
        return false;
      if (dateRange !== "all") {
        const days = dateRange === "7d" ? 7 : 30;
        const diff = referenceNow - new Date(r.createdAt).getTime();
        if (diff > days * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [reviews, statusFilter, ratingFilter, productFilter, dateRange, referenceNow]);

  function handleModerate(
    reviewId: string,
    action: "approve" | "reject" | "delete",
  ) {
    setActionError("");
    setBusyId(reviewId);
    startTransition(async () => {
      const res = await moderateReviewAction(reviewId, action);
      setBusyId(null);
      if (!res.ok) {
        setActionError(res.error ?? "Failed to update review.");
        return;
      }
      if (selectedReview?.id === reviewId) {
        setSelectedReview(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Reviews
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#0F172A]">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Pending
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-amber-600">
            {stats.pending}
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#16A34A]">
            Approved
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-[#16A34A]">
            {stats.approved}
          </p>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Rejected
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-red-600">
            {stats.rejected}
          </p>
        </div>
        <div className="col-span-2 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Avg Rating
          </p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#0F172A]">
              {stats.approved > 0 ? stats.avg.toFixed(1) : "—"}
            </span>
            {stats.approved > 0 && (
              <Star size={16} className="fill-amber-400 text-amber-400" />
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-bold capitalize transition",
                statusFilter === s
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {s === "all" ? "All Reviews" : s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(
                e.target.value === "all" ? "all" : Number(e.target.value),
              )
            }
            aria-label="Filter by rating"
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars
              </option>
            ))}
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            aria-label="Filter by product"
            className="max-w-[200px] rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Products</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) =>
              setDateRange(e.target.value as "all" | "7d" | "30d")
            }
            aria-label="Filter by date range"
            className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {/* Reviews Table */}
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <MessageSquare size={30} className="text-slate-300" />
            <p className="mt-2.5 text-sm font-bold text-[#0F172A]">
              No reviews found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your status, rating, or product filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-4 py-3.5">Review Title</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredReviews.map((rev) => {
                  const rowBusy = isPending && busyId === rev.id;
                  return (
                    <tr key={rev.id} className="hover:bg-[#F8FAFC]/70">
                      <td className="px-4 py-3.5 font-semibold text-[#0F172A]">
                        <div>{rev.customerName}</div>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[11px] font-medium text-[#16A34A]">
                            Verified Purchase
                          </span>
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3.5">
                        {rev.productSlug ? (
                          <Link
                            href={`/products/${rev.productSlug}`}
                            target="_blank"
                            className="line-clamp-2 font-semibold text-[#2563EB] hover:underline"
                          >
                            {rev.productName}
                          </Link>
                        ) : (
                          <span className="line-clamp-2 font-medium text-slate-700">
                            {rev.productName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <Star
                            size={14}
                            className="fill-amber-400 text-amber-400"
                          />
                          <span className="font-bold text-[#0F172A]">
                            {rev.rating}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-3.5">
                        <p className="truncate font-medium text-[#0F172A]">
                          {rev.title || "—"}
                        </p>
                        {rev.images.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            {rev.images.length} photo
                            {rev.images.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                            rev.status === "approved"
                              ? "bg-green-50 text-[#16A34A]"
                              : rev.status === "rejected"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {rev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedReview(rev)}
                            title="View review details"
                            className="rounded-lg border border-[#E2E8F0] p-1.5 text-slate-600 transition hover:border-[#2563EB] hover:text-[#2563EB]"
                          >
                            <Eye size={14} />
                          </button>
                          {rev.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleModerate(rev.id, "approve")}
                              disabled={rowBusy}
                              title="Approve review"
                              className="rounded-lg border border-green-200 bg-green-50 p-1.5 text-[#16A34A] transition hover:bg-green-100 disabled:opacity-50"
                            >
                              {rowBusy ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={14} />
                              )}
                            </button>
                          )}
                          {rev.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleModerate(rev.id, "reject")}
                              disabled={rowBusy}
                              title="Reject review"
                              className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleModerate(rev.id, "delete")}
                            disabled={rowBusy}
                            title="Delete review"
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172A]">
                  Review Details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Submitted on{" "}
                  {new Date(selectedReview.createdAt).toLocaleString("en-LK")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] p-3.5 text-xs">
                <div>
                  <span className="font-semibold text-slate-400">Customer</span>
                  <p className="mt-0.5 font-bold text-[#0F172A]">
                    {selectedReview.customerName}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Product</span>
                  <p className="mt-0.5 font-bold text-[#0F172A]">
                    {selectedReview.productName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={cn(
                      i < selectedReview.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200",
                    )}
                  />
                ))}
                <span className="ml-2 font-bold text-[#0F172A]">
                  {selectedReview.rating} / 5
                </span>
              </div>

              {selectedReview.title && (
                <p className="font-bold text-[#0F172A]">
                  {selectedReview.title}
                </p>
              )}

              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {selectedReview.comment || "No written description."}
              </p>

              {selectedReview.images.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Uploaded Photos
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedReview.images.map((url, idx) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#E2E8F0]"
                      >
                        <Image
                          src={url}
                          alt={`Review photo ${idx + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[#E2E8F0] pt-4">
              {selectedReview.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => handleModerate(selectedReview.id, "approve")}
                  disabled={isPending}
                  className="rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
              )}
              {selectedReview.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => handleModerate(selectedReview.id, "reject")}
                  disabled={isPending}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  Reject
                </button>
              )}
              <button
                type="button"
                onClick={() => handleModerate(selectedReview.id, "delete")}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
