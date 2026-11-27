import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Package } from "lucide-react";
import ProductActions from "./product-actions";

export const instant = false;

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const [{ data: products, error }, { data: allCategories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        price,
        stock_quantity,
        is_active,
        category_id,
        created_at,
        categories (
          id,
          name
        ),
        product_images (
          storage_path,
          sort_order
        )
      `,
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*"),
  ]);

  const categoryMap = new Map(
    ((allCategories ?? []) as { id: string; name: string; parent_id?: string | null }[]).map(
      (c) => [c.id, c],
    ),
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
            Store Management
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            Products
          </h1>

          <p className="mt-2 text-gray-500">
            View and manage your store products.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Unable to load products: {error.message}
        </div>
      ) : products && products.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stock</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
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

                  const catNode = product.category_id
                    ? categoryMap.get(product.category_id)
                    : null;
                  const parentNode = catNode?.parent_id
                    ? categoryMap.get(catNode.parent_id)
                    : null;
                  const categoryLabel = parentNode
                    ? `${parentNode.name} → ${catNode?.name}`
                    : (catNode?.name ?? category ?? "Uncategorized");

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-64 items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <Package size={23} />
                            </div>
                          )}

                          <span className="font-semibold text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                          {categoryLabel}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {product.sku || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-900">
                        Rs.{" "}
                        {Number(product.price).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {product.stock_quantity}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            product.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {new Date(product.created_at).toLocaleDateString(
                          "en-LK",
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <ProductActions
                          productId={product.id}
                          isActive={product.is_active}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Package className="mx-auto text-gray-300" size={42} />

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            No products yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Your products will appear here after you add them.
          </p>

          <Link
            href="/admin/products/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={17} />
            Add Your First Product
          </Link>
        </div>
      )}
    </div>
  );
}
