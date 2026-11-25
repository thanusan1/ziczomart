import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Package } from "lucide-react";

export const instant = false;

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
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
      product_images (
        storage_path,
        sort_order
      ),
      categories (
        name
      )
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="font-semibold uppercase tracking-wider text-orange-500">
            Our Collection
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
            All Products
          </h1>

          <p className="mt-3 text-gray-500">Discover products at ZicZo Mart.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            Unable to load products: {error.message}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const images = [...(product.product_images ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order,
              );

              const image = images[0];

              const imageUrl = image
                ? supabase.storage
                    .from("product-images")
                    .getPublicUrl(image.storage_path).data.publicUrl
                : null;

              const categoriesData = product.categories as
                | { name: string }
                | { name: string }[]
                | null;
              const category = Array.isArray(categoriesData)
                ? categoriesData[0]?.name
                : categoriesData?.name;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex aspect-square items-center justify-center bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Package size={48} className="text-gray-300" />
                    )}
                  </div>

                  <div className="p-5">
                    {category && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                        {category}
                      </p>
                    )}

                    <h2 className="mt-2 line-clamp-2 font-bold text-gray-900">
                      {product.name}
                    </h2>

                    <p className="mt-3 text-lg font-extrabold text-gray-900">
                      Rs.{" "}
                      {Number(product.price).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
            <Package size={48} className="mx-auto text-gray-300" />

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No products available
            </h2>

            <p className="mt-2 text-gray-500">
              Please check back soon for new products.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              Back to Home
            </Link>
          </div>
        )}
      </section>

      <footer className="bg-black px-6 py-8 text-center text-sm text-gray-400">
        © 2026 ZicZo Mart. All rights reserved.
      </footer>
    </main>
  );
}
