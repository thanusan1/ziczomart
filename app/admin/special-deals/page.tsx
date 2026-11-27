import { createClient } from "@/lib/supabase/server";
import {
  computeEffectiveDealStatus,
  type DealCampaignStatus,
} from "@/lib/deals";
import AdminDealsClient, { type AdminDealRow } from "./admin-deals-client";

export const metadata = {
  title: "Special Deals Management",
};

export const instant = false;

export default async function AdminSpecialDealsPage() {
  const supabase = await createClient();

  const { data: dealsRaw, error } = await supabase
    .from("special_deals")
    .select(
      `id, name, description, banner_url, start_at, end_at, status,
       is_featured, show_on_homepage, display_priority, created_at,
       special_deal_products(id, discount_type, discount_value, deal_price)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-bold">Special Deals tables are not yet initialized.</p>
        <p className="mt-1">
          Run{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            supabase/migrations/006_special_deals.sql
          </code>{" "}
          in your Supabase SQL Editor, then refresh this page.
        </p>
      </div>
    );
  }

  const rows: AdminDealRow[] = (dealsRaw ?? []).map((d) => {
    const items = (d.special_deal_products ?? []) as {
      id: string;
      discount_type: string;
      discount_value: number;
      deal_price: number;
    }[];

    let discountSummary = "—";
    if (items.length > 0) {
      const pctItems = items.filter((i) => i.discount_type === "percentage");
      if (pctItems.length === items.length) {
        const vals = pctItems.map((i) => Number(i.discount_value));
        const minV = Math.min(...vals);
        const maxV = Math.max(...vals);
        discountSummary =
          minV === maxV ? `${minV}% OFF` : `${minV}% – ${maxV}% OFF`;
      } else {
        discountSummary = `${items.length} custom price${items.length > 1 ? "s" : ""}`;
      }
    }

    const rawStatus = d.status as DealCampaignStatus;
    const effectiveStatus = computeEffectiveDealStatus({
      status: rawStatus,
      start_at: d.start_at,
      end_at: d.end_at,
    });

    return {
      id: d.id,
      name: d.name,
      description: d.description,
      bannerUrl: d.banner_url,
      productCount: items.length,
      discountSummary,
      startAt: d.start_at,
      endAt: d.end_at,
      rawStatus,
      effectiveStatus,
      isFeatured: Boolean(d.is_featured),
      showOnHomepage: Boolean(d.show_on_homepage),
      displayPriority: Number(d.display_priority ?? 0),
    };
  });

  return <AdminDealsClient deals={rows} />;
}
