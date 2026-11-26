import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductCard, { type ProductCardData } from "@/components/ui/product-card";
import ProductFilters, { MobileFilterBar } from "@/components/ui/product-filters";
import Breadcrumb from "@/components/ui/breadcrumb";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Package, Search, SlidersHorizontal } from "lucide-react";

/* ── Types ───────────────────────────────────────────────── */
type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
  featured?: string;
}>;

type Props = { searchParams: SearchParams };

/* ── Helpers ─────────────────────────────────────────────── */
function getImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
): string {
  return supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath).data.publicUrl;
}

function resolveCategory(raw: unknown): string | null {
  if (!raw) return null;
  const data = raw as { name: string } | { name: string }[];
  return Array.isArray(data) ? (data[0]?.name ?? null) : (data.name ?? null);
}

/* ── Page ────────────────────────────────────────────────── */
export default async function ProductsPage({ searchParams }: Props) {
  const { q = "", category = "", sort = "", featured = "" } = await searchParams;

  const supabase = await createClient();

  /* ── 1. Fetch categories for sidebar ─────────────────── */
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  /* ── 2. Resolve category slug → id ───────────────────── */
  let categoryId: string | null = null;
  if (category) {
    const { data: catRow } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .eq("is_active", true)
      .maybeSingle();
    categoryId = catRow?.id ?? null;
  }

  /* ── 3. Build the products query ─────────────────────── */
  let query = supabase
    .from("products")
    .select(
      `id, name, slug, price, compare_at_price, stock_quantity, is_featured,
       product_images(storage_path, sort_order),
       categories(name)`,
    )
    .eq("is_active", true);

  if (q.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  /* Sorting */
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data: rawProducts, error } = await query;

  /* ── 4. Map to ProductCardData ───────────────────────── */
  const products: ProductCardData[] = (rawProducts ?? []).map((p) => {
    const imgs = [...(p.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
      stock_quantity: p.stock_quantity,
      is_featured: p.is_featured,
      imageUrl: imgs[0] ? getImageUrl(supabase, imgs[0].storage_path) : null,
      category: resolveCategory(p.categories),
    };
  });

  /* ── 5. Total count for sidebar label ────────────────── */
  const { count: totalCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  /* ── Derived state ───────────────────────────────────── */
  const hasFilters = !!(q || category || sort || featured);
  const activeCategoryName = (categories ?? []).find(
    (c) => c.slug === category,
  )?.name;

  /* Page title */
  let pageTitle = "All Products";
  if (featured === "true") pageTitle = "Featured Products";
  else if (activeCategoryName) pageTitle = activeCategoryName;
  else if (q) pageTitle = `Results for "${q}"`;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* ── Page Header ─────────────────────────────────── */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Breadcrumb
              items={[
                { label: "Products", href: "/products" },
                ...(activeCategoryName
                  ? [{ label: activeCategoryName }]
                  : featured === "true"
                    ? [{ label: "Featured" }]
                    : q
                      ? [{ label: `Search: ${q}` }]
                      : []),
              ]}
            />
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"} found
                  {hasFilters && (
                    <Link
                      href="/products"
                      className="ml-3 font-medium text-orange-500 hover:text-orange-600"
                    >
                      Clear filters
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* ── Mobile Filter Bar ─────────────────────────── */}
          <div className="mb-6 lg:hidden">
            <Suspense fallback={null}>
              <MobileFilterBar
                categories={categories ?? []}
                totalCount={totalCount ?? 0}
              />
            </Suspense>
          </div>

          <div className="flex gap-8">
            {/* ── Desktop Sidebar ───────────────────────────── */}
            <aside className="hidden w-56 flex-shrink-0 lg:block xl:w-64">
              <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-900">Filters</h2>
                  {hasFilters && (
                    <Link
                      href="/products"
                      className="ml-auto text-xs font-medium text-orange-500 hover:text-orange-600"
                    >
                      Clear
                    </Link>
                  )}
                </div>
                <Suspense fallback={null}>
                  <ProductFilters
                    categories={categories ?? []}
                    totalCount={totalCount ?? 0}
                  />
                </Suspense>
              </div>
            </aside>

            {/* ── Product Grid ──────────────────────────────── */}
            <div className="min-w-0 flex-1">
              {/* Error state */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                  <p className="font-semibold">Unable to load products</p>
                  <p className="mt-1 text-red-600">{error.message}</p>
                </div>
              )}

              {/* Products grid */}
              {!error && products.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Empty — search returned nothing */}
              {!error && products.length === 0 && hasFilters && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                    <Search size={28} className="text-gray-400" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-gray-900">
                    No products found
                  </h2>
                  <p className="mt-2 max-w-xs text-sm text-gray-500">
                    {q
                      ? `We couldn't find anything matching "${q}". Try a different search term.`
                      : "No products match your current filters. Try removing some filters."}
                  </p>
                  <Link
                    href="/products"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    View All Products
                  </Link>
                </div>
              )}

              {/* Empty — no products at all */}
              {!error && products.length === 0 && !hasFilters && (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                    <Package size={28} className="text-orange-400" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-gray-900">
                    No products yet
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Products are being added. Please check back soon.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-orange-500 hover:text-orange-500"
                  >
                    Back to Home
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
