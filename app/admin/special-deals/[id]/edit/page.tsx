import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DealForm, {
  type InitialDealData,
  type SelectableDealProduct,
} from "@/components/admin/deal-form";
import type { DealCampaignStatus } from "@/lib/deals";

export const metadata = {
  title: "Edit Special Deal",
};

export const instant = false;

export default async function EditSpecialDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: deal, error }, { data: productsRaw }] = await Promise.all([
    supabase
      .from("special_deals")
      .select(
        `id, name, description, banner_url, start_at, end_at, status,
         is_featured, show_on_homepage, display_priority,
         special_deal_products(product_id, discount_type, discount_value, deal_price)`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("products")
      .select(
        `id, name, sku, price, stock_quantity,
         product_images(storage_path, sort_order)`,
      )
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (error || !deal) {
    notFound();
  }

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

  const dealProducts = (deal.special_deal_products ?? []) as {
    product_id: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    deal_price: number;
  }[];

  const initialDeal: InitialDealData = {
    id: deal.id,
    name: deal.name,
    description: deal.description ?? "",
    bannerUrl: deal.banner_url,
    startAt: deal.start_at,
    endAt: deal.end_at,
    status: deal.status as DealCampaignStatus,
    isFeatured: Boolean(deal.is_featured),
    showOnHomepage: Boolean(deal.show_on_homepage),
    displayPriority: Number(deal.display_priority ?? 0),
    products: dealProducts.map((dp) => ({
      productId: dp.product_id,
      discountType: dp.discount_type,
      discountValue: Number(dp.discount_value),
      dealPrice: Number(dp.deal_price),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          Edit Special Deal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update campaign schedule, products, and promotional pricing.
        </p>
      </div>

      <DealForm allProducts={allProducts} initialDeal={initialDeal} />
    </div>
  );
}
