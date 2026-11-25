import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditCategoryForm from "./edit-category-form";
import { ArrowLeft } from "lucide-react";

export const instant = false;

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, description, image_url, is_active, sort_order")
    .eq("id", id)
    .single();

  if (error || !category) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/categories"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-500"
      >
        <ArrowLeft size={16} />
        Back to Categories
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900">Edit Category</h1>

      <p className="mb-8 mt-2 text-gray-500">
        Update your category information and image.
      </p>

      <EditCategoryForm category={category} />
    </div>
  );
}
