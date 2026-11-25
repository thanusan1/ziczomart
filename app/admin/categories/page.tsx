import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Plus,
  Tags,
  Pencil,
  Trash2,
  Pause,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { deleteCategory, toggleCategoryStatus } from "./actions";

export const instant = false;

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select(
      "id, name, slug, description, image_url, is_active, sort_order, created_at",
    )
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
            Store Management
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            Categories
          </h1>

          <p className="mt-2 text-gray-500">
            Organize your products into categories.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <Plus size={18} />
          Add Category
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Unable to load categories. Check your Supabase database permissions.
          <p className="mt-2 text-sm">{error.message}</p>
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Sort Order</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-14 w-14 rounded-lg border border-gray-200 bg-white object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                            <ImageIcon size={22} />
                          </div>
                        )}

                        <div className="max-w-xs">
                          <p className="font-semibold text-gray-900">
                            {category.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {category.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-500">{category.slug}</td>

                    <td className="px-6 py-4 text-gray-600">
                      {category.sort_order}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          category.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.is_active ? "Active" : "Paused"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {new Date(category.created_at).toLocaleDateString(
                        "en-LK",
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          title="Edit category"
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Pencil size={16} />
                        </Link>

                        <form action={toggleCategoryStatus}>
                          <input type="hidden" name="id" value={category.id} />
                          <input
                            type="hidden"
                            name="is_active"
                            value={String(category.is_active)}
                          />

                          <button
                            type="submit"
                            title={
                              category.is_active
                                ? "Pause category"
                                : "Activate category"
                            }
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                          >
                            {category.is_active ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </button>
                        </form>

                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={category.id} />

                          <button
                            type="submit"
                            title="Delete category"
                            className="rounded-lg border border-gray-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Tags className="mx-auto text-gray-300" size={42} />

          <h2 className="mt-4 text-lg font-bold text-gray-900">
            No categories yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Create categories to organize your store products.
          </p>

          <Link
            href="/admin/categories/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={17} />
            Create First Category
          </Link>
        </div>
      )}
    </div>
  );
}
