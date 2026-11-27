import { createClient } from "@/lib/supabase/server";
import { getStoreSettings } from "@/lib/store-settings";
import StoreSettingsForm, { type MerchandisingProduct } from "./settings-form";

export default async function AdminStoreSettingsPage() {
  const supabase = await createClient();

  const [{ settings, tableMissing }, { data: productsRaw }] = await Promise.all([
    getStoreSettings(supabase),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const products: MerchandisingProduct[] = (productsRaw ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    compare_at_price:
      p.compare_at_price != null ? Number(p.compare_at_price) : null,
    is_featured: Boolean(p.is_featured),
    is_best_seller: Boolean(
      (p as { is_best_seller?: boolean }).is_best_seller,
    ),
    is_new_arrival: Boolean(
      (p as { is_new_arrival?: boolean }).is_new_arrival,
    ),
    is_best_deal: Boolean(
      (p as { is_best_deal?: boolean }).is_best_deal,
    ),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">
          Storefront &amp; Promotions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your announcement bar, promo banner, homepage sections,
          discounts, Featured Products, New Arrivals, and Best Sellers.
        </p>
      </div>

      <StoreSettingsForm
        initialSettings={settings}
        tableMissing={tableMissing}
        products={products}
      />
    </div>
  );
}
