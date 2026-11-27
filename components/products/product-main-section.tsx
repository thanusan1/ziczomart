"use client";

import { useState } from "react";
import ProductImageGallery, {
  type GalleryImage,
} from "@/components/products/product-image-gallery";
import ProductPurchasePanel, {
  type ProductVariantOption,
} from "@/components/products/product-purchase-panel";
import ProductDeliveryCard from "@/components/products/product-delivery-card";

interface ProductMainSectionProps {
  images: GalleryImage[];
  discountPct: number;
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
  freeDeliveryNotice?: string | null;
}

export default function ProductMainSection({
  images,
  discountPct,
  freeDeliveryNotice,
  ...purchaseProps
}: ProductMainSectionProps) {
  const [selectedVariantImage, setSelectedVariantImage] = useState<
    string | null
  >(null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-7">
      {/* LEFT: Gallery (~42%) */}
      <div className="lg:col-span-5">
        <ProductImageGallery
          images={images}
          productName={purchaseProps.productName}
          discountPct={discountPct}
          selectedImageUrl={selectedVariantImage}
        />
      </div>

      {/* CENTER: Product Info & Purchase Controls (~38-40%) */}
      <div className="lg:col-span-4 xl:col-span-4">
        <ProductPurchasePanel
          {...purchaseProps}
          onSelectVariantImage={setSelectedVariantImage}
        />
      </div>

      {/* RIGHT: Delivery & Customer Service Card (~18-22%) */}
      <div className="lg:col-span-3">
        <ProductDeliveryCard freeDeliveryNotice={freeDeliveryNotice} />
      </div>
    </div>
  );
}
