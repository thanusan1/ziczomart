import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductCard, { type ProductCardData } from "@/components/ui/product-card";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Package,
  Tag,
  Star,
  BadgeCheck,
} from "lucide-react";

export const metadata = {
  title: "ZicZo Mart — Shop Smarter, Live Better",
  description:
    "Discover quality products at great prices. Fast island-wide delivery and Cash on Delivery. Shop at ZicZo Mart — Sri Lanka's trusted online store.",
};

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
export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: categories },
    { data: featuredRaw },
    { data: newArrivalsRaw },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, image_url, description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(8),

    supabase
      .from("products")
      .select(
        `id, name, slug, price, compare_at_price, stock_quantity, is_featured,
         product_images(storage_path, sort_order),
         categories(name)`,
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),

    supabase
      .from("products")
      .select(
        `id, name, slug, price, compare_at_price, stock_quantity,
         product_images(storage_path, sort_order),
         categories(name)`,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const featuredProducts: ProductCardData[] = (featuredRaw ?? []).map((p) => {
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

  const newArrivals: ProductCardData[] = (newArrivalsRaw ?? []).map((p) => {
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
      imageUrl: imgs[0] ? getImageUrl(supabase, imgs[0].storage_path) : null,
      category: resolveCategory(p.categories),
    };
  });

  /* Hero tiles — deduplicated, up to 4 */
  const heroTileSource = [
    ...featuredProducts,
    ...newArrivals.filter((n) => !featuredProducts.some((f) => f.id === n.id)),
  ].slice(0, 4);
  const heroTiles: (ProductCardData | null)[] = [
    heroTileSource[0] ?? null,
    heroTileSource[1] ?? null,
    heroTileSource[2] ?? null,
    heroTileSource[3] ?? null,
  ];

  const hasCategories = (categories ?? []).length > 0;
  const hasFeatured = featuredProducts.length > 0;
  const hasNewArrivals = newArrivals.length > 0;

  /* ── JSX ─────────────────────────────────────────────────── */
  return (
    <>
      <Header />

      <main>

        {/* ════════════════════════════════════════════════════
            HERO — full-width, centered, clean white
        ════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white">
          {/* Subtle warm gradient blob behind copy */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-orange-50 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-orange-50/70 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20">
            {/* ── Top copy — centered ── */}
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                <span className="h-px w-5 bg-orange-400" />
                Sri Lanka&apos;s Trusted Online Store
                <span className="h-px w-5 bg-orange-400" />
              </p>

              <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                Everything You{" "}
                <span className="text-orange-500">Need,</span>
                <br />
                All in One Place.
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
                Quality products, fast island-wide delivery, and Cash on
                Delivery — no credit card needed. Trusted by shoppers
                across Sri Lanka.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  Shop Now <ArrowRight size={16} />
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-8 py-3.5 text-sm font-bold text-gray-700 transition hover:border-orange-400 hover:text-orange-600"
                >
                  Browse Categories
                </Link>
              </div>

              {/* Trust strip */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-gray-100 pt-7">
                {[
                  { icon: Truck, label: "Island-Wide Delivery" },
                  { icon: ShieldCheck, label: "Secure Checkout" },
                  { icon: BadgeCheck, label: "Quality Guaranteed" },
                  { icon: RefreshCw, label: "Easy Returns" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon size={15} className="text-orange-500" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Product showcase — only rendered if products exist ── */}
            {heroTileSource.length > 0 && (
              <div className="mt-12">
                {/* Section label */}
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                      <Star size={11} />
                      Featured
                    </span>
                    <p className="text-sm font-bold text-gray-700">Top Products</p>
                  </div>
                  <Link
                    href="/products"
                    className="flex items-center gap-1.5 text-sm font-bold text-orange-500 transition hover:text-orange-600"
                  >
                    View All <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Responsive product row — 1 to 4 cards */}
                <Link href="/products" className="group block" aria-label="Browse all products">
                  <div className={`grid gap-4 ${
                    heroTileSource.length === 1 ? "grid-cols-1 max-w-xs mx-auto" :
                    heroTileSource.length === 2 ? "grid-cols-2 max-w-lg mx-auto" :
                    heroTileSource.length === 3 ? "grid-cols-3" :
                    "grid-cols-2 sm:grid-cols-4"
                  }`}>
                    {heroTileSource.map((p) => (
                      <div
                        key={p.id}
                        className="overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition-all duration-300 group-hover:shadow-md group-hover:ring-orange-200"
                      >
                        {p.imageUrl ? (
                          <div className="relative aspect-square overflow-hidden bg-white">
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-square items-center justify-center bg-gray-100">
                            <Package size={32} className="text-gray-300" />
                          </div>
                        )}
                        <div className="border-t border-gray-100 bg-white px-3 py-2.5">
                          <p className="line-clamp-1 text-xs font-semibold text-gray-800">{p.name}</p>
                          <p className="mt-0.5 text-xs font-extrabold text-orange-500">
                            Rs. {Number(p.price).toLocaleString("en-LK")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            TRUST BAR
        ════════════════════════════════════════════════════ */}
        <div className="border-y border-gray-100 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 md:grid-cols-4">
            {[
              { icon: Truck, title: "Island-Wide Delivery", desc: "Fast, reliable shipping" },
              { icon: ShieldCheck, title: "Safe & Secure", desc: "Trusted checkout" },
              { icon: Headphones, title: "Customer Support", desc: "Here when you need us" },
              { icon: RefreshCw, title: "Easy Returns", desc: "Hassle-free policy" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 px-5 py-5 sm:px-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <Icon size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SHOP BY CATEGORY
        ════════════════════════════════════════════════════ */}
        {hasCategories && (
          <section className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              {/* Header */}
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                    Collections
                  </p>
                  <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                    Shop by Category
                  </h2>
                </div>
                <Link
                  href="/categories"
                  className="hidden items-center gap-1.5 text-sm font-bold text-gray-500 transition hover:text-orange-500 sm:flex"
                >
                  All Categories <ArrowRight size={14} />
                </Link>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                {(categories ?? []).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="group relative overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:ring-orange-200 hover:shadow-lg"
                  >
                    {cat.image_url ? (
                      <>
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={cat.image_url}
                            alt={cat.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-sm font-bold text-white drop-shadow">
                            {cat.name}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="p-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                          <Tag size={18} className="text-orange-500" />
                        </div>
                        <p className="mt-3 text-sm font-bold text-gray-800 transition-colors group-hover:text-orange-500">
                          {cat.name}
                        </p>
                        {cat.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex sm:hidden">
                <Link
                  href="/categories"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:border-orange-500 hover:text-orange-500"
                >
                  All Categories <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            FEATURED PRODUCTS
        ════════════════════════════════════════════════════ */}
        {hasFeatured && (
          <section className="border-t border-gray-100 bg-gray-50 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                    Handpicked
                  </p>
                  <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                    Featured Products
                  </h2>
                </div>
                <Link
                  href="/products?featured=true"
                  className="hidden items-center gap-1.5 text-sm font-bold text-gray-500 transition hover:text-orange-500 sm:flex"
                >
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-6 flex sm:hidden">
                <Link
                  href="/products?featured=true"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  View All Featured <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            PROMO BANNER — COD
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gray-900">
              {/* Subtle dot grid */}
              <div
                className="absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }}
              />
              {/* Glow */}
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />

              <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2">
                <div>
                  <span className="inline-flex items-center rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-bold tracking-wider text-orange-400">
                    Cash on Delivery
                  </span>
                  <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                    Pay When Your<br />
                    <span className="text-orange-400">Order Arrives.</span>
                  </h2>
                  <p className="mt-4 max-w-sm text-gray-400">
                    Shop with complete confidence — no advance payment, no
                    credit card. Available island-wide across Sri Lanka.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/30 transition hover:bg-orange-400"
                    >
                      Shop Now <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-6 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500 hover:text-white"
                    >
                      Create Free Account
                    </Link>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "COD", label: "Cash on Delivery" },
                    { value: "24/7", label: "Order Anytime" },
                    { value: "LKR", label: "Local Currency" },
                    { value: "🇱🇰", label: "Island-Wide" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center backdrop-blur-sm"
                    >
                      <p className="text-2xl font-extrabold text-white">{value}</p>
                      <p className="mt-1 text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            WHY CHOOSE ZICZO MART
        ════════════════════════════════════════════════════ */}
        <section className="border-t border-gray-100 bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                Our Promise
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Why Choose ZicZo Mart?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
                We&apos;re committed to giving you the best online shopping
                experience in Sri Lanka.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Quality Products",
                  desc: "Every product is carefully vetted to meet our quality standards before it reaches you.",
                  bg: "bg-blue-50",
                  color: "text-blue-600",
                },
                {
                  icon: Truck,
                  title: "Fast Delivery",
                  desc: "Island-wide delivery service with reliable tracking and prompt dispatch.",
                  bg: "bg-orange-50",
                  color: "text-orange-500",
                },
                {
                  icon: RefreshCw,
                  title: "Easy Returns",
                  desc: "Not satisfied? Our hassle-free return policy ensures your peace of mind.",
                  bg: "bg-green-50",
                  color: "text-green-600",
                },
                {
                  icon: Headphones,
                  title: "24/7 Support",
                  desc: "Our customer support team is always ready to help you with any concern.",
                  bg: "bg-purple-50",
                  color: "text-purple-600",
                },
              ].map(({ icon: Icon, title, desc, bg, color }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bg} ${color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-sm font-extrabold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            NEW ARRIVALS
        ════════════════════════════════════════════════════ */}
        {hasNewArrivals && (
          <section className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.15em] text-orange-500">
                    Just In
                  </p>
                  <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                    New Arrivals
                  </h2>
                </div>
                <Link
                  href="/products?sort=newest"
                  className="hidden items-center gap-1.5 text-sm font-bold text-gray-500 transition hover:text-orange-500 sm:flex"
                >
                  See All <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="mt-6 flex sm:hidden">
                <Link
                  href="/products"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:border-orange-500 hover:text-orange-500"
                >
                  See All Products <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasFeatured && !hasNewArrivals && (
          <section className="bg-white py-24">
            <div className="mx-auto max-w-md px-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50">
                <Package size={36} className="text-orange-400" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
                Products Coming Soon
              </h2>
              <p className="mt-3 text-gray-500">
                We&apos;re stocking up. Check back shortly for amazing products.
              </p>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            NEWSLETTER / ACCOUNT CTA
        ════════════════════════════════════════════════════ */}
        <section className="border-t border-gray-100 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-3xl bg-orange-500 px-8 py-12 text-center sm:px-16">
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                Start Shopping Today
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-orange-100">
                Create a free account to track orders, save addresses, and get
                early access to deals.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-extrabold text-orange-500 shadow transition hover:bg-orange-50"
                >
                  Create Free Account <ArrowRight size={15} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
