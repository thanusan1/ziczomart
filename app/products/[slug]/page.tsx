import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import TrustStrip from "@/components/ui/trust-strip";
import ProductMainSection from "@/components/products/product-main-section";
import ProductDetailsTabs, {
  type ProductSpecRow,
} from "@/components/products/product-details-tabs";
import ProductReviewsSection from "@/components/products/product-reviews-section";
import RelatedProductsSection from "@/components/products/related-products-section";
import type { ProductCardData } from "@/components/ui/product-card";
import type { GalleryImage } from "@/components/products/product-image-gallery";
import { getMainCategoryHref, getSubcategoryHref } from "@/lib/categories/slug";
import { getStoreSettings } from "@/lib/store-settings";
import {
  fetchPublicProductReviews,
  getProductReviewEligibility,
} from "@/lib/reviews";
import {
  getActiveDealsWithProducts,
  resolveProductDealPricing,
} from "@/lib/deals";
import { discountPercent } from "@/lib/utils";

export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
};

function getPublicImageUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
): string {
  return supabase.storage
    .from("product-images")
    .getPublicUrl(storagePath).data.publicUrl;
}

function extractShortDescription(description: string | null): string | null {
  if (!description) return null;
  const cleaned = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^[-•*]\s+/.test(line))
    .join(" ")
    .trim();

  if (!cleaned) return null;
  if (cleaned.length <= 180) return cleaned;
  return `${cleaned.slice(0, 180).trimEnd()}…`;
}

function extractKeyFeatures(description: string | null): string[] {
  if (!description) return [];
  const bullets = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-•*]\s+/.test(line))
    .map((line) => line.replace(/^[-•*]\s+/, "").trim())
    .filter((line) => line.length > 0 && line.length <= 120);

  return bullets.slice(0, 5);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      `name, slug, description, price,
       product_images(storage_path, sort_order)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const ogImage = images[0]
    ? getPublicImageUrl(supabase, images[0].storage_path)
    : undefined;

  const metaDescription =
    extractShortDescription(product.description)?.slice(0, 160) ??
    `Shop ${product.name} online at ZicZo Mart. Fast island-wide delivery across Sri Lanka.`;

  return {
    title: product.name,
    description: metaDescription,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | ZicZo Mart`,
      description: metaDescription,
      url: `/products/${product.slug}`,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, alt: product.name }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: `${product.name} | ZicZo Mart`,
      description: metaDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  /* ── 1. Fetch active product with images ─────────────────────── */
  const { data: product, error } = await supabase
    .from("products")
    .select(
      `id, category_id, name, slug, sku, description, price, compare_at_price,
       stock_quantity, is_active, is_featured,
       product_images(id, storage_path, alt_text, sort_order)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  /* ── 2. Fetch categories hierarchy, public reviews, user, deals & settings ── */
  const [
    { data: allCategories },
    reviews,
    { settings },
    { productDealMap },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true),
    fetchPublicProductReviews(supabase, product.id),
    getStoreSettings(supabase),
    getActiveDealsWithProducts(supabase),
    supabase.auth.getUser(),
  ]);

  const eligibility = await getProductReviewEligibility(
    supabase,
    product.id,
    user?.id ?? null,
  );

  const categoryMap = new Map(
    (allCategories ?? []).map((c) => [c.id, c]),
  );
  const assignedCategory = product.category_id
    ? categoryMap.get(product.category_id) ?? null
    : null;
  const parentCategory =
    assignedCategory?.parent_id
      ? categoryMap.get(assignedCategory.parent_id) ?? null
      : null;

  const mainCategory = parentCategory ?? assignedCategory;
  const subCategory = parentCategory ? assignedCategory : null;

  const mainCategoryHref = mainCategory
    ? getMainCategoryHref(mainCategory)
    : "/products";
  const subCategoryHref =
    mainCategory && subCategory
      ? getSubcategoryHref(mainCategory, subCategory.slug)
      : null;

  const breadcrumbItems = [
    ...(mainCategory
      ? [{ label: mainCategory.name, href: mainCategoryHref }]
      : [{ label: "Products", href: "/products" }]),
    ...(subCategory && subCategoryHref
      ? [{ label: subCategory.name, href: subCategoryHref }]
      : []),
    { label: product.name },
  ];

  /* ── 3. Images & Pricing ─────────────────────────────────────── */
  const sortedImages = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const galleryImages: GalleryImage[] = sortedImages.map((img, idx) => ({
    id: img.id,
    url: getPublicImageUrl(supabase, img.storage_path),
    alt: img.alt_text?.trim() || `${product.name} - Image ${idx + 1}`,
  }));

  const rawPrice = Number(product.price);
  const rawCompareAt = product.compare_at_price
    ? Number(product.compare_at_price)
    : null;
  const dealPricing = resolveProductDealPricing(
    rawPrice,
    rawCompareAt,
    productDealMap.get(product.id),
  );
  const price = dealPricing.effectivePrice;
  const compareAtPrice = dealPricing.effectiveCompareAt;
  const pctOff =
    compareAtPrice && compareAtPrice > price
      ? discountPercent(price, compareAtPrice)
      : 0;

  /* ── 4. Reviews aggregation ──────────────────────────────────── */
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  /* ── 5. Related Products (same subcategory -> main category -> sibling subs) ── */
  const candidateCategoryIds: string[] = [];
  if (product.category_id) candidateCategoryIds.push(product.category_id);
  if (mainCategory) {
    if (!candidateCategoryIds.includes(mainCategory.id)) {
      candidateCategoryIds.push(mainCategory.id);
    }
    for (const cat of allCategories ?? []) {
      if (
        cat.parent_id === mainCategory.id &&
        !candidateCategoryIds.includes(cat.id)
      ) {
        candidateCategoryIds.push(cat.id);
      }
    }
  }

  let relatedRaw: {
    id: string;
    category_id: string | null;
    name: string;
    slug: string;
    price: number | string;
    compare_at_price: number | string | null;
    stock_quantity: number;
    is_featured: boolean;
    product_images: { storage_path: string; sort_order: number }[] | null;
  }[] = [];

  if (candidateCategoryIds.length > 0) {
    const { data: sameCatProducts } = await supabase
      .from("products")
      .select(
        `id, category_id, name, slug, price, compare_at_price, stock_quantity, is_featured,
         product_images(storage_path, sort_order)`,
      )
      .eq("is_active", true)
      .neq("id", product.id)
      .in("category_id", candidateCategoryIds)
      .limit(8);

    relatedRaw = (sameCatProducts ?? []).sort((a, b) => {
      const aExact = a.category_id === product.category_id ? 0 : 1;
      const bExact = b.category_id === product.category_id ? 0 : 1;
      return aExact - bExact;
    });
  }

  const relatedSlice = relatedRaw.slice(0, 4);
  const relatedIds = relatedSlice.map((p) => p.id);
  const relatedRatingMap = new Map<string, { sum: number; count: number }>();

  if (relatedIds.length > 0) {
    const { data: relReviews } = await supabase
      .from("reviews")
      .select("product_id, rating")
      .eq("is_published", true)
      .in("product_id", relatedIds);

    for (const rev of relReviews ?? []) {
      const prev = relatedRatingMap.get(rev.product_id) ?? { sum: 0, count: 0 };
      relatedRatingMap.set(rev.product_id, {
        sum: prev.sum + Number(rev.rating),
        count: prev.count + 1,
      });
    }
  }

  const relatedProducts: ProductCardData[] = relatedSlice.map((p) => {
    const imgs = [...(p.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const cat = p.category_id ? categoryMap.get(p.category_id) : null;
    const agg = relatedRatingMap.get(p.id);
    const relPricing = resolveProductDealPricing(
      Number(p.price),
      p.compare_at_price ? Number(p.compare_at_price) : null,
      productDealMap.get(p.id),
    );
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: relPricing.effectivePrice,
      compare_at_price: relPricing.effectiveCompareAt,
      stock_quantity: p.stock_quantity,
      is_featured: p.is_featured,
      imageUrl: imgs[0]
        ? getPublicImageUrl(supabase, imgs[0].storage_path)
        : null,
      category: cat?.name ?? null,
      categorySlug: cat?.slug ?? null,
      rating: agg ? agg.sum / agg.count : null,
      reviewCount: agg?.count ?? 0,
    };
  });

  /* ── 6. Dynamic Specifications & Key Features (no invented data) ── */
  const specifications: ProductSpecRow[] = [
    ...(mainCategory ? [{ label: "Category", value: mainCategory.name }] : []),
    ...(subCategory
      ? [{ label: "Subcategory", value: subCategory.name }]
      : []),
    ...(product.sku ? [{ label: "SKU", value: product.sku }] : []),
    {
      label: "Availability",
      value:
        product.stock_quantity > 0
          ? `In Stock (${product.stock_quantity} available)`
          : "Out of Stock",
    },
  ];

  const keyFeatures = extractKeyFeatures(product.description);
  const shortDescription = extractShortDescription(product.description);
  const freeDeliveryNotice = settings.announcement_1
    ?.toLowerCase()
    .includes("free delivery")
    ? settings.announcement_1
    : null;

  /* ── 7. JSON-LD Structured Data ──────────────────────────────── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(galleryImages.length > 0
      ? { image: galleryImages.map((img) => img.url) }
      : {}),
    ...(shortDescription ? { description: shortDescription } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: price.toFixed(2),
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(reviewCount > 0 && averageRating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="min-h-screen bg-[#F8FAFC] pb-20 lg:pb-0">
        {/* Breadcrumb Bar */}
        <div className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <Breadcrumb
              items={breadcrumbItems}
              className="flex-wrap text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Main 3-Column Product Section */}
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <ProductMainSection
            images={galleryImages}
            discountPct={pctOff}
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            sku={product.sku}
            brand={null}
            categoryName={subCategory?.name ?? mainCategory?.name ?? null}
            categoryHref={subCategoryHref ?? mainCategoryHref}
            price={price}
            compareAtPrice={compareAtPrice}
            stockQuantity={product.stock_quantity}
            shortDescription={shortDescription}
            keyFeatures={keyFeatures}
            rating={averageRating}
            reviewCount={reviewCount}
            freeDeliveryNotice={freeDeliveryNotice}
          />
        </section>

        {/* Description / Specifications Tabs + You May Also Like */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-6">
              <ProductDetailsTabs
                description={product.description}
                specifications={specifications}
                reviewCount={reviewCount}
              />
            </div>

            <div className="lg:col-span-6">
              <RelatedProductsSection
                products={relatedProducts}
                viewAllHref={subCategoryHref ?? mainCategoryHref}
              />
            </div>
          </div>
        </section>

        {/* Full Customer Reviews Section */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productImageUrl={galleryImages[0]?.url ?? null}
            reviews={reviews}
            eligibility={eligibility}
          />
        </section>

        {/* Existing Trust Benefits Strip */}
        <TrustStrip />
      </main>

      {/* Existing Global Footer (rendered exactly once) */}
      <Footer />
    </>
  );
}
