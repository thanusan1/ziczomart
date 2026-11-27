import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProductForm from "./edit-product-form";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("id, storage_path, alt_text, sort_order")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  const productImages = (images ?? []).map((image) => ({
    id: image.id,
    storage_path: image.storage_path,
    alt_text: image.alt_text,
    sort_order: image.sort_order,
    url: supabase.storage
      .from("product-images")
      .getPublicUrl(image.storage_path).data.publicUrl,
  }));

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
          Store Management
        </p>

        <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
          Edit Product
        </h1>

        <p className="mt-2 text-gray-500">
          Update product information, pricing, stock and images.
        </p>
      </div>

      <EditProductForm product={product} initialImages={productImages} />
    </div>
  );
}
