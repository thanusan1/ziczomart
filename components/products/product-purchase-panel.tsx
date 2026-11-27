"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Heart,
  Loader2,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, discountPercent, formatPrice } from "@/lib/utils";

export type ProductVariantOption = {
  id: string;
  name: string;
  group: string;
  colorHex?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number | null;
  sku?: string | null;
  imageUrl?: string | null;
};

export interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  productSlug: string;
  sku: string | null;
  brand: string | null;
  categoryName: string | null;
  categoryHref: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  shortDescription: string | null;
  keyFeatures: string[];
  variants?: ProductVariantOption[];
  rating: number | null;
  reviewCount: number;
  onSelectVariantImage?: (url: string | null) => void;
}

export default function ProductPurchasePanel({
  productId,
  productName,
  productSlug,
  sku,
  brand,
  categoryName,
  categoryHref,
  price,
  compareAtPrice,
  stockQuantity,
  shortDescription,
  keyFeatures,
  variants = [],
  rating,
  reviewCount,
  onSelectVariantImage,
}: ProductPurchasePanelProps) {
  const router = useRouter();

  // Group variants by group name if any exist
  const variantGroups = variants.reduce<Record<string, ProductVariantOption[]>>(
    (acc, v) => {
      const key = v.group || "Option";
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    },
    {},
  );
  const groupEntries = Object.entries(variantGroups);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    () => {
      const firstAvailable = variants.find(
        (v) => v.stockQuantity == null || v.stockQuantity > 0,
      );
      return firstAvailable?.id ?? variants[0]?.id ?? null;
    },
  );

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? null;

  const activePrice = selectedVariant?.price ?? price;
  const activeComparePrice =
    selectedVariant?.compareAtPrice !== undefined
      ? selectedVariant.compareAtPrice
      : compareAtPrice;
  const activeStock =
    selectedVariant?.stockQuantity !== undefined &&
    selectedVariant.stockQuantity !== null
      ? selectedVariant.stockQuantity
      : stockQuantity;
  const activeSku = selectedVariant?.sku ?? sku;

  const hasDiscount =
    activeComparePrice != null && activeComparePrice > activePrice;
  const pctOff = hasDiscount
    ? discountPercent(activePrice, activeComparePrice!)
    : 0;
  const savingsAmount = hasDiscount ? activeComparePrice! - activePrice : 0;

  const [quantity, setQuantity] = useState(1);
  const effectiveQuantity =
    activeStock <= 0 ? 1 : Math.min(quantity, activeStock);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load initial wishlist state for current user
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function checkWishlist() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || !mounted) {
        if (mounted) setWishlisted(false);
        return;
      }
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (mounted) setWishlisted(Boolean(data));
    }

    checkWishlist();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkWishlist();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [productId]);

  function handleVariantSelect(variant: ProductVariantOption) {
    if (variant.stockQuantity !== undefined && variant.stockQuantity !== null && variant.stockQuantity <= 0) {
      return;
    }
    setSelectedVariantId(variant.id);
    if (onSelectVariantImage) {
      onSelectVariantImage(variant.imageUrl ?? null);
    }
  }

  async function addProductToCart(): Promise<boolean> {
    if (activeStock <= 0) {
      setFeedback({ type: "error", text: "This product is currently out of stock." });
      return false;
    }

    const supabase = createClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!session?.user) {
      router.push(
        `/login?next=${encodeURIComponent(`/products/${productSlug}`)}`,
      );
      return false;
    }

    const userId = session.user.id;

    // Get or create cart
    const { data: existingCart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cartError) throw new Error(cartError.message);

    let cartId = existingCart?.id;

    if (!cartId) {
      const { data: newCart, error: createCartError } = await supabase
        .from("carts")
        .insert({ user_id: userId })
        .select("id")
        .single();

      if (createCartError) throw new Error(createCartError.message);
      cartId = newCart.id;
    }

    // Check existing item in cart_items
    const { data: existingItem, error: itemError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();

    if (itemError) throw new Error(itemError.message);

    const newQuantity = (existingItem?.quantity ?? 0) + effectiveQuantity;
    if (newQuantity > activeStock) {
      throw new Error(
        `Only ${activeStock} item(s) available in stock (you already have ${existingItem?.quantity ?? 0} in your cart).`,
      );
    }

    if (existingItem) {
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id);
      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity: effectiveQuantity,
        });
      if (insertError) throw new Error(insertError.message);
    }

    window.dispatchEvent(new CustomEvent("ziczomart:cart-updated"));
    router.refresh();
    return true;
  }

  async function handleAddToCart() {
    setCartLoading(true);
    setFeedback(null);
    try {
      const added = await addProductToCart();
      if (added) {
        setFeedback({
          type: "success",
          text: `${productName} added to your cart.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error ? err.message : "Could not add product to cart.",
      });
    } finally {
      setCartLoading(false);
    }
  }

  async function handleBuyNow() {
    setBuyNowLoading(true);
    setFeedback(null);
    try {
      const added = await addProductToCart();
      if (added) {
        router.push("/checkout");
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Could not proceed to checkout.",
      });
    } finally {
      setBuyNowLoading(false);
    }
  }

  async function handleToggleWishlist() {
    setWishlistPending(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push(
          `/login?next=${encodeURIComponent(`/products/${productSlug}`)}`,
        );
        return;
      }

      const userId = session.user.id;
      if (wishlisted) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);
        if (error) throw new Error(error.message);
        setWishlisted(false);
        setFeedback({ type: "success", text: "Removed from your wishlist." });
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: userId, product_id: productId });
        if (error) throw new Error(error.message);
        setWishlisted(true);
        setFeedback({ type: "success", text: "Saved to your wishlist." });
      }
      window.dispatchEvent(new CustomEvent("ziczomart:wishlist-updated"));
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error ? err.message : "Could not update wishlist.",
      });
    } finally {
      setWishlistPending(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFeedback({ type: "error", text: "Unable to copy link." });
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: productName,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to copy
      }
    }
    await handleCopyLink();
  }

  function scrollToReviews() {
    const el = document.getElementById("reviews");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  const badgeLabel = brand || categoryName;
  const isOutOfStock = activeStock <= 0;
  const busy = cartLoading || buyNowLoading;

  return (
    <>
      <div className="flex flex-col">
        {/* Brand / Category Badge */}
        {badgeLabel && (
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            {categoryHref && !brand ? (
              <Link
                href={categoryHref}
                className="inline-flex items-center rounded-md bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB] transition hover:bg-blue-100"
              >
                {badgeLabel}
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-md bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                {badgeLabel}
              </span>
            )}
            {activeSku && (
              <span className="text-xs font-medium text-slate-400">
                SKU: <span className="text-slate-600">{activeSku}</span>
              </span>
            )}
          </div>
        )}

        {/* Product Name */}
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0F172A] sm:text-[26px]">
          {productName}
        </h1>

        {/* Customer Rating */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {reviewCount > 0 && rating !== null ? (
            <button
              type="button"
              onClick={scrollToReviews}
              className="inline-flex items-center gap-1.5 text-sm transition hover:opacity-80"
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={
                      i < Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                    }
                  />
                ))}
              </span>
              <span className="font-bold text-[#0F172A]">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-[#2563EB]">
                ({reviewCount} {reviewCount === 1 ? "Review" : "Reviews"})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={scrollToReviews}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-[#2563EB]"
            >
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-slate-200 text-slate-200"
                  />
                ))}
              </span>
              <span>Be the first to review</span>
            </button>
          )}
        </div>

        {/* Price Section */}
        <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
          <span className="text-2xl font-extrabold tracking-tight text-[#2563EB] sm:text-3xl">
            {formatPrice(activePrice)}
          </span>

          {hasDiscount && (
            <>
              <span className="text-base font-medium text-slate-400 line-through">
                {formatPrice(activeComparePrice!)}
              </span>
              <span className="inline-flex items-center rounded-md bg-[#DC2626] px-2 py-0.5 text-xs font-bold text-white">
                {pctOff}% OFF
              </span>
            </>
          )}
        </div>

        {hasDiscount && savingsAmount > 0 && (
          <p className="mt-1 text-xs font-medium text-[#16A34A]">
            You save {formatPrice(savingsAmount)}
          </p>
        )}

        {/* Stock Status */}
        <div className="mt-3">
          {activeStock > 10 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#16A34A]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
              In Stock
            </span>
          ) : activeStock > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Only {activeStock} left in stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#DC2626]">
              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Short Description */}
        {shortDescription && (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {shortDescription}
          </p>
        )}

        {/* Key Features (only shown if valid features exist) */}
        {keyFeatures.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Key Features:
            </p>
            <ul className="space-y-1.5">
              {keyFeatures.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <Check
                    size={16}
                    className="mt-0.5 flex-shrink-0 text-[#16A34A]"
                  />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dynamic Variants (only shown if product actually has variants) */}
        {groupEntries.length > 0 && (
          <div className="mt-5 space-y-4">
            {groupEntries.map(([groupName, options]) => (
              <div key={groupName}>
                <p className="mb-2 text-xs font-bold text-[#0F172A]">
                  {groupName}:{" "}
                  <span className="font-semibold text-slate-600">
                    {selectedVariant?.group === groupName
                      ? selectedVariant.name
                      : options[0]?.name}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const isSelected = opt.id === selectedVariant?.id;
                    const unavailable =
                      opt.stockQuantity !== undefined &&
                      opt.stockQuantity !== null &&
                      opt.stockQuantity <= 0;

                    if (opt.colorHex) {
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleVariantSelect(opt)}
                          disabled={unavailable}
                          title={opt.name}
                          aria-label={`${groupName}: ${opt.name}`}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full border-2 p-0.5 transition",
                            isSelected
                              ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                              : "border-[#E2E8F0] hover:border-slate-400",
                            unavailable && "cursor-not-allowed opacity-40",
                          )}
                        >
                          <span
                            className="h-full w-full rounded-full border border-black/10"
                            style={{ backgroundColor: opt.colorHex }}
                          />
                        </button>
                      );
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleVariantSelect(opt)}
                        disabled={unavailable}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                          isSelected
                            ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                            : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-slate-300",
                          unavailable &&
                            "cursor-not-allowed line-through opacity-40",
                        )}
                      >
                        {opt.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="my-5 border-t border-[#E2E8F0]" />

        {/* Quantity Selector + Purchase Buttons */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quantity Control */}
            <div
              className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
              aria-label="Quantity selector"
            >
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.max(1, Math.min(q, activeStock) - 1))
                }
                disabled={effectiveQuantity <= 1 || isOutOfStock || busy}
                aria-label="Decrease quantity"
                className="flex h-full w-10 items-center justify-center text-slate-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={15} />
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-bold text-[#0F172A]">
                {effectiveQuantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(Math.max(1, activeStock), q + 1))
                }
                disabled={
                  effectiveQuantity >= activeStock || isOutOfStock || busy
                }
                aria-label="Increase quantity"
                className="flex h-full w-10 items-center justify-center text-slate-600 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Add to Cart + Buy Now */}
            <div className="flex min-w-[220px] flex-1 gap-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || busy}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-xs transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {cartLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <ShoppingCart size={17} />
                )}
                <span>{cartLoading ? "Adding..." : "Add to Cart"}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || busy}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 text-sm font-bold text-white shadow-xs transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {buyNowLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Zap size={17} />
                )}
                <span>{buyNowLoading ? "Processing..." : "Buy Now"}</span>
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              role="status"
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-xs font-medium",
                feedback.type === "success"
                  ? "border border-green-200 bg-green-50 text-[#16A34A]"
                  : "border border-red-200 bg-red-50 text-[#DC2626]",
              )}
            >
              {feedback.text}
            </div>
          )}

          {/* Secondary Action Links: Wishlist | Share | Copy Link */}
          <div className="flex flex-wrap items-center gap-5 pt-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistPending}
              className={cn(
                "inline-flex items-center gap-1.5 transition hover:text-[#2563EB]",
                wishlisted && "text-[#DC2626] hover:text-[#DC2626]",
              )}
            >
              <Heart
                size={15}
                className={wishlisted ? "fill-[#DC2626] text-[#DC2626]" : ""}
              />
              <span>{wishlisted ? "In Wishlist" : "Add to Wishlist"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 transition hover:text-[#2563EB]"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 transition hover:text-[#2563EB]"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-[#16A34A]" />
                  <span className="text-[#16A34A]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Purchase Bar ─────────────────────────── */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[#E2E8F0] bg-white/95 px-4 py-2.5 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-[#2563EB]">
              {formatPrice(activePrice)}
            </p>
            {hasDiscount && (
              <p className="text-[11px] text-slate-400 line-through">
                {formatPrice(activeComparePrice!)}
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || busy}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-4 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:bg-slate-300"
            >
              {cartLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ShoppingCart size={15} />
              )}
              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </button>

            {!isOutOfStock && (
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={busy}
                className="flex h-10 items-center justify-center gap-1 rounded-xl bg-[#0F172A] px-3.5 text-xs font-bold text-white transition hover:bg-[#1E293B] disabled:bg-slate-300"
              >
                {buyNowLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Zap size={15} />
                )}
                <span>Buy Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
