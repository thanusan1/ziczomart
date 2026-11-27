"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ImagePlus,
  Loader2,
  Package,
  Star,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitProductReviewAction } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 4;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_COMMENT_LENGTH = 10;
const MAX_COMMENT_LENGTH = 1500;

export interface ReviewFormTarget {
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  variantLabel?: string | null;
  orderId: string;
  orderItemId?: string | null;
}

interface ReviewFormModalProps {
  target: ReviewFormTarget;
  onClose: () => void;
  onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ReviewFormModal({
  target,
  onClose,
  onSuccess,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (files.length + selected.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} photos per review.`);
      return;
    }

    const valid: File[] = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPG, PNG, and WebP images are allowed.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("Each review image must be 5 MB or smaller.");
        return;
      }
      valid.push(file);
    }

    setError("");
    const newUrls = valid.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [...prev, ...newUrls]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < MIN_COMMENT_LENGTH) {
      setError(
        `Please share at least ${MIN_COMMENT_LENGTH} characters about your experience.`,
      );
      return;
    }

    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      setError(
        `Your review description cannot exceed ${MAX_COMMENT_LENGTH} characters.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      if (files.length > 0) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        const userId = session.user.id;

        for (const file of files) {
          const ext =
            file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
                ? "webp"
                : "jpg";
          const safeRandom = Math.random().toString(36).slice(2, 10);
          const filePath = `${userId}/${target.productId}/${Date.now()}-${safeRandom}.${ext}`;

          const { error: uploadErr } = await supabase.storage
            .from("review-images")
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadErr) {
            throw new Error(
              uploadErr.message.includes("Bucket not found")
                ? "Review image storage is not configured yet. Please submit without photos or contact support."
                : `Failed to upload image: ${uploadErr.message}`,
            );
          }

          const { data: publicData } = supabase.storage
            .from("review-images")
            .getPublicUrl(filePath);
          uploadedUrls.push(publicData.publicUrl);
        }
      }

      const result = await submitProductReviewAction({
        productId: target.productId,
        orderId: target.orderId,
        orderItemId: target.orderItemId,
        rating,
        title,
        comment: trimmedComment,
        images: uploadedUrls,
      });

      if (!result.ok) {
        throw new Error(result.error ?? "Could not submit your review.");
      }

      previews.forEach((url) => URL.revokeObjectURL(url));
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="write-review-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4 sm:px-6">
          <h2
            id="write-review-heading"
            className="text-lg font-extrabold text-[#0F172A]"
          >
            Write a Review
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close review form"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {/* Purchased Product Preview */}
          <div className="flex items-center gap-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
              {target.productImageUrl ? (
                <Image
                  src={target.productImageUrl}
                  alt={target.productName}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <Package size={22} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-bold text-[#0F172A]">
                {target.productName}
              </p>
              {target.variantLabel && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {target.variantLabel}
                </p>
              )}
              <span className="mt-1 inline-block rounded bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#2563EB]">
                Verified Delivered Purchase
              </span>
            </div>
          </div>

          {/* A. Star Rating */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Star Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} out of 5 stars`}
                    className="rounded-md p-1 transition hover:scale-110"
                  >
                    <Star
                      size={26}
                      className={cn(
                        "transition-colors",
                        star <= displayRating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-300",
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-[#2563EB]">
                {displayRating}/5 · {RATING_LABELS[displayRating]}
              </span>
            </div>
          </div>

          {/* B. Review Title */}
          <div>
            <label
              htmlFor="modal-review-title"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0F172A]"
            >
              Review Title <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="modal-review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Give your review a title"
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB]"
            />
          </div>

          {/* C. Review Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="modal-review-comment"
                className="text-xs font-bold uppercase tracking-wider text-[#0F172A]"
              >
                Your Review <span className="text-red-500">*</span>
              </label>
              <span
                className={cn(
                  "text-[11px]",
                  comment.trim().length < MIN_COMMENT_LENGTH
                    ? "text-slate-400"
                    : "text-[#16A34A]",
                )}
              >
                {comment.length} / {MAX_COMMENT_LENGTH}
              </span>
            </div>
            <textarea
              id="modal-review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={MAX_COMMENT_LENGTH}
              required
              placeholder="Share your experience with this product..."
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#2563EB]"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Minimum {MIN_COMMENT_LENGTH} characters.
            </p>
          </div>

          {/* D. Photo Upload */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Add Photos{" "}
              <span className="font-normal text-slate-400">
                (optional, up to {MAX_FILES} · JPG/PNG/WebP · max 5MB each)
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {previews.map((src, idx) => (
                <div
                  key={src}
                  className="relative h-16 w-16 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                >
                  <Image
                    src={src}
                    alt={`Review preview ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0F172A]/80 text-white hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {files.length < MAX_FILES && (
                <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] text-slate-500 transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]">
                  <ImagePlus size={18} />
                  <span className="mt-0.5 text-[10px] font-semibold">Add</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* E. Submit Button */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <span>{submitting ? "Submitting..." : "Submit Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
