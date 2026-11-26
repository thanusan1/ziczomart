import Image from "next/image";
import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
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
  variant?: "default" | "minimal";
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

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute left-3 top-3 z-10">
          <DiscountBadge
            price={Number(price)}
            compareAtPrice={Number(compare_at_price)}
          />
        </div>
      )}

      {/* Image */}
      <Link
        href={`/products/${slug}`}
        className="relative block overflow-hidden bg-gray-50"
        tabIndex={-1}
      >
        <div className="aspect-square w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package size={36} className="text-gray-200" />
            </div>
          )}
        </div>

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-lg bg-gray-900/80 px-3 py-1.5 text-xs font-bold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        {category && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-500">
            {category}
          </p>
        )}

        {/* Name */}
        <Link
          href={`/products/${slug}`}
          className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-gray-800 transition-colors hover:text-orange-500"
        >
          {name}
        </Link>

        {/* Price row */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-gray-900">
            {formatPrice(Number(price))}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(Number(compare_at_price))}
            </span>
          )}
        </div>

        {/* Stock */}
        {!isOutOfStock && stock_quantity <= 10 && (
          <div className="mt-1.5">
            <StockBadge quantity={stock_quantity} />
          </div>
        )}

        {/* Action */}
        <div className="mt-4">
          {variant === "default" ? (
            <CardAddToCart
              productId={id}
              stockQuantity={stock_quantity}
              slug={slug}
            />
          ) : (
            <Link
              href={`/products/${slug}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
            >
              <ShoppingCart size={13} />
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
