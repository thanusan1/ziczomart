import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DiscountBadge, StockBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "./add-to-cart-button";
import { Package, Tag, ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `Buy ${product.name} at ZicZo Mart`,
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, sku, description, price, compare_at_price,
       stock_quantity, is_active, is_featured,
       product_images(id, storage_path, alt_text, sort_order),
       categories(name, slug)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) notFound();

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const catRaw = product.categories as
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  const category = Array.isArray(catRaw) ? catRaw[0] : catRaw;

  const price = Number(product.price);
  const comparePrice = product.compare_at_price
    ? Number(product.compare_at_price)
    : null;
  const hasDiscount = comparePrice != null && comparePrice > price;

  const getUrl = (path: string) =>
    supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;

  const primaryImage = images[0];
  const thumbnails = images.slice(1);

  /* Related products from same category */
  let relatedProducts: {
    id: string; name: string; slug: string; price: number;
    imageUrl: string | null;
  }[] = [];

  if (category && !Array.isArray(catRaw)) {
    const { data: related } = await supabase
      .from("products")
      .select(
        `id, name, slug, price,
         product_images(storage_path, sort_order)`,
      )
      .eq("is_active", true)
      .neq("slug", slug)
      .limit(4);

    relatedProducts = (related ?? []).map((p) => {
      const img = [...(p.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      )[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        imageUrl: img ? getUrl(img.storage_path) : null,
      };
    });
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <Breadcrumb
              items={[
                { label: "Products", href: "/products" },
                ...(category
                  ? [{ label: category.name, href: `/products?category=${category.slug}` }]
                  : []),
                { label: product.name },
              ]}
            />
          </div>
        </div>

        {/* Product Detail */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">

            {/* ── Image Gallery ───────────────────────────── */}
            <div className="space-y-3">
              {/* Primary image */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                {primaryImage ? (
                  <div className="relative aspect-square">
                    <Image
                      src={getUrl(primaryImage.storage_path)}
                      alt={primaryImage.alt_text ?? product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center">
                    <Package size={72} className="text-gray-200" />
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute left-4 top-4">
                    <DiscountBadge price={price} compareAtPrice={comparePrice} />
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {thumbnails.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {thumbnails.map((img) => (
                    <div
                      key={img.id}
                      className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={getUrl(img.storage_path)}
                          alt={img.alt_text ?? product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product Info ─────────────────────────────── */}
            <div className="flex flex-col py-2">
              {/* Category */}
              {category && (
                <Link
                  href={`/products?category=${category.slug}`}
                  className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100"
                >
                  <Tag size={11} />
                  {category.name}
                </Link>
              )}

              {/* Name */}
              <h1 className="text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
                {product.name}
              </h1>

              {/* SKU */}
              {product.sku && (
                <p className="mt-2 text-xs text-gray-400">
                  SKU: <span className="font-medium text-gray-500">{product.sku}</span>
                </p>
              )}

              {/* Price */}
              <div className="mt-5 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatPrice(price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(comparePrice!)}
                    </span>
                    <DiscountBadge
                      price={price}
                      compareAtPrice={comparePrice}
                      className="text-sm"
                    />
                  </>
                )}
              </div>

              {/* Stock */}
              <div className="mt-3">
                <StockBadge quantity={product.stock_quantity} />
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-gray-100" />

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-gray-500">
                    Description
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Add to Cart */}
              <div className="mt-auto">
                <AddToCartButton
                  productId={product.id}
                  stockQuantity={product.stock_quantity}
                />
              </div>

              {/* Trust */}
              <div className="mt-5 flex flex-wrap gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
                <span>✓ Cash on Delivery</span>
                <span>✓ Island-wide shipping</span>
                <span>✓ Secure checkout</span>
              </div>

              {/* Back link */}
              <Link
                href="/products"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-500"
              >
                <ArrowLeft size={14} />
                Back to Products
              </Link>
            </div>
          </div>
        </section>

        {/* ── Related Products ───────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-gray-100 bg-gray-50 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 className="mb-6 text-xl font-extrabold text-gray-900">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package size={30} className="text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-semibold text-gray-800 group-hover:text-orange-500">
                        {p.name}
                      </p>
                      <p className="mt-1.5 text-sm font-extrabold text-gray-900">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
