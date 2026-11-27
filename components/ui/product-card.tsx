"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Eye,
  Heart,
  Star,
  Laptop,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  BookOpen,
  Car,
  Gem,
  Baby,
  Utensils,
} from "lucide-react";
import { DiscountBadge, StockBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import CardAddToCart from "@/components/ui/card-add-to-cart";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  is_featured?: boolean;
  imageUrl?: string | null;
  category?: string | null;
  categorySlug?: string | null;
  description?: string | null;
  rating?: number | null;
  reviewCount?: number;
};

interface ProductCardProps {
  product: ProductCardData;
  /**
   * "deal" = Today's Best Deals card with Add to Cart + Quick View buttons
   * "compact" = Featured / New Arrivals / Best Sellers compact card
   * "default" = Standard listing card (used on /products page)
   */
  variant?: "default" | "deal" | "compact" | "minimal";
  viewMode?: "grid" | "list";
  isWishlisted?: boolean;
  wishlistPending?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onQuickView?: (product: ProductCardData) => void;
  onToast?: (type: "success" | "error", message: string) => void;
}

function CategoryPlaceholder({
  category,
  size = 38,
}: {
  category?: string | null;
  size?: number;
}) {
  const c = (category ?? "").toLowerCase();
  let Icon = Package;
  if (c.includes("electr") || c.includes("tech") || c.includes("phone")) {
    Icon = Laptop;
  } else if (c.includes("fashion") || c.includes("cloth")) {
    Icon = Shirt;
  } else if (c.includes("home") || c.includes("kitchen") || c.includes("garden")) {
    Icon = Home;
  } else if (c.includes("beauty") || c.includes("health")) {
    Icon = Sparkles;
  } else if (c.includes("sport") || c.includes("fitness")) {
    Icon = Dumbbell;
  } else if (c.includes("book") || c.includes("office")) {
    Icon = BookOpen;
  } else if (c.includes("auto") || c.includes("motor")) {
    Icon = Car;
  } else if (c.includes("jewel") || c.includes("watch")) {
    Icon = Gem;
  } else if (c.includes("baby") || c.includes("kid") || c.includes("toy")) {
    Icon = Baby;
  } else if (c.includes("grocer") || c.includes("food")) {
    Icon = Utensils;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50/90 text-slate-300">
      <Icon size={size} strokeWidth={1.6} />
      {category && (
        <span className="mt-1.5 max-w-[80%] truncate text-[10px] font-medium text-slate-400">
          {category}
        </span>
      )}
    </div>
  );
}

function StarRating({
  rating,
  reviewCount,
}: {
  rating?: number | null;
  reviewCount?: number;
}) {
  if (!reviewCount || reviewCount <= 0 || rating == null) return null;

  return (
    <div className="mt-1 flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={11}
            className={
              i < Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-[#0A1633]">
        {rating.toFixed(1)}
      </span>
      <span className="text-[11px] text-gray-400">({reviewCount})</span>
    </div>
  );
}

export default function ProductCard({
  product,
  variant = "default",
  viewMode = "grid",
  isWishlisted = false,
  wishlistPending = false,
  onToggleWishlist,
  onQuickView,
  onToast,
}: ProductCardProps) {
  const {
    id,
    name,
    slug,
    price,
    compare_at_price,
    stock_quantity,
    imageUrl,
    category,
    description,
    rating,
    reviewCount,
  } = product;

  const hasDiscount =
    compare_at_price != null && Number(compare_at_price) > Number(price);
  const isOutOfStock = stock_quantity <= 0;

  /* ── Wishlist Button Helper ──────────────────────────────────── */
  const wishlistBtn = onToggleWishlist ? (
    <button
      type="button"
      onClick={() => onToggleWishlist(id)}
      disabled={wishlistPending}
      aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition ${
        isWishlisted
          ? "text-red-500 hover:bg-red-50"
          : "text-[#1049C6] hover:bg-[#1049C6] hover:text-white"
      } disabled:opacity-60`}
    >
      <Heart size={14} className={isWishlisted ? "fill-red-500" : ""} />
    </button>
  ) : (
    <Link
      href={`/products/${slug}`}
      aria-label={`View ${name}`}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#1049C6] shadow-sm transition hover:bg-[#1049C6] hover:text-white"
    >
      <Heart size={14} />
    </Link>
  );

  /* ── Compact Variant (Homepage Featured / New Arrivals / Best Sellers) ── */
  if (variant === "compact") {
    return (
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
        {hasDiscount && (
          <div className="absolute left-2.5 top-2.5 z-10">
            <DiscountBadge
              price={Number(price)}
              compareAtPrice={Number(compare_at_price)}
              className="px-1.5 py-0.5 text-[10px]"
            />
          </div>
        )}

        <div className="absolute right-2.5 top-2.5 z-10">{wishlistBtn}</div>

        <Link
          href={`/products/${slug}`}
          className="relative block overflow-hidden bg-white"
        >
          <div className="aspect-square w-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
                className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <CategoryPlaceholder category={category} size={28} />
            )}
          </div>
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="rounded bg-gray-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-3">
          <Link
            href={`/products/${slug}`}
            className="line-clamp-2 flex-1 text-xs font-semibold leading-snug text-[#0F172A] transition-colors hover:text-[#1049C6]"
          >
            {name}
          </Link>

          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-[#0F172A]">
              {formatPrice(Number(price))}
            </span>
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(Number(compare_at_price))}
              </span>
            )}
          </div>

          <div className="mt-1.5">
            <StockBadge quantity={stock_quantity} className="text-[11px]" />
          </div>
        </div>
      </div>
    );
  }

  /* ── List View Variant (/products page) ──────────────────────── */
  if (viewMode === "list") {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:flex-row">
        {/* Image */}
        <Link
          href={`/products/${slug}`}
          className="relative flex aspect-[4/3] w-full flex-shrink-0 items-center justify-center overflow-hidden bg-white p-3 sm:aspect-square sm:w-48"
        >
          {hasDiscount && (
            <div className="absolute left-3 top-3 z-10">
              <DiscountBadge
                price={Number(price)}
                compareAtPrice={Number(compare_at_price)}
                className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold"
              />
            </div>
          )}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <CategoryPlaceholder category={category} size={36} />
          )}
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                {category && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1049C6]">
                    {category}
                  </p>
                )}
                <Link
                  href={`/products/${slug}`}
                  className="mt-0.5 block text-base font-bold text-[#0A1633] transition-colors hover:text-[#1049C6]"
                >
                  {name}
                </Link>
              </div>
              {wishlistBtn}
            </div>

            <StarRating rating={rating} reviewCount={reviewCount} />

            {description && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-[#0A1633]">
                  {formatPrice(Number(price))}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(Number(compare_at_price))}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <StockBadge quantity={stock_quantity} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-36">
                <CardAddToCart
                  productId={id}
                  stockQuantity={stock_quantity}
                  slug={slug}
                  onSuccess={(msg) => onToast?.("success", msg)}
                  onError={(msg) => onToast?.("error", msg)}
                />
              </div>
              {onQuickView ? (
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  aria-label={`Quick view ${name}`}
                  className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                >
                  <Eye size={14} />
                </button>
              ) : (
                <Link
                  href={`/products/${slug}`}
                  aria-label={`Quick view ${name}`}
                  className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                >
                  <Eye size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Deal / Default Grid Variant ─────────────────────────────── */
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Discount badge top-left */}
      {hasDiscount && (
        <div className="absolute left-3 top-3 z-10">
          <DiscountBadge
            price={Number(price)}
            compareAtPrice={Number(compare_at_price)}
            className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold"
          />
        </div>
      )}

      {/* Wishlist heart top-right */}
      <div className="absolute right-3 top-3 z-10">{wishlistBtn}</div>

      {/* Image */}
      <Link
        href={`/products/${slug}`}
        className="relative block overflow-hidden bg-white"
        tabIndex={-1}
      >
        <div className="aspect-square w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <CategoryPlaceholder category={category} size={36} />
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <span className="rounded-lg bg-gray-900/85 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col border-t border-gray-100/80 p-3.5">
        {category && variant === "default" && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#1049C6]">
            {category}
          </p>
        )}

        <Link
          href={`/products/${slug}`}
          className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-[#0A1633] transition-colors hover:text-[#1049C6]"
        >
          {name}
        </Link>

        {/* Star Rating */}
        <StarRating rating={rating} reviewCount={reviewCount} />

        {/* Price */}
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-extrabold text-[#0A1633]">
            {formatPrice(Number(price))}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(Number(compare_at_price))}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="mt-1.5">
          <StockBadge quantity={stock_quantity} />
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {variant === "minimal" ? (
            <Link
              href={`/products/${slug}`}
              className="flex w-full items-center justify-center rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#1049C6] hover:text-[#1049C6]"
            >
              View Details
            </Link>
          ) : (
            <>
              <div className="flex-1">
                <CardAddToCart
                  productId={id}
                  stockQuantity={stock_quantity}
                  slug={slug}
                  onSuccess={(msg) => onToast?.("success", msg)}
                  onError={(msg) => onToast?.("error", msg)}
                />
              </div>
              {onQuickView ? (
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  aria-label={`Quick view ${name}`}
                  className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                >
                  <Eye size={14} />
                </button>
              ) : (
                <Link
                  href={`/products/${slug}`}
                  aria-label={`Quick view ${name}`}
                  className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                >
                  <Eye size={14} />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
