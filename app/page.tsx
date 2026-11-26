import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProductCard, { type ProductCardData } from "@/components/ui/product-card";
import ProductPlaceholderCard from "@/components/ui/product-placeholder-card";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Tag,
  Zap,
  Star,
  Rocket,
  Trophy,
  Mail,
  Share2,
  MessageCircle,
  Video,
  Globe,
} from "lucide-react";

export const instant = false;

export const metadata = {
  title: "ZicZo Mart — Everything You Love. All in One Place.",
  description:
    "Discover everyday essentials, trending collections and unbeatable deals at ZicZo Mart. Fast island-wide delivery & Cash on Delivery.",
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

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  compare_at_price: number | string | null;
  stock_quantity: number;
  is_featured?: boolean | null;
  product_images: { storage_path: string; sort_order: number }[] | null;
  categories: { name: string } | { name: string }[] | null;
};

function mapProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  p: RawProduct,
): ProductCardData {
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
    is_featured: Boolean(p.is_featured),
    imageUrl: imgs[0] ? getImageUrl(supabase, imgs[0].storage_path) : null,
    category: resolveCategory(p.categories),
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildSlots<T>(items: T[], totalSlots: number): (T | null)[] {
  const sliced = items.slice(0, totalSlots);
  return Array.from({ length: totalSlots }, (_, idx) => sliced[idx] ?? null);
}

/* ── Page ────────────────────────────────────────────────── */
export default async function HomePage() {
  const supabase = await createClient();

  /* Fetch active categories and active products fresh from Supabase */
  const [
    { data: categoriesRaw },
    { data: dealsRaw },
    { data: featuredRaw },
    { data: newArrivalsRaw },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, image_url")
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
      .not("compare_at_price", "is", null)
      .order("created_at", { ascending: false })
      .limit(12),

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
        `id, name, slug, price, compare_at_price, stock_quantity, is_featured,
         product_images(storage_path, sort_order),
         categories(name)`,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const categories = dedupeById(categoriesRaw ?? []).slice(0, 8);

  /* Today's Best Deals: discounted active products (compare_at_price > price), exactly 5 slots */
  const dealsProducts = dedupeById(
    (dealsRaw ?? [])
      .map((p) => mapProduct(supabase, p as RawProduct))
      .filter(
        (p) =>
          p.compare_at_price != null &&
          Number(p.compare_at_price) > Number(p.price),
      ),
  );
  const dealSlots = buildSlots(dealsProducts, 5);

  /* Featured Products: is_featured = true, exactly 5 slots */
  const featuredProducts = dedupeById(
    (featuredRaw ?? []).map((p) => mapProduct(supabase, p as RawProduct)),
  );
  const featuredSlots = buildSlots(featuredProducts, 5);

  /* New Arrivals: newest active products, exactly 5 slots */
  const newArrivalsProducts = dedupeById(
    (newArrivalsRaw ?? []).map((p) => mapProduct(supabase, p as RawProduct)),
  );
  const newArrivalSlots = buildSlots(newArrivalsProducts, 5);

  /* Best Sellers: 3 slots — prefer featured or other active products without duplicating within Best Sellers */
  const bestSellerPool = dedupeById([
    ...featuredProducts,
    ...dealsProducts,
    ...newArrivalsProducts,
  ]);
  const bestSellerSlots = buildSlots(bestSellerPool, 3);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
        {/* ════════════════════════════════════════════════════
            1. HERO BANNER (Uses uploaded hero-showcase.jpg)
        ════════════════════════════════════════════════════ */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-[#EAF1FF]">
              {/* Desktop background image — crisp and unwashed */}
              <div className="hidden md:block">
                <Image
                  src="/images/hero-banner.jpg"
                  alt="ZicZo Mart Featured Products Showcase"
                  fill
                  priority
                  quality={95}
                  sizes="1280px"
                  className="object-cover object-right"
                />
              </div>

              <div className="relative z-10 grid items-center md:min-h-[380px] lg:min-h-[420px] md:grid-cols-12">
                {/* Left Hero Copy */}
                <div className="px-6 py-10 sm:px-10 md:col-span-7 lg:col-span-6 lg:py-14">
                  <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-[#0A1633] sm:text-4xl lg:text-[42px]">
                    Everything You Love.
                    <br />
                    <span className="text-[#1049C6]">All in One Place.</span>
                  </h1>

                  <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                    Discover everyday essentials, trending collections and
                    unbeatable deals.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-2 rounded-full bg-[#1049C6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8]"
                    >
                      Shop Now <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/categories"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#0A1633] transition hover:border-[#1049C6] hover:text-[#1049C6]"
                    >
                      Explore Categories
                    </Link>
                  </div>

                  {/* Subtle carousel dots matching reference */}
                  <div className="mt-8 flex items-center gap-1.5">
                    <span className="h-1.5 w-6 rounded-full bg-[#1049C6]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  </div>
                </div>
              </div>

              {/* Mobile showcase image */}
              <div className="relative aspect-[16/9] w-full md:hidden">
                <Image
                  src="/images/hero-banner.jpg"
                  alt="ZicZo Mart Featured Products Showcase"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              2. TRUST STRIP
          ════════════════════════════════════════════════════ */}
          <div className="border-b border-gray-200/80 bg-white">
            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-gray-100 px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-y-0">
              {[
                {
                  icon: ShieldCheck,
                  title: "Secure Payments",
                  desc: "Your information is safe",
                },
                {
                  icon: Truck,
                  title: "Fast Delivery",
                  desc: "Get your order quickly",
                },
                {
                  icon: RefreshCw,
                  title: "Easy Returns",
                  desc: "Hassle-free returns",
                },
                {
                  icon: Headphones,
                  title: "24/7 Customer Support",
                  desc: "We're here to help",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-3.5 px-3 py-5 sm:px-5"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1049C6]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0A1633]">{title}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            3. SHOP BY CATEGORY
        ════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#0A1633] sm:text-2xl">
              Shop by Category
            </h2>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] transition hover:text-[#0B3BA8] sm:text-sm"
            >
              Browse All Categories <ArrowRight size={14} />
            </Link>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200/90 bg-white p-2.5 text-center shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-50">
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 12vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-50/50">
                        <Tag size={24} className="text-[#1049C6]/45" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2.5 line-clamp-2 min-h-[2rem] text-xs font-semibold leading-snug text-[#0A1633] transition-colors group-hover:text-[#1049C6]">
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <Tag size={24} className="mx-auto text-gray-300" />
              <p className="mt-2 text-sm font-semibold text-gray-500">
                Categories Coming Soon
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Categories added in your admin dashboard will appear here
                automatically.
              </p>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════
            4. TODAY'S BEST DEALS (Exactly 5 Slots)
        ════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={20} className="fill-[#1049C6] text-[#1049C6]" />
              <h2 className="text-xl font-extrabold text-[#0A1633] sm:text-2xl">
                Today&apos;s Best Deals
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] transition hover:text-[#0B3BA8] sm:text-sm"
            >
              View All Deals <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            {dealSlots.map((product, index) =>
              product ? (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="deal"
                />
              ) : (
                <ProductPlaceholderCard
                  key={`deal-placeholder-${index}`}
                  variant="deal"
                  message="Deals Coming Soon"
                />
              ),
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            5. FEATURED PRODUCTS (5 Slots) + UPGRADE YOUR EVERYDAY BANNER
        ════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Featured Products (5 slots) */}
            <div className="lg:col-span-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={19} className="fill-[#1049C6] text-[#1049C6]" />
                  <h2 className="text-lg font-extrabold text-[#0A1633] sm:text-xl">
                    Featured Products
                  </h2>
                </div>
                <Link
                  href="/products?featured=true"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] transition hover:text-[#0B3BA8] lg:hidden"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {featuredSlots.map((product, index) =>
                  product ? (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="compact"
                    />
                  ) : (
                    <ProductPlaceholderCard
                      key={`featured-placeholder-${index}`}
                      variant="compact"
                    />
                  ),
                )}
              </div>
            </div>

            {/* Right: "Upgrade Your Everyday" Promo Banner (Uses uploaded promo-portrait.jpg) */}
            <div className="flex flex-col lg:col-span-4">
              <div className="mb-4 hidden items-center justify-end lg:flex">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] transition hover:text-[#0B3BA8]"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="relative flex-1 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#DCE8FF] via-[#E8F0FF] to-[#C8DBFF] min-h-[230px]">
                {/* Right-side Portrait Image */}
                <div className="absolute inset-y-0 right-0 w-[56%] sm:w-[52%]">
                  <Image
                    src="/images/promo-woman.jpg"
                    alt="Upgrade Your Everyday with ZicZo Mart"
                    fill
                    sizes="(max-width: 1024px) 50vw, 280px"
                    className="object-cover object-top"
                  />
                  {/* Subtle blend on the left edge of portrait */}
                  <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#E2ECFF] to-transparent" />
                </div>

                {/* Left Text & CTA */}
                <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-between p-5 sm:p-6">
                  <div>
                    <h3 className="text-xl font-extrabold leading-tight text-[#0A1633] sm:text-2xl">
                      Upgrade
                      <br />
                      Your Everyday
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      Discover products that make life better.
                    </p>
                  </div>

                  <div className="mt-5">
                    <Link
                      href="/products"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1049C6] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8]"
                    >
                      Explore Now <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            6. NEW ARRIVALS (5 Slots) + BEST SELLERS (3 Slots)
        ════════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: New Arrivals (5 slots) */}
            <div className="lg:col-span-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket size={18} className="text-[#1049C6]" />
                  <h2 className="text-lg font-extrabold text-[#0A1633] sm:text-xl">
                    New Arrivals
                  </h2>
                </div>
                <Link
                  href="/products?sort=newest"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] transition hover:text-[#0B3BA8]"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {newArrivalSlots.map((product, index) =>
                  product ? (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="compact"
                    />
                  ) : (
                    <ProductPlaceholderCard
                      key={`arrival-placeholder-${index}`}
                      variant="compact"
                    />
                  ),
                )}
              </div>
            </div>

            {/* Right: Best Sellers (3 slots) */}
            <div className="lg:col-span-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h2 className="text-lg font-extrabold text-[#0A1633] sm:text-xl">
                    Best Sellers
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] transition hover:text-[#0B3BA8]"
                >
                  View All <ArrowRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {bestSellerSlots.map((product, index) =>
                  product ? (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="compact"
                    />
                  ) : (
                    <ProductPlaceholderCard
                      key={`bestseller-placeholder-${index}`}
                      variant="compact"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            7. ROYAL BLUE NEWSLETTER / ACCOUNT CTA BAR
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#1049C6]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-6 sm:px-6 lg:flex-row">
            {/* Left Copy */}
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-white sm:flex">
                <Mail size={22} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white sm:text-lg">
                  Stay Ahead of the Trends
                </h2>
                <p className="text-xs text-blue-100">
                  Get exclusive deals, new arrivals and order updates with a free
                  account.
                </p>
              </div>
            </div>

            {/* Center Action (Routes to real registration — no fake subscription) */}
            <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-bold text-[#1049C6] shadow-sm transition hover:bg-blue-50"
              >
                Create Free Account <ArrowRight size={14} />
              </Link>
              <Link
                href="/products"
                className="flex items-center justify-center rounded-lg bg-[#0A1633] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900"
              >
                Explore Deals
              </Link>
            </div>

            {/* Right Social Icons */}
            <div className="flex items-center gap-2.5">
              {[
                { Icon: Share2, label: "Facebook", href: "#" },
                { Icon: MessageCircle, label: "Instagram", href: "#" },
                { Icon: Video, label: "YouTube", href: "#" },
                { Icon: Globe, label: "Website", href: "#" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-[#1049C6]"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
