import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, ArrowLeft, ShoppingCart } from "lucide-react";
import AddToCartButton from "./add-to-cart-button";

export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      description,
      price,
      compare_at_price,
      stock_quantity,
      is_active,
      product_images (
        id,
        storage_path,
        alt_text,
        sort_order
      ),
      categories (
        name
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const categoriesData = product.categories as
    | { name: string }
    | { name: string }[]
    | null;
  const category = Array.isArray(categoriesData)
    ? categoriesData[0]?.name
    : categoriesData?.name;

  const price = Number(product.price);
  const comparePrice = Number(product.compare_at_price);

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <ShoppingCart size={17} />
            Cart
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/products"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            {images.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {images.map((image) => {
                  const imageUrl = supabase.storage
                    .from("product-images")
                    .getPublicUrl(image.storage_path).data.publicUrl;

                  return (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-2xl bg-gray-100"
                    >
                      <img
                        src={imageUrl}
                        alt={image.alt_text || product.name}
                        className="aspect-square h-full w-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-gray-100">
                <Package size={70} className="text-gray-300" />
              </div>
            )}
          </div>

          <div className="py-4">
            {category && (
              <p className="font-semibold uppercase tracking-wider text-orange-500">
                {category}
              </p>
            )}

            <h1 className="mt-3 text-4xl font-extrabold text-gray-900">
              {product.name}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-extrabold text-gray-900">
                Rs.{" "}
                {price.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              {comparePrice > price && (
                <p className="text-lg text-gray-400 line-through">
                  Rs.{" "}
                  {comparePrice.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <div className="mt-6">
              {product.stock_quantity > 0 ? (
                <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                  In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-bold text-gray-900">
                Product Description
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                {product.description || "No description available."}
              </p>
            </div>

            <AddToCartButton
              productId={product.id}
              stockQuantity={product.stock_quantity}
            />

            <p className="mt-3 text-center text-xs text-gray-400">
              Secure shopping at ZicZo Mart
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
