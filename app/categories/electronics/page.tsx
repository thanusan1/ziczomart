import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { resolveCategoryTree } from "@/lib/categories/resolve-category-tree";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import TrustStrip from "@/components/ui/trust-strip";
import { type ProductCardData } from "@/components/ui/product-card";
import { type FilterCategory } from "@/components/ui/product-filters";
import CategorySidebarFilters, {
  CategoryMobileFilterBar,
} from "@/components/ui/category-sidebar-filters";
import ProductsListingClient, {
  type ActiveFilterChip,
} from "@/components/products/products-listing-client";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Electronics",
  description:
    "Discover the latest electronics, gadgets and accessories at amazing prices on ZicZo Mart.",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  sub?: string;
  sort?: string;
  featured?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  stock?: string;
  discount?: string;
  page?: string;
  limit?: string;
}>;

type Props = { searchParams: SearchParams };

function getImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
): string {
  return supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath).data.publicUrl;
}

export default async function ElectronicsCategoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const subParam = sp.sub ?? "";
  const sort = sp.sort ?? "";
  const featured = sp.featured ?? "";
  const minPriceParam = sp.minPrice ?? "";
  const maxPriceParam = sp.maxPrice ?? "";
  const ratingParam = sp.rating ?? "";
  const stockParam = sp.stock ?? "";
  const discountParam = sp.discount ?? "";

  const perPageRaw = Number(sp.limit);
  const perPage = [12, 24, 36].includes(perPageRaw) ? perPageRaw : 24;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();

  /* ── 1. Resolve active Electronics category & child categories ─── */
  const {
    mainCategory: electronicsCategory,
    childCategories,
    targetCategoryIds,
    categoryById,
  } = await resolveCategoryTree(supabase, {
    matchMain: (c) =>
      c.name.trim().toLowerCase() === "electronics" ||
      c.slug.toLowerCase().startsWith("electronics"),
  });

  /* ── 2. Fetch all active Electronics products & published reviews ─ */
  type RawProductRow = {
    id: string;
    category_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    price: number | string;
    compare_at_price: number | string | null;
    stock_quantity: number;
    is_featured: boolean;
    created_at: string;
    product_images: { storage_path: string; sort_order: number }[] | null;
  };

  let rawProducts: RawProductRow[] = [];
  let queryError: string | null = null;

  if (targetCategoryIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, category_id, name, slug, description, price, compare_at_price, stock_quantity, is_featured, created_at,
         product_images(storage_path, sort_order)`,
      )
      .eq("is_active", true)
      .in("category_id", targetCategoryIds);

    if (error) {
      queryError = error.message;
    } else {
      rawProducts = (data ?? []) as RawProductRow[];
    }
  }

  const productIds = rawProducts.map((p) => p.id);
  const ratingAgg = new Map<string, { sum: number; count: number }>();

  if (productIds.length > 0) {
    const { data: reviewsRaw } = await supabase
      .from("reviews")
      .select("product_id, rating")
      .eq("is_published", true)
      .in("product_id", productIds);

    for (const rev of reviewsRaw ?? []) {
      const prev = ratingAgg.get(rev.product_id) ?? { sum: 0, count: 0 };
      ratingAgg.set(rev.product_id, {
        sum: prev.sum + Number(rev.rating),
        count: prev.count + 1,
      });
    }
  }

  /* ── 3. Compute real Electronics stats (excluding placeholders) ─ */
  let inStockCount = 0;
  let outOfStockCount = 0;
  let minBound = Infinity;
  let maxBound = 0;
  const subCountMap = new Map<string, number>();

  for (const row of rawProducts) {
    if (row.stock_quantity > 0) inStockCount += 1;
    else outOfStockCount += 1;

    const p = Number(row.price);
    if (p < minBound) minBound = p;
    if (p > maxBound) maxBound = p;

    if (row.category_id) {
      subCountMap.set(
        row.category_id,
        (subCountMap.get(row.category_id) ?? 0) + 1,
      );
    }
  }

  const sidebarSubcategories: FilterCategory[] = childCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: subCountMap.get(c.id) ?? 0,
  }));

  const totalElectronicsCount = rawProducts.length;
  const priceBounds = {
    min: Number.isFinite(minBound) ? Math.floor(minBound) : 0,
    max: maxBound > 0 ? Math.ceil(maxBound) : 100000,
  };

  /* ── 4. Map, filter, & sort real products ───────────────────── */
  type EnrichedProduct = ProductCardData & { createdAt: string };

  let mapped: EnrichedProduct[] = rawProducts.map((p) => {
    const imgs = [...(p.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const rev = ratingAgg.get(p.id);
    const avgRating = rev && rev.count > 0 ? rev.sum / rev.count : null;
    const cat = p.category_id ? categoryById.get(p.category_id) : null;

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
      category: cat?.name ?? electronicsCategory?.name ?? "Electronics",
      categorySlug: cat?.slug ?? electronicsCategory?.slug ?? "electronics",
      rating: avgRating,
      reviewCount: rev?.count ?? 0,
      createdAt: p.created_at,
    };
  });

  if (subParam) {
    mapped = mapped.filter((p) => p.categorySlug === subParam);
  }

  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    mapped = mapped.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle),
    );
  }

  if (featured === "true") {
    mapped = mapped.filter((p) => Boolean(p.is_featured));
  }

  if (minPriceParam && !Number.isNaN(Number(minPriceParam))) {
    const minP = Number(minPriceParam);
    mapped = mapped.filter((p) => p.price >= minP);
  }

  if (maxPriceParam && !Number.isNaN(Number(maxPriceParam))) {
    const maxP = Number(maxPriceParam);
    mapped = mapped.filter((p) => p.price <= maxP);
  }

  if (stockParam === "in_stock") {
    mapped = mapped.filter((p) => p.stock_quantity > 0);
  } else if (stockParam === "out_of_stock") {
    mapped = mapped.filter((p) => p.stock_quantity === 0);
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

  if (sort === "price_asc") {
    mapped.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    mapped.sort((a, b) => b.price - a.price);
  } else if (sort === "name_asc") {
    mapped.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "name_desc") {
    mapped.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === "newest") {
    mapped.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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
  } else {
    mapped.sort((a, b) => {
      const featDiff =
        Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
      if (featDiff !== 0) return featDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /* ── 5. Paginate real products ──────────────────────────────── */
  const totalFiltered = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const paginatedProducts: ProductCardData[] = mapped.slice(
    startIdx,
    startIdx + perPage,
  );

  /* ── 6. Active filter chips ─────────────────────────────────── */
  const activeFilterChips: ActiveFilterChip[] = [];
  if (subParam) {
    const matched = childCategories.find((c) => c.slug === subParam);
    activeFilterChips.push({
      key: "sub",
      label: `Category: ${matched?.name ?? subParam}`,
    });
  }
  if (q.trim()) {
    activeFilterChips.push({ key: "q", label: `Search: "${q.trim()}"` });
  }
  if (minPriceParam || maxPriceParam) {
    activeFilterChips.push({
      key: "price",
      label: `Price: Rs. ${minPriceParam || priceBounds.min} – Rs. ${maxPriceParam || priceBounds.max}`,
      clearKeys: ["minPrice", "maxPrice"],
    });
  }
  if (ratingParam) {
    activeFilterChips.push({
      key: "rating",
      label: `${ratingParam}★ & above`,
    });
  }
  if (stockParam === "in_stock") {
    activeFilterChips.push({ key: "stock", label: "In Stock" });
  } else if (stockParam === "out_of_stock") {
    activeFilterChips.push({ key: "stock", label: "Out of Stock" });
  }
  if (discountParam) {
    activeFilterChips.push({
      key: "discount",
      label: `${discountParam}% Off & above`,
    });
  }
  if (featured === "true") {
    activeFilterChips.push({ key: "featured", label: "Featured" });
  }

  const hasActiveFilters = Boolean(
    q ||
      subParam ||
      sort ||
      featured ||
      minPriceParam ||
      maxPriceParam ||
      ratingParam ||
      stockParam ||
      discountParam,
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F5F7FB]">
        {/* ── Breadcrumb + Electronics Hero Banner ───────────────── */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <Breadcrumb items={[{ label: "Electronics" }]} />

          <section
            aria-label="Electronics Banner"
            className="relative mt-3 overflow-hidden rounded-[20px] border border-blue-100/90 bg-gradient-to-r from-[#EEF5FF] via-[#DCEAFF] to-[#B7D6FF] shadow-sm"
          >
            <div className="relative flex flex-col justify-between md:h-[168px] md:flex-row md:items-center lg:h-[180px]">
              {/* Desktop & Tablet Hero Background */}
              <div className="pointer-events-none absolute inset-0 hidden md:block">
                <Image
                  src="/images/electronics-hero.jpg"
                  alt="ZicZo Mart Electronics Showcase"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-right"
                />
                <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#EEF5FF]/95 via-[#E5F0FF]/80 to-transparent" />
              </div>

              {/* Left Text Content */}
              <div className="relative z-20 flex flex-col justify-center px-6 py-6 sm:px-9 md:w-[50%] md:py-0 lg:w-[46%] lg:px-10">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0A1633] sm:text-3xl lg:text-[34px]">
                  Electronics
                </h1>
                <p className="mt-1.5 max-w-md text-xs font-medium text-slate-700 sm:text-sm">
                  Discover the latest electronics, gadgets and accessories at
                  amazing prices.
                </p>
                {!queryError && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#1049C6] px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                      {totalElectronicsCount}{" "}
                      {totalElectronicsCount === 1 ? "Product" : "Products"}
                    </span>
                    {hasActiveFilters && (
                      <span className="inline-flex items-center rounded-full border border-blue-200/90 bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A1633] shadow-xs">
                        {totalFiltered} matching
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Hero Image */}
              <div className="relative aspect-[16/6] w-full overflow-hidden md:hidden">
                <Image
                  src="/images/electronics-hero.jpg"
                  alt="ZicZo Mart Electronics Showcase"
                  fill
                  priority
                  unoptimized
                  sizes="100vw"
                  className="object-cover object-right"
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
              <CategoryMobileFilterBar
                categoryTitle="Electronics"
                allCategoryLabel="All Electronics"
                subcategories={sidebarSubcategories}
                totalCount={totalElectronicsCount}
                inStockCount={inStockCount}
                outOfStockCount={outOfStockCount}
                priceBounds={priceBounds}
              />
            </Suspense>
          </div>

          <div className="flex items-start gap-6">
            {/* Desktop Left Sidebar */}
            <aside className="hidden w-[260px] flex-shrink-0 lg:block">
              <div className="sticky top-24 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-[#2563EB]" />
                    <h2 className="text-sm font-extrabold text-[#0F172A]">
                      Filters
                    </h2>
                  </div>
                  {hasActiveFilters && (
                    <Link
                      href="/categories/electronics"
                      aria-label="Reset all filters"
                      title="Reset all filters"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                    >
                      <RotateCcw size={13} />
                    </Link>
                  )}
                </div>

                <Suspense fallback={null}>
                  <CategorySidebarFilters
                    categoryTitle="Electronics"
                    allCategoryLabel="All Electronics"
                    subcategories={sidebarSubcategories}
                    totalCount={totalElectronicsCount}
                    inStockCount={inStockCount}
                    outOfStockCount={outOfStockCount}
                    priceBounds={priceBounds}
                  />
                </Suspense>
              </div>
            </aside>

            {/* Right Main Content */}
            {queryError ? (
              <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-bold">Unable to load electronics products</p>
                <p className="mt-1 text-red-600">{queryError}</p>
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
                  minVisualSlots={12}
                  placeholderCategory="electronics"
                  clearFiltersHref="/categories/electronics"
                  activeFilterChips={activeFilterChips}
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
