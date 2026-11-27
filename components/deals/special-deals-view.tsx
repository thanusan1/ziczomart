"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Flame,
  Package,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Breadcrumb from "@/components/ui/breadcrumb";
import ProductCard, { type ProductCardData } from "@/components/ui/product-card";
import CountdownTimer from "@/components/deals/countdown-timer";
import { cn, discountPercent, formatPrice } from "@/lib/utils";

export type DealProductItem = ProductCardData & {
  dealId: string;
  dealName: string;
  dealEndAt: string | null;
  isFeaturedDeal: boolean;
  displayPriority: number;
  createdAt: string;
  categoryId: string | null;
};

export type DealCategoryTab = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

interface SpecialDealsViewProps {
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl: string | null;
  products: DealProductItem[];
  categories: DealCategoryTab[];
}

export default function SpecialDealsView({
  heroTitle,
  heroSubtitle,
  heroBannerUrl,
  products,
  categories,
}: SpecialDealsViewProps) {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "featured" | "discount" | "price-asc" | "price-desc" | "newest"
  >("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Wishlist state
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistPendingId, setWishlistPendingId] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  }

  useEffect(() => {
    const supabase = createClient();

    async function loadWishlist() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setWishlistedIds(new Set());
        return;
      }

      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", session.user.id);

      setWishlistedIds(new Set((data ?? []).map((w) => w.product_id)));
    }

    loadWishlist();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadWishlist());
    return () => subscription.unsubscribe();
  }, []);

  async function handleToggleWishlist(productId: string) {
    setWishlistPendingId(productId);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login?next=/products?deals=true");
        return;
      }

      const userId = session.user.id;
      const saved = wishlistedIds.has(productId);

      if (saved) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);
        if (error) throw new Error(error.message);

        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        showToast("success", "Removed from wishlist");
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: userId, product_id: productId });
        if (error) throw new Error(error.message);

        setWishlistedIds((prev) => new Set(prev).add(productId));
        showToast("success", "Saved to wishlist");
      }

      window.dispatchEvent(new CustomEvent("ziczomart:wishlist-updated"));
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Could not update wishlist",
      );
    } finally {
      setWishlistPendingId(null);
    }
  }

  // Featured Flash Deals (from featured campaigns or top discounted deals with real endAt)
  const flashDeals = useMemo(() => {
    const featured = products.filter((p) => p.isFeaturedDeal);
    const pool = featured.length > 0 ? featured : products;
    return pool.slice(0, 4);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const minP = minPrice.trim() ? Number(minPrice) : null;
    const maxP = maxPrice.trim() ? Number(maxPrice) : null;

    const list = products.filter((p) => {
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
        return false;
      }
      if (inStockOnly && p.stock_quantity <= 0) return false;

      const pct =
        p.compare_at_price && p.compare_at_price > p.price
          ? discountPercent(p.price, p.compare_at_price)
          : 0;
      if (minDiscount > 0 && pct < minDiscount) return false;

      if (minP !== null && Number.isFinite(minP) && p.price < minP) return false;
      if (maxP !== null && Number.isFinite(maxP) && p.price > maxP) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      const pctA =
        a.compare_at_price && a.compare_at_price > a.price
          ? discountPercent(a.price, a.compare_at_price)
          : 0;
      const pctB =
        b.compare_at_price && b.compare_at_price > b.price
          ? discountPercent(b.price, b.compare_at_price)
          : 0;

      switch (sortBy) {
        case "discount":
          return pctB - pctA;
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return (
            Number(b.isFeaturedDeal) - Number(a.isFeaturedDeal) ||
            b.displayPriority - a.displayPriority ||
            pctB - pctA
          );
      }
    });
  }, [
    products,
    selectedCategory,
    inStockOnly,
    minDiscount,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  function resetFilters() {
    setSelectedCategory("all");
    setMinDiscount(0);
    setInStockOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("featured");
  }

  const hasActiveFilters =
    selectedCategory !== "all" ||
    minDiscount > 0 ||
    inStockOnly ||
    minPrice !== "" ||
    maxPrice !== "";

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <span className="text-sm font-extrabold text-[#0F172A]">Filters</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            Category
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                selectedCategory === "all"
                  ? "bg-[#EFF6FF] text-[#2563EB]"
                  : "text-slate-600 hover:bg-[#F8FAFC]",
              )}
            >
              <span>All Deals</span>
              <span>{products.length}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  selectedCategory === cat.id
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-slate-600 hover:bg-[#F8FAFC]",
                )}
              >
                <span className="truncate">{cat.name}</span>
                <span>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Discount Percentage */}
      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Minimum Discount
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[0, 10, 20, 30, 50].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setMinDiscount(pct)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                minDiscount === pct
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                  : "border-[#E2E8F0] bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {pct === 0 ? "Any" : `${pct}%+ Off`}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Deal Price (Rs.)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-xs outline-none focus:border-[#2563EB]"
          />
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full rounded-lg border border-[#E2E8F0] px-2.5 py-1.5 text-xs outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#0F172A]">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Breadcrumb */}
      <div className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <Breadcrumb items={[{ label: "Special Deals" }]} />
        </div>
      </div>

      {/* Hero Promotional Banner */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {heroBannerUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] text-white shadow-sm">
            <Image
              src={heroBannerUrl}
              alt={heroTitle}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-35"
            />
            <div className="relative z-10 flex flex-col justify-between gap-6 px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-11">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100 backdrop-blur-xs">
                  <Flame size={13} className="text-amber-300" />
                  Limited-Time Offers
                </span>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {heroTitle}
                </h1>
                <p className="mt-2 text-sm text-blue-100 sm:text-base">
                  {heroSubtitle}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-[#0F172A]">
                    {products.length}{" "}
                    {products.length === 1 ? "Product" : "Products"} on Offer
                  </span>
                  {products.length > 0 && (
                    <a
                      href="#deals-grid"
                      className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                    >
                      Browse All Deals
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative min-h-[210px] w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F5F9FF] shadow-sm md:aspect-[4/1]">
            <Image
              src="/images/special-deals-hero.webp"
              alt={heroTitle}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="z-0 object-cover object-right md:object-contain md:object-right"
            />
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#F5F9FF] via-[#F5F9FF]/75 to-transparent md:w-[62%] md:from-[#F5F9FF] md:from-75% md:via-[#F5F9FF]/80 md:via-88% md:to-transparent" />
            <div className="relative z-10 flex min-h-[210px] flex-col justify-center px-6 py-7 md:absolute md:inset-0 md:min-h-0 md:px-10 md:py-6">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB] ring-1 ring-[#2563EB]/20">
                  <Flame size={13} className="text-[#DC2626]" />
                  Limited-Time Offers
                </span>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
                  {heroTitle}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600 sm:text-base">
                  {heroSubtitle}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-extrabold text-white shadow-xs">
                    {products.length}{" "}
                    {products.length === 1 ? "Product" : "Products"} on Offer
                  </span>
                  {products.length > 0 && (
                    <a
                      href="#deals-grid"
                      className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] shadow-xs transition hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      Browse All Deals
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {products.length === 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <Tag size={28} />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-[#0F172A]">
              No special deals available right now.
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Check back soon for new promotional campaigns and limited-time
              discounts across ZicZo Mart.
            </p>
            <Link
              href="/products"
              className="mt-6 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Browse All Products
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Dynamic Deal Categories Bar */}
          {categories.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
                    selectedCategory === "all"
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#2563EB]",
                  )}
                >
                  All Deals ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex-shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
                      selectedCategory === cat.id
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#2563EB]",
                    )}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Featured Flash Deals */}
          {flashDeals.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                  <Zap size={16} />
                </div>
                <h2 className="text-lg font-extrabold text-[#0F172A] sm:text-xl">
                  Featured Flash Deals
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {flashDeals.map((item) => {
                  const pct =
                    item.compare_at_price && item.compare_at_price > item.price
                      ? discountPercent(item.price, item.compare_at_price)
                      : 0;
                  const savings =
                    item.compare_at_price && item.compare_at_price > item.price
                      ? item.compare_at_price - item.price
                      : 0;

                  return (
                    <Link
                      key={`flash-${item.id}`}
                      href={`/products/${item.slug}`}
                      className="group flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-[#2563EB]/40 hover:shadow-md"
                    >
                      <div>
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F8FAFC] p-3">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 640px) 100vw, 25vw"
                              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <Package size={36} />
                            </div>
                          )}
                          {pct > 0 && (
                            <span className="absolute left-2.5 top-2.5 rounded-md bg-[#DC2626] px-2 py-0.5 text-xs font-bold text-white">
                              -{pct}%
                            </span>
                          )}
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB]">
                          {item.name}
                        </p>

                        <div className="mt-2 flex flex-wrap items-baseline gap-2">
                          <span className="text-base font-extrabold text-[#2563EB]">
                            {formatPrice(item.price)}
                          </span>
                          {item.compare_at_price &&
                            item.compare_at_price > item.price && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(item.compare_at_price)}
                              </span>
                            )}
                        </div>

                        {savings > 0 && (
                          <p className="mt-0.5 text-[11px] font-semibold text-[#16A34A]">
                            Save {formatPrice(savings)}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3">
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            item.stock_quantity > 0
                              ? "text-[#16A34A]"
                              : "text-[#DC2626]",
                          )}
                        >
                          {item.stock_quantity > 0
                            ? "In Stock"
                            : "Out of Stock"}
                        </span>
                        {item.dealEndAt && (
                          <CountdownTimer endAt={item.dealEndAt} compact />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Main Filter Sidebar + 4-Column Product Grid */}
          <section
            id="deals-grid"
            className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Desktop Sidebar */}
              <aside className="hidden lg:col-span-3 lg:block">
                <div className="sticky top-24 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
                  {filterPanel}
                </div>
              </aside>

              {/* Product Grid Area */}
              <div className="lg:col-span-9">
                {/* Toolbar */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-bold text-[#0F172A] lg:hidden"
                    >
                      <SlidersHorizontal size={14} /> Filters
                    </button>
                    <p className="text-xs font-semibold text-slate-500">
                      Showing{" "}
                      <span className="font-bold text-[#0F172A]">
                        {filteredProducts.length}
                      </span>{" "}
                      active deal{filteredProducts.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as typeof sortBy)
                    }
                    aria-label="Sort deals"
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  >
                    <option value="featured">Sort: Featured</option>
                    <option value="discount">Sort: Biggest Discount</option>
                    <option value="price-asc">Sort: Price Low to High</option>
                    <option value="price-desc">Sort: Price High to Low</option>
                    <option value="newest">Sort: Newest Deals</option>
                  </select>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center">
                    <p className="text-sm font-bold text-[#0F172A]">
                      No deals match your selected filters.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="deal"
                        isWishlisted={wishlistedIds.has(product.id)}
                        wishlistPending={wishlistPendingId === product.id}
                        onToggleWishlist={handleToggleWishlist}
                        onToast={showToast}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-[#0F172A]/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-extrabold text-[#0F172A]">
                Filter Deals
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-[#F8FAFC]"
              >
                <X size={18} />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg ${
            toast.type === "success" ? "bg-[#0F172A]" : "bg-[#DC2626]"
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
