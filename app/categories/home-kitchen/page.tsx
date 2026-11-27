import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { resolveCategoryTree } from "@/lib/categories/resolve-category-tree";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import TrustStrip, { type TrustBenefitItem } from "@/components/ui/trust-strip";
import { type ProductCardData } from "@/components/ui/product-card";
import { type FilterCategory } from "@/components/ui/product-filters";
import CategorySidebarFilters, {
  CategoryMobileFilterBar,
} from "@/components/ui/category-sidebar-filters";
import ProductsListingClient, {
  type ActiveFilterChip,
} from "@/components/products/products-listing-client";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import {
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Award,
  Truck,
  Headphones,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Home & Kitchen",
  description:
    "Shop Home & Kitchen products at ZicZo Mart. Discover kitchen appliances, cookware, home decor, storage solutions and everyday essentials.",
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

const HOME_KITCHEN_CHILD_MATCHERS = [
  {
    name: "Kitchen Appliances",
    slug: "kitchen-appliances",
    keywords: ["kitchen appliance", "air fryer", "blender", "kettle"],
  },
  {
    name: "Cookware",
    slug: "cookware",
    keywords: ["cookware", "pot", "pan", "skillet"],
  },
  {
    name: "Kitchen Utensils",
    slug: "kitchen-utensils",
    keywords: ["utensil", "cutlery", "spatula"],
  },
  {
    name: "Dining & Serveware",
    slug: "dining-serveware",
    keywords: ["dining", "serveware", "dinner", "plate"],
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    keywords: ["home decor", "decor", "vase", "cushion"],
  },
  {
    name: "Furniture",
    slug: "furniture",
    keywords: ["furniture", "chair", "table"],
  },
  {
    name: "Bedding & Bath",
    slug: "bedding-bath",
    keywords: ["bedding", "bath", "towel", "pillow"],
  },
  {
    name: "Storage & Organization",
    slug: "storage-organization",
    keywords: ["storage", "organization", "organizer", "container"],
  },
  {
    name: "Lighting",
    slug: "lighting",
    keywords: ["lighting", "lamp", "lantern"],
  },
  {
    name: "Cleaning Supplies",
    slug: "cleaning-supplies",
    keywords: ["cleaning", "mop", "detergent"],
  },
];

const HOME_KITCHEN_TRUST_ITEMS: TrustBenefitItem[] = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "Safe checkout with Cash on Delivery & cards",
  },
  {
    icon: Award,
    title: "Quality Products",
    desc: "Curated home & kitchen essentials built to last",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    desc: "Fast island-wide delivery straight to your door",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    desc: "Dedicated help whenever you need assistance",
  },
];

function getImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
): string {
  return supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath).data.publicUrl;
}

function isMainHomeKitchenCategory(cat: { name: string; slug: string }): boolean {
  const n = cat.name.trim().toLowerCase();
  const s = cat.slug.trim().toLowerCase();
  return (
    n === "home & kitchen" ||
    n === "home and kitchen" ||
    s === "home-kitchen" ||
    s === "home-and-kitchen" ||
    s.startsWith("home-kitchen") ||
    s.startsWith("home-and-kitchen")
  );
}

export default async function HomeKitchenCategoryPage({ searchParams }: Props) {
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

  /* ── 1. Resolve Home & Kitchen category & child categories ──────── */
  const {
    mainCategory,
    childCategories,
    targetCategoryIds,
    categoryById,
  } = await resolveCategoryTree(supabase, {
    matchMain: isMainHomeKitchenCategory,
    fallbackChildMatchers: HOME_KITCHEN_CHILD_MATCHERS,
  });

  /* ── 2. Fetch active Home & Kitchen products & published reviews ──── */
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

  /* ── 3. Compute real stats (excluding visual placeholders) ────────── */
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

  const totalHomeKitchenCount = rawProducts.length;
  const priceBounds = {
    min: Number.isFinite(minBound) ? Math.floor(minBound) : 0,
    max: maxBound > 0 ? Math.ceil(maxBound) : 100000,
  };

  /* ── 4. Map, filter, & sort real products ───────────────────────── */
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
      category: cat?.name ?? mainCategory?.name ?? "Home & Kitchen",
      categorySlug: cat?.slug ?? mainCategory?.slug ?? "home-kitchen",
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
        (p.description ?? "").toLowerCase().includes(needle) ||
        (p.category ?? "").toLowerCase().includes(needle),
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

  /* ── 5. Paginate real products ──────────────────────────────────── */
  const totalFiltered = mapped.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const paginatedProducts: ProductCardData[] = mapped.slice(
    startIdx,
    startIdx + perPage,
  );

  /* ── 6. Active filter chips ─────────────────────────────────────── */
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

      <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC]">
        {/* ── D. Breadcrumb + E. Home & Kitchen Hero Banner ─────────── */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <Breadcrumb items={[{ label: "Home & Kitchen" }]} />

          <section
            aria-label="Home & Kitchen Collection Banner"
            className="relative mt-3 overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-[#EFF6FF] shadow-sm"
          >
            <div className="relative flex min-h-[230px] flex-col justify-center sm:h-[270px] md:h-[300px] lg:h-[320px]">
              {/* Background Hero Image (exact 3:1 custom banner) */}
              <div className="pointer-events-none absolute inset-0">
                <Image
                  src="/images/home-kitchen-hero.jpg"
                  alt="ZicZo Mart Home & Kitchen collection featuring kitchen appliances, cookware, tableware, and home decor"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover object-center"
                />
                {/* Subtle left-only gradient so text is crisp while right-side product imagery stays completely clear */}
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#EFF6FF]/95 via-[#EFF6FF]/85 to-transparent sm:w-[70%] md:w-[56%] lg:w-[52%]" />
              </div>

              {/* Left Text Content */}
              <div className="relative z-10 max-w-xl px-6 py-7 sm:px-9 md:w-[54%] md:py-0 lg:w-[48%] lg:px-11">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563EB] shadow-2xs">
                  ZICZO MART COLLECTION
                </span>

                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl lg:text-[38px] lg:leading-[1.12]">
                  Home &amp; Kitchen
                </h1>

                <p className="mt-2 max-w-md text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
                  Discover stylish home essentials, kitchen appliances and
                  everyday living products at amazing prices.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href="#home-kitchen-products"
                    className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] sm:text-sm"
                  >
                    Shop Collection
                    <ArrowRight size={15} />
                  </a>

                  {!queryError && (
                    <span className="inline-flex items-center rounded-full border border-blue-200/90 bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#0F172A] shadow-2xs">
                      Explore {totalHomeKitchenCount}{" "}
                      {totalHomeKitchenCount === 1 ? "product" : "products"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── F. Main Content Section: Left Sidebar + Right Product Grid ── */}
        <section
          id="home-kitchen-products"
          aria-label="Home & Kitchen products"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 py-6 sm:px-6 lg:py-8"
        >
          {/* Mobile Filter & Categories Bar + Drawer */}
          <div className="mb-5 lg:hidden">
            <Suspense fallback={null}>
              <CategoryMobileFilterBar
                categoryTitle="Home & Kitchen"
                allCategoryLabel="All Home & Kitchen"
                subcategories={sidebarSubcategories}
                totalCount={totalHomeKitchenCount}
                inStockCount={inStockCount}
                outOfStockCount={outOfStockCount}
                priceBounds={priceBounds}
              />
            </Suspense>
          </div>

          <div className="flex items-start gap-6">
            {/* Desktop Left Sidebar (260px) */}
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
                      href="/categories/home-kitchen"
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
                    categoryTitle="Home & Kitchen"
                    allCategoryLabel="All Home & Kitchen"
                    subcategories={sidebarSubcategories}
                    totalCount={totalHomeKitchenCount}
                    inStockCount={inStockCount}
                    outOfStockCount={outOfStockCount}
                    priceBounds={priceBounds}
                  />
                </Suspense>
              </div>
            </aside>

            {/* Right Main Product Area */}
            {queryError ? (
              <div className="flex-1 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-bold">
                  Unable to load Home &amp; Kitchen products
                </p>
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
                  placeholderCategory="home-kitchen"
                  clearFiltersHref="/categories/home-kitchen"
                  activeFilterChips={activeFilterChips}
                />
              </Suspense>
            )}
          </div>
        </section>

        {/* ── G. Trust Benefits Section ─────────────────────────────── */}
        <TrustStrip items={HOME_KITCHEN_TRUST_ITEMS} />
      </main>

      {/* ── H. Existing Footer ──────────────────────────────────────── */}
      <Footer />
    </>
  );
}
