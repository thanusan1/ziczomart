import Image from "next/image";
import Link from "next/link";
import { Package, Eye, Heart } from "lucide-react";
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
};

interface ProductCardProps {
  product: ProductCardData;
  /**
   * "deal" = Today's Best Deals card with Add to Cart + Quick View buttons
   * "compact" = Featured / New Arrivals / Best Sellers compact card
   * "default" = Standard listing card (used on /products page)
   */
  variant?: "default" | "deal" | "compact" | "minimal";
}

export default function ProductCard({
  product,
  variant = "default",
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
  } = product;

  const hasDiscount =
    compare_at_price != null && Number(compare_at_price) > Number(price);
  const isOutOfStock = stock_quantity <= 0;

  /* ── Compact Variant (Featured / New Arrivals / Best Sellers) ── */
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

        <Link
          href={`/products/${slug}`}
          aria-label={`View ${name}`}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#1049C6] shadow-sm transition hover:bg-[#1049C6] hover:text-white"
        >
          <Heart size={13} />
        </Link>

        <Link
          href={`/products/${slug}`}
          className="relative block overflow-hidden bg-gray-50/70"
        >
          <div className="aspect-square w-full">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 18vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package size={28} className="text-gray-300" />
              </div>
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

  /* ── Deal / Default Variant ──────────────────────────────────── */
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

      {/* Quick view icon top-right */}
      <Link
        href={`/products/${slug}`}
        aria-label={`View ${name}`}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#1049C6] shadow-sm transition hover:bg-[#1049C6] hover:text-white"
      >
        <Heart size={14} />
      </Link>

      {/* Image */}
      <Link
        href={`/products/${slug}`}
        className="relative block overflow-hidden bg-gray-50/80"
        tabIndex={-1}
      >
        <div className="aspect-[4/3] w-full sm:aspect-square">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package size={36} className="text-gray-300" />
            </div>
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
      <div className="flex flex-1 flex-col p-3.5">
        {category && variant === "default" && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#1049C6]">
            {category}
          </p>
        )}

        <Link
          href={`/products/${slug}`}
          className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-[#0F172A] transition-colors hover:text-[#1049C6]"
        >
          {name}
        </Link>

        {/* Stock */}
        <div className="mt-1.5">
          <StockBadge quantity={stock_quantity} />
        </div>

        {/* Price */}
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-extrabold text-[#0F172A]">
            {formatPrice(Number(price))}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(Number(compare_at_price))}
            </span>
          )}
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
                />
              </div>
              <Link
                href={`/products/${slug}`}
                aria-label={`Quick view ${name}`}
                className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
              >
                <Eye size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
