import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import TrustStrip from "@/components/ui/trust-strip";
import { type ProductCardData } from "@/components/ui/product-card";
import ProductFilters, {
  MobileFilterBar,
  type FilterCategory,
} from "@/components/ui/product-filters";
import ProductsListingClient from "@/components/products/products-listing-client";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, ShoppingBag, RotateCcw } from "lucide-react";

/* ── Metadata ────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "All Products",
  description:
    "Discover amazing products across all categories at ZicZo Mart. Shop electronics, fashion, home & kitchen, beauty, sports and more.",
};

export const instant = false;

/* ── Types ───────────────────────────────────────────────────── */
type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
  featured?: string;
  deals?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  stock?: string;
  discount?: string;
  wishlist?: string;
  page?: string;
  limit?: string;
}>;

type Props = { searchParams: SearchParams };

/* ── Helpers ─────────────────────────────────────────────────── */
function getImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
): string {
  return supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath).data.publicUrl;
}

function resolveCategory(raw: unknown): { name: string | null; slug: string | null } {
  if (!raw) return { name: null, slug: null };
  const data = raw as
    | { name: string; slug: string }
    | { name: string; slug: string }[];
  const row = Array.isArray(data) ? data[0] : data;
  return { name: row?.name ?? null, slug: row?.slug ?? null };
}

/* ── Page ────────────────────────────────────────────────────── */
export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const categoryParam = sp.category ?? "";
  const sort = sp.sort ?? "";
  const featured = sp.featured ?? "";
  const deals = sp.deals ?? "";
  const minPriceParam = sp.minPrice ?? "";
  const maxPriceParam = sp.maxPrice ?? "";
  const ratingParam = sp.rating ?? "";
  const stockParam = sp.stock ?? "";
  const discountParam = sp.discount ?? "";
  const wishlistParam = sp.wishlist ?? "";

  const perPageRaw = Number(sp.limit);
  const perPage = [12, 24, 36].includes(perPageRaw) ? perPageRaw : 12;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();

  /* ── 1. Fetch categories, lightweight product stats & reviews ─ */
  const [
    { data: categoriesRaw },
    { data: productStatsRaw },
    { data: reviewsRaw },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, category_id, price, stock_quantity")
      .eq("is_active", true),
    supabase
      .from("reviews")
      .select("product_id, rating")
      .eq("is_published", true),
  ]);

  /* Compute accurate category counts, stock counts, and price bounds */
  const categoryCountMap = new Map<string, number>();
  let inStockCount = 0;
  let outOfStockCount = 0;
  let minBound = Infinity;
  let maxBound = 0;

  for (const row of productStatsRaw ?? []) {
    if (row.category_id) {
      categoryCountMap.set(
        row.category_id,
        (categoryCountMap.get(row.category_id) ?? 0) + 1,
      );
    }
    if (row.stock_quantity > 0) inStockCount += 1;
    else outOfStockCount += 1;

    const p = Number(row.price);
    if (p < minBound) minBound = p;
    if (p > maxBound) maxBound = p;
  }

  const totalCatalogCount = (productStatsRaw ?? []).length;
  const priceBounds = {
    min: Number.isFinite(minBound) ? Math.floor(minBound) : 0,
    max: maxBound > 0 ? Math.ceil(maxBound) : 100000,
  };

  const allActiveCategories = (categoriesRaw ?? []) as {
    id: string;
    name: string;
    slug: string;
    parent_id?: string | null;
  }[];
  const mainActiveCategories = allActiveCategories.filter((c) => !c.parent_id);
  const subActiveCategories = allActiveCategories.filter((c) =>
    Boolean(c.parent_id),
  );

  const categories: FilterCategory[] = mainActiveCategories.map((cat) => {
    const childIds = subActiveCategories
      .filter((s) => s.parent_id === cat.id)
      .map((s) => s.id);
    const totalCount =
      (categoryCountMap.get(cat.id) ?? 0) +
      childIds.reduce((sum, cid) => sum + (categoryCountMap.get(cid) ?? 0), 0);
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: totalCount,
    };
  });

  /* Compute real product ratings from published reviews */
  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const rev of reviewsRaw ?? []) {
    const prev = ratingAgg.get(rev.product_id) ?? { sum: 0, count: 0 };
    ratingAgg.set(rev.product_id, {
      sum: prev.sum + Number(rev.rating),
      count: prev.count + 1,
    });
  }

  /* ── 2. Optional wishlist filter (requires authenticated user) ─ */
  let wishlistProductIds: string[] | null = null;
  if (wishlistParam === "true") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: wishRows } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id);
      wishlistProductIds = (wishRows ?? []).map((w) => w.product_id);
    } else {
      wishlistProductIds = [];
    }
  }

  /* ── 3. Resolve selected category slugs → IDs ───────────────── */
  const selectedSlugs = categoryParam
    ? categoryParam.split(",").filter(Boolean)
    : [];

  const singleSlugLower =
    selectedSlugs.length === 1 ? selectedSlugs[0].toLowerCase() : "";
  const isSingleElectronics = singleSlugLower.startsWith("electronics");
  const isSingleHomeKitchen =
    singleSlugLower.startsWith("home-kitchen") ||
    singleSlugLower.startsWith("home-and-kitchen");

  if (
    selectedSlugs.length === 1 &&
    !wishlistParam &&
    !deals
  ) {
    const forward = new URLSearchParams();
    if (q) forward.set("q", q);
    if (sort) forward.set("sort", sort);
    if (featured) forward.set("featured", featured);
    if (minPriceParam) forward.set("minPrice", minPriceParam);
    if (maxPriceParam) forward.set("maxPrice", maxPriceParam);
    if (ratingParam) forward.set("rating", ratingParam);
    if (stockParam) forward.set("stock", stockParam);
    if (discountParam) forward.set("discount", discountParam);
    if (sp.page) forward.set("page", sp.page);
    if (sp.limit) forward.set("limit", sp.limit);
    const qs = forward.toString();
    const targetPath = isSingleElectronics
      ? "/categories/electronics"
      : isSingleHomeKitchen
        ? "/categories/home-kitchen"
        : `/categories/${selectedSlugs[0]}`;
    redirect(qs ? `${targetPath}?${qs}` : targetPath);
  }

  const selectedCategoryIds = Array.from(
    new Set(
      allActiveCategories
        .filter((c) => selectedSlugs.includes(c.slug))
        .flatMap((c) => {
          if (!c.parent_id) {
            const childIds = subActiveCategories
              .filter((s) => s.parent_id === c.id)
              .map((s) => s.id);
            return [c.id, ...childIds];
          }
          return [c.id];
        }),
    ),
  );

  /* ── 4. Build Supabase products query ───────────────────────── */
  let query = supabase
    .from("products")
    .select(
      `id, name, slug, description, price, compare_at_price, stock_quantity, is_featured, created_at,
       product_images(storage_path, sort_order),
       categories(name, slug)`,
    )
    .eq("is_active", true);

  if (q.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }
  if (selectedSlugs.length > 0) {
    if (selectedCategoryIds.length > 0) {
      query = query.in("category_id", selectedCategoryIds);
    } else {
      // Selected slug does not match any active category -> return empty cleanly
      query = query.eq("category_id", "00000000-0000-0000-0000-000000000000");
    }
  }
  if (featured === "true") {
    query = query.eq("is_featured", true);
  }
  if (deals === "true" || discountParam) {
    query = query.not("compare_at_price", "is", null);
  }
  if (minPriceParam && !Number.isNaN(Number(minPriceParam))) {
    query = query.gte("price", Number(minPriceParam));
  }
  if (maxPriceParam && !Number.isNaN(Number(maxPriceParam))) {
    query = query.lte("price", Number(maxPriceParam));
  }
  if (stockParam === "in_stock") {
    query = query.gt("stock_quantity", 0);
  } else if (stockParam === "out_of_stock") {
    query = query.eq("stock_quantity", 0);
  }
  if (wishlistProductIds !== null) {
    if (wishlistProductIds.length > 0) {
      query = query.in("id", wishlistProductIds);
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  /* Database-level base sort */
  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data: rawProducts, error } = await query;

  /* ── 5. Map, apply derived filters (discount, rating), & sort ─ */
  type EnrichedProduct = ProductCardData & { createdAt: string };

  let mapped: EnrichedProduct[] = (rawProducts ?? []).map((p) => {
    const imgs = [...(p.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const cat = resolveCategory(p.categories);
    const rev = ratingAgg.get(p.id);
    const avgRating = rev && rev.count > 0 ? rev.sum / rev.count : null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      stock_quantity: p.stock_quantity,
      is_featured: p.is_featured,
      imageUrl: imgs[0] ? getImageUrl(supabase, imgs[0].storage_path) : null,
      category: cat.name,
      categorySlug: cat.slug,
      rating: avgRating,
      reviewCount: rev?.count ?? 0,
      createdAt: p.created_at,
    };
  });

  if (deals === "true") {
    mapped = mapped.filter(
      (p) =>
        p.compare_at_price != null &&
        Number(p.compare_at_price) > Number(p.price),
    );
  }

  if (discountParam && !Number.isNaN(Number(discountParam))) {
    const minDiscount = Number(discountParam);
    mapped = mapped.filter((p) => {
      if (!p.compare_at_price || p.compare_at_price <= p.price) return false;
      const pct = Math.round(
        ((p.compare_at_price - p.price) / p.compare_at_price) * 100,
      );
      return pct >= minDiscount;
    });
  }

  if (ratingParam && !Number.isNaN(Number(ratingParam))) {
    const minRating = Number(ratingParam);
    mapped = mapped.filter(
      (p) => p.rating != null && p.rating >= minRating,
    );
  }

  if (sort === "name_asc") {
    mapped.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "name_desc") {
    mapped.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === "popularity") {
    mapped.sort((a, b) => {
      const revDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      if (revDiff !== 0) return revDiff;
      return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    });
  } else if (sort === "top_rated") {
    mapped.sort((a, b) => {
      const rDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (rDiff !== 0) return rDiff;
      return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    });
  }

  /* ── 6. Paginate ────────────────────────────────────────────── */
  const totalFiltered = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const paginatedProducts: ProductCardData[] = mapped.slice(
    startIdx,
    startIdx + perPage,
  );

  /* ── 7. Derived UI state ────────────────────────────────────── */
  const hasActiveFilters = Boolean(
    q ||
      categoryParam ||
      sort ||
      featured ||
      deals ||
      minPriceParam ||
      maxPriceParam ||
      ratingParam ||
      stockParam ||
      discountParam ||
      wishlistParam,
  );

  const activeCategoryNames = categories
    .filter((c) => selectedSlugs.includes(c.slug))
    .map((c) => c.name);

  let pageTitle = "All Products";
  let pageSubtitle = "Discover amazing products across all categories.";
  if (wishlistParam === "true") {
    pageTitle = "My Wishlist";
    pageSubtitle = "Your saved products ready to add to cart.";
  } else if (deals === "true") {
    pageTitle = "Special Deals";
    pageSubtitle = "Limited-time discounts and unbeatable savings.";
  } else if (featured === "true") {
    pageTitle = "Featured Products";
    pageSubtitle = "Hand-picked favorites curated for you.";
  } else if (activeCategoryNames.length === 1) {
    pageTitle = activeCategoryNames[0];
    pageSubtitle = `Explore our ${activeCategoryNames[0]} collection.`;
  } else if (q) {
    pageTitle = `Results for "${q}"`;
    pageSubtitle = "Showing matching products across ZicZo Mart.";
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F5F7FB]">
        {/* ── Breadcrumb + Hero Banner ───────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <Breadcrumb
            items={[
              { label: "All Products", href: "/products" },
              ...(activeCategoryNames.length === 1
                ? [{ label: activeCategoryNames[0] }]
                : wishlistParam === "true"
                  ? [{ label: "Wishlist" }]
                  : deals === "true"
                    ? [{ label: "Deals" }]
                    : featured === "true"
                      ? [{ label: "Featured" }]
                      : q
                        ? [{ label: `Search: ${q}` }]
                        : []),
            ]}
          />

          {/* Hero Banner */}
          <section
            aria-label="All Products Banner"
            className="relative mt-3 overflow-hidden rounded-[20px] border border-blue-100/90 bg-gradient-to-r from-[#F4F8FF] via-[#EBF2FF] to-[#DFECFF] shadow-sm"
          >
            <div className="relative flex flex-col justify-between md:h-[260px] md:flex-row md:items-center lg:h-[285px]">
              {/* Desktop & Tablet Full-Bleed Hero Background */}
              <div className="pointer-events-none absolute inset-0 hidden md:block">
                <Image
                  src="/images/products-hero.jpg"
                  alt="ZicZo Mart All Products Showcase"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-right"
                />
                {/* Subtle readability scrim on the left */}
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-white/55 via-white/20 to-transparent" />
              </div>

              {/* Left Dynamic Copy */}
              <div className="relative z-20 flex flex-col justify-center px-6 py-7 sm:px-10 md:w-[48%] md:py-0 lg:w-[46%] lg:px-12">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0A1633] sm:text-4xl lg:text-[42px]">
                  {pageTitle}
                </h1>
                <p className="mt-2.5 max-w-md text-xs font-medium text-slate-700 sm:text-sm">
                  {pageSubtitle}
                </p>
                {!error && (
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#0755E9] px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                      <ShoppingBag size={14} />
                      {totalCatalogCount}{" "}
                      {totalCatalogCount === 1 ? "Product" : "Products"}
                    </span>
                    {hasActiveFilters && (
                      <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#0A1633] shadow-xs">
                        {totalFiltered} matching
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Hero Collage */}
              <div className="relative w-full overflow-hidden md:hidden">
                <Image
                  src="/images/products-hero.jpg"
                  alt="ZicZo Mart All Products Showcase"
                  width={1024}
                  height={357}
                  priority
                  unoptimized
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Main Two-Column Listing Area ───────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {/* Mobile Filter Bar + Drawer */}
          <div className="mb-5 lg:hidden">
            <Suspense fallback={null}>
              <MobileFilterBar
                categories={categories}
                totalCount={totalCatalogCount}
                inStockCount={inStockCount}
                outOfStockCount={outOfStockCount}
                priceBounds={priceBounds}
              />
            </Suspense>
          </div>

          <div className="flex items-start gap-6">
            {/* Desktop Left Sidebar */}
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-24 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-[#1049C6]" />
                    <h2 className="text-sm font-extrabold text-[#0A1633]">
                      Filters
                    </h2>
                  </div>
                  {hasActiveFilters && (
                    <Link
                      href="/products"
                      aria-label="Reset all filters"
                      title="Reset all filters"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-[#1049C6]"
                    >
                      <RotateCcw size={13} />
                    </Link>
                  )}
                </div>

                <Suspense fallback={null}>
                  <ProductFilters
                    categories={categories}
                    totalCount={totalCatalogCount}
                    inStockCount={inStockCount}
                    outOfStockCount={outOfStockCount}
                    priceBounds={priceBounds}
                  />
                </Suspense>
              </div>
            </aside>

            {/* Right Content */}
            {error ? (
              <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-bold">Unable to load products</p>
                <p className="mt-1 text-red-600">{error.message}</p>
              </div>
            ) : (
              <Suspense fallback={<ProductGridSkeleton count={12} />}>
                <ProductsListingClient
                  products={paginatedProducts}
                  totalFiltered={totalFiltered}
                  currentPage={safePage}
                  perPage={perPage}
                  hasActiveFilters={hasActiveFilters}
                  searchQuery={q}
                />
              </Suspense>
            )}
          </div>
        </div>

        {/* ── Trust Benefits Strip ───────────────────────────────── */}
        <TrustStrip />
      </main>

      <Footer />
    </>
  );
}
