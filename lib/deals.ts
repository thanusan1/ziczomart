import type { SupabaseClient } from "@supabase/supabase-js";

export type DealCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "paused"
  | "expired";

export type SpecialDealRow = {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  start_at: string;
  end_at: string;
  status: DealCampaignStatus;
  is_featured: boolean;
  show_on_homepage: boolean;
  display_priority: number;
  created_at: string;
};

export type ActiveProductDeal = {
  dealId: string;
  dealName: string;
  dealPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startAt: string;
  endAt: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  displayPriority: number;
};

/**
 * Computes the effective campaign status based on manual status + server timestamp.
 * Paused and Draft campaigns remain Paused/Draft regardless of dates.
 */
export function computeEffectiveDealStatus(
  deal: Pick<SpecialDealRow, "status" | "start_at" | "end_at">,
  nowMs: number = Date.now(),
): DealCampaignStatus {
  if (deal.status === "draft") return "draft";
  if (deal.status === "paused") return "paused";

  const startMs = new Date(deal.start_at).getTime();
  const endMs = new Date(deal.end_at).getTime();

  if (nowMs < startMs) return "scheduled";
  if (nowMs > endMs) return "expired";
  return "active";
}

/**
 * Fetches all currently active special deal campaigns and resolves
 * the highest-priority active deal per product ID.
 * Gracefully returns empty results if the `special_deals` table is not yet created.
 */
export async function getActiveDealsWithProducts(
  supabase: SupabaseClient,
): Promise<{
  activeDeals: SpecialDealRow[];
  productDealMap: Map<string, ActiveProductDeal>;
}> {
  const nowIso = new Date().toISOString();

  const { data: dealsRaw, error } = await supabase
    .from("special_deals")
    .select(
      `id, name, description, banner_url, start_at, end_at, status,
       is_featured, show_on_homepage, display_priority, created_at,
       special_deal_products(product_id, discount_type, discount_value, deal_price)`,
    )
    .in("status", ["scheduled", "active"])
    .lte("start_at", nowIso)
    .gte("end_at", nowIso)
    .order("display_priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !dealsRaw) {
    return { activeDeals: [], productDealMap: new Map() };
  }

  const activeDeals: SpecialDealRow[] = [];
  const productDealMap = new Map<string, ActiveProductDeal>();

  for (const row of dealsRaw as (SpecialDealRow & {
    special_deal_products:
      | {
          product_id: string;
          discount_type: "percentage" | "fixed";
          discount_value: number | string;
          deal_price: number | string;
        }[]
      | null;
  })[]) {
    const deal: SpecialDealRow = {
      id: row.id,
      name: row.name,
      description: row.description,
      banner_url: row.banner_url,
      start_at: row.start_at,
      end_at: row.end_at,
      status: "active",
      is_featured: Boolean(row.is_featured),
      show_on_homepage: Boolean(row.show_on_homepage),
      display_priority: Number(row.display_priority ?? 0),
      created_at: row.created_at,
    };
    activeDeals.push(deal);

    for (const item of row.special_deal_products ?? []) {
      const candidate: ActiveProductDeal = {
        dealId: deal.id,
        dealName: deal.name,
        dealPrice: Number(item.deal_price),
        discountType: item.discount_type,
        discountValue: Number(item.discount_value),
        startAt: deal.start_at,
        endAt: deal.end_at,
        isFeatured: deal.is_featured,
        showOnHomepage: deal.show_on_homepage,
        displayPriority: deal.display_priority,
      };

      const existing = productDealMap.get(item.product_id);
      if (
        !existing ||
        candidate.displayPriority > existing.displayPriority ||
        (candidate.displayPriority === existing.displayPriority &&
          candidate.dealPrice < existing.dealPrice)
      ) {
        productDealMap.set(item.product_id, candidate);
      }
    }
  }

  return { activeDeals, productDealMap };
}

/**
 * Applies active deal pricing to a product's regular price and compare_at_price.
 * Never overwrites regular product prices in the database.
 */
export function resolveProductDealPricing(
  regularPrice: number,
  compareAtPrice: number | null,
  activeDeal: ActiveProductDeal | undefined,
): {
  effectivePrice: number;
  effectiveCompareAt: number | null;
  hasActiveDeal: boolean;
  dealEndAt: string | null;
} {
  if (
    activeDeal &&
    activeDeal.dealPrice > 0 &&
    activeDeal.dealPrice < regularPrice
  ) {
    const baseCompare =
      compareAtPrice && compareAtPrice > regularPrice
        ? compareAtPrice
        : regularPrice;
    return {
      effectivePrice: activeDeal.dealPrice,
      effectiveCompareAt: baseCompare,
      hasActiveDeal: true,
      dealEndAt: activeDeal.endAt,
    };
  }

  return {
    effectivePrice: regularPrice,
    effectiveCompareAt: compareAtPrice,
    hasActiveDeal: false,
    dealEndAt: null,
  };
}
