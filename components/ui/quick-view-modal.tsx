"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Star,
  Heart,
  ExternalLink,
  Package,
} from "lucide-react";
import { DiscountBadge, StockBadge } from "@/components/ui/badge";
import CardAddToCart from "@/components/ui/card-add-to-cart";
import { formatPrice } from "@/lib/utils";
import type { ProductCardData } from "@/components/ui/product-card";

interface QuickViewModalProps {
  product: ProductCardData | null;
  onClose: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onToast?: (type: "success" | "error", message: string) => void;
}

export default function QuickViewModal({
  product,
  onClose,
  isWishlisted = false,
  onToggleWishlist,
  onToast,
}: QuickViewModalProps) {
  useEffect(() => {
    if (!product) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [product, onClose]);

  if (!product) return null;

  const hasDiscount =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > Number(product.price);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A1633]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
        >
          <X size={18} />
        </button>

        <div className="grid sm:grid-cols-2">
          {/* Image */}
          <div className="relative flex aspect-square items-center justify-center bg-slate-50 p-6">
            {hasDiscount && (
              <div className="absolute left-4 top-4 z-10">
                <DiscountBadge
                  price={Number(product.price)}
                  compareAtPrice={Number(product.compare_at_price)}
                  className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold"
                />
              </div>
            )}
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 90vw, 320px"
                className="object-contain p-6"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300">
                <Package size={56} />
                <span className="mt-2 text-xs font-medium text-gray-400">
                  No image available
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col p-6">
            {product.category && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1049C6]">
                {product.category}
              </p>
            )}

            <h2
              id="quick-view-title"
              className="mt-1.5 pr-8 text-lg font-extrabold leading-snug text-[#0A1633]"
            >
              {product.name}
            </h2>

            {product.reviewCount != null && product.reviewCount > 0 && product.rating != null && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={
                        i < Math.round(product.rating!)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#0A1633]">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-[#0A1633]">
                {formatPrice(Number(product.price))}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(Number(product.compare_at_price))}
                </span>
              )}
            </div>

            <div className="mt-2.5">
              <StockBadge quantity={product.stock_quantity} />
            </div>

            {product.description && (
              <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-slate-600">
                {product.description}
              </p>
            )}

            <div className="mt-auto space-y-2.5 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CardAddToCart
                    productId={product.id}
                    stockQuantity={product.stock_quantity}
                    slug={product.slug}
                    onSuccess={(msg) => onToast?.("success", msg)}
                    onError={(msg) => onToast?.("error", msg)}
                  />
                </div>
                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                    className={`flex h-[34px] w-[38px] items-center justify-center rounded-lg border transition ${
                      isWishlisted
                        ? "border-red-200 bg-red-50 text-red-500"
                        : "border-gray-200 text-gray-500 hover:border-[#1049C6] hover:text-[#1049C6]"
                    }`}
                  >
                    <Heart
                      size={15}
                      className={isWishlisted ? "fill-red-500" : ""}
                    />
                  </button>
                )}
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-[#0A1633] transition hover:border-[#1049C6] hover:text-[#1049C6]"
              >
                View Full Product Details <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
