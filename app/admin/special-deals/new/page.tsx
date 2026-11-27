import { createClient } from "@/lib/supabase/server";
import DealForm, {
  type SelectableDealProduct,
} from "@/components/admin/deal-form";

export const metadata = {
  title: "Create Special Deal",
};

export const instant = false;

export default async function CreateSpecialDealPage() {
  const supabase = await createClient();

  const { data: productsRaw } = await supabase
    .from("products")
    .select(
      `id, name, sku, price, stock_quantity,
       product_images(storage_path, sort_order)`,
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  const allProducts: SelectableDealProduct[] = (productsRaw ?? []).map((p) => {
    const imgs = [...(p.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const imageUrl = imgs[0]
      ? supabase.storage
          .from("product-images")
          .getPublicUrl(imgs[0].storage_path).data.publicUrl
      : null;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.price),
      stock_quantity: p.stock_quantity,
      imageUrl,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          Create Special Deal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up a promotional campaign with scheduled dates and discounted
          products.
        </p>
      </div>

      <DealForm allProducts={allProducts} />
    </div>
  );
}
