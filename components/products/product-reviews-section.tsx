"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  PackageCheck,
  PenLine,
  Star,
  X,
} from "lucide-react";
import type {
  PublicReviewItem,
  ReviewEligibilityResult,
} from "@/lib/reviews";
import ReviewFormModal from "@/components/reviews/review-form-modal";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  reviews: PublicReviewItem[];
  eligibility: ReviewEligibilityResult;
}

export default function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  productImageUrl,
  reviews,
  eligibility: initialEligibility,
}: ProductReviewsSectionProps) {
  const router = useRouter();
  const [eligibility, setEligibility] =
    useState<ReviewEligibilityResult>(initialEligibility);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStar, setFilterStar] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">(
    "recent",
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const totalCount = reviews.length;
  const averageRating =
    totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

  const starCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage =
      totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return { stars, count, percentage };
  });

  const filteredAndSorted = useMemo(() => {
    const filtered =
      filterStar === "all"
        ? reviews
        : reviews.filter((r) => r.rating === filterStar);

    return [...filtered].sort((a, b) => {
      if (sortBy === "highest") {
        return (
          b.rating - a.rating ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortBy === "lowest") {
        return (
          a.rating - b.rating ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [reviews, filterStar, sortBy]);

  const visibleReviews = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;

  function handleReviewSuccess() {
    setModalOpen(false);
    setEligibility({
      state: "PENDING_APPROVAL",
      orderId: null,
      orderItemId: null,
    });
    router.refresh();
  }

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="scroll-mt-24 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h2
            id="reviews-heading"
            className="text-lg font-extrabold text-[#0F172A] sm:text-xl"
          >
            Customer Reviews &amp; Ratings
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Verified feedback from customers who received this product
          </p>
        </div>
      </div>

      {/* Customer Eligibility Action Banner (6 States) */}
      <div className="mt-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
        {eligibility.state === "NOT_LOGGED_IN" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <Lock size={16} />
              </div>
              <p className="text-sm font-medium text-[#0F172A]">
                Sign in to review this product.
              </p>
            </div>
            <Link
              href={`/login?next=${encodeURIComponent(`/products/${productSlug}#reviews`)}`}
              className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Sign In
            </Link>
          </div>
        )}

        {eligibility.state === "NOT_PURCHASED" && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200/70 text-slate-600">
              <PackageCheck size={16} />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Only customers who have purchased and received this product can
              leave a review.
            </p>
          </div>
        )}

        {eligibility.state === "ORDER_NOT_DELIVERED" && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock size={16} />
            </div>
            <p className="text-sm font-medium text-amber-900">
              You can review this product after it has been delivered.
            </p>
          </div>
        )}

        {eligibility.state === "ELIGIBLE" && eligibility.orderId && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <PenLine size={16} />
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">
                Enjoyed this product? Share your experience.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D4ED8]"
            >
              <PenLine size={14} />
              <span>Write a Review</span>
            </button>
          </div>
        )}

        {eligibility.state === "ALREADY_REVIEWED" && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-[#16A34A]">
              <CheckCircle2 size={16} />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">
              You have already reviewed this product.
            </p>
          </div>
        )}

        {eligibility.state === "PENDING_APPROVAL" && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
              <Clock size={16} />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">
              Your review has been submitted and is awaiting approval.
            </p>
          </div>
        )}
      </div>

      {/* Summary + Reviews Grid */}
      <div className="mt-6 grid gap-8 md:grid-cols-12">
        {/* Rating Distribution */}
        <div className="md:col-span-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            {totalCount > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-[#0F172A]">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">
                    / 5
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={17}
                      className={
                        i < Math.round(averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Based on {totalCount} customer{" "}
                  {totalCount === 1 ? "review" : "reviews"}.
                </p>
              </>
            ) : (
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  No reviews yet.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ratings will appear once verified customers share approved
                  reviews.
                </p>
              </div>
            )}

            {/* 5-star to 1-star breakdown */}
            <div className="mt-5 space-y-2">
              {starCounts.map(({ stars, count, percentage }) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => {
                    setFilterStar((prev) => (prev === stars ? "all" : stars));
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-1 py-0.5 text-xs transition hover:bg-white",
                    filterStar === stars && "bg-white ring-1 ring-[#2563EB]",
                  )}
                >
                  <span className="w-10 text-left font-medium text-slate-700">
                    {stars} star
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-slate-500">
                    {count} ({percentage}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Bar + Approved Review Cards */}
        <div className="space-y-5 md:col-span-8">
          {totalCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              {/* Rating filter pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStar("all");
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    filterStar === "all"
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  All Ratings ({totalCount})
                </button>
                {[5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setFilterStar(s);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                      filterStar === s
                        ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                        : "border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    {s} ★
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "recent" | "highest" | "lowest")
                }
                aria-label="Sort reviews"
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          )}

          {visibleReviews.length > 0 ? (
            <>
              <div className="divide-y divide-[#E2E8F0]">
                {visibleReviews.map((rev) => (
                  <article key={rev.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-xs font-bold text-[#2563EB]">
                          {rev.display_name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">
                            {rev.display_name}
                          </p>
                          {rev.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                              <CheckCircle2 size={11} />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>

                      <time
                        dateTime={rev.created_at}
                        className="text-xs text-slate-400"
                      >
                        {new Date(rev.created_at).toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={cn(
                            i < rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-200 text-slate-200",
                          )}
                        />
                      ))}
                      {rev.title && (
                        <span className="ml-2 text-sm font-bold text-[#0F172A]">
                          {rev.title}
                        </span>
                      )}
                    </div>

                    {rev.comment && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {rev.comment}
                      </p>
                    )}

                    {/* Review Photos */}
                    {rev.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rev.images.map((imgUrl, idx) => (
                          <button
                            key={imgUrl}
                            type="button"
                            onClick={() => setLightboxImage(imgUrl)}
                            aria-label={`View review photo ${idx + 1}`}
                            className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] transition hover:border-[#2563EB]"
                          >
                            <Image
                              src={imgUrl}
                              alt={`Customer photo ${idx + 1}`}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {hasMore && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-xs font-bold text-[#0F172A] transition hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    Load More Reviews (
                    {filteredAndSorted.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-6 py-10 text-center">
              <MessageSquare size={28} className="text-slate-300" />
              <p className="mt-2.5 text-sm font-semibold text-[#0F172A]">
                {totalCount > 0
                  ? "No reviews match this rating filter."
                  : "No reviews yet."}
              </p>
              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterStar("all")}
                  className="mt-2 text-xs font-bold text-[#2563EB] hover:underline"
                >
                  Show all ratings
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Modal */}
      {modalOpen && eligibility.orderId && (
        <ReviewFormModal
          target={{
            productId,
            productName,
            productImageUrl,
            orderId: eligibility.orderId,
            orderItemId: eligibility.orderItemId,
          }}
          onClose={() => setModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Review Image Lightbox */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/90 p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Close photo"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X size={20} />
          </button>
          <div className="relative h-[75vh] w-full max-w-3xl">
            <Image
              src={lightboxImage}
              alt="Customer review photo"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
