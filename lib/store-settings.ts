import type { SupabaseClient } from "@supabase/supabase-js";

export type StoreSettings = {
  id: string;
  announcement_1: string;
  announcement_2: string;
  announcement_3: string;
  announcement_mobile: string;
  announcement_link: string;
  promo_title: string;
  promo_subtitle: string;
  promo_cta_label: string;
  promo_cta_href: string;
  promo_image_url: string | null;
  show_categories: boolean;
  title_categories: string;
  show_deals: boolean;
  title_deals: string;
  show_featured: boolean;
  title_featured: string;
  show_new_arrivals: boolean;
  title_new_arrivals: string;
  show_best_sellers: boolean;
  title_best_sellers: string;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: "default",
  announcement_1: "Free Delivery on Orders Over Rs. 5,000",
  announcement_2: "Up to 50% Off – Special Deals!",
  announcement_3: "Easy Returns Within 30 Days",
  announcement_mobile:
    "Free Delivery on Orders Over Rs. 5,000 · Cash on Delivery",
  announcement_link: "/products?deals=true",
  promo_title: "Upgrade Your Everyday",
  promo_subtitle: "Discover products that make life better.",
  promo_cta_label: "Explore Now",
  promo_cta_href: "/products",
  promo_image_url: null,
  show_categories: true,
  title_categories: "Shop by Category",
  show_deals: true,
  title_deals: "Today's Best Deals",
  show_featured: true,
  title_featured: "Featured Products",
  show_new_arrivals: true,
  title_new_arrivals: "New Arrivals",
  show_best_sellers: true,
  title_best_sellers: "Best Sellers",
};

/**
 * Fetches storefront announcement bar, promo card, and homepage section settings.
 * Falls back gracefully to DEFAULT_STORE_SETTINGS if the table is not yet created.
 */
export async function getStoreSettings(
  supabase: SupabaseClient,
): Promise<{ settings: StoreSettings; tableMissing: boolean }> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return {
      settings: DEFAULT_STORE_SETTINGS,
      tableMissing:
        error.message.includes("store_settings") ||
        error.code === "42P01" ||
        error.code === "PGRST205",
    };
  }

  if (!data) {
    return { settings: DEFAULT_STORE_SETTINGS, tableMissing: false };
  }

  return {
    settings: {
      id: data.id ?? "default",
      announcement_1:
        data.announcement_1 || DEFAULT_STORE_SETTINGS.announcement_1,
      announcement_2:
        data.announcement_2 || DEFAULT_STORE_SETTINGS.announcement_2,
      announcement_3:
        data.announcement_3 || DEFAULT_STORE_SETTINGS.announcement_3,
      announcement_mobile:
        data.announcement_mobile || DEFAULT_STORE_SETTINGS.announcement_mobile,
      announcement_link:
        data.announcement_link || DEFAULT_STORE_SETTINGS.announcement_link,
      promo_title: data.promo_title || DEFAULT_STORE_SETTINGS.promo_title,
      promo_subtitle:
        data.promo_subtitle || DEFAULT_STORE_SETTINGS.promo_subtitle,
      promo_cta_label:
        data.promo_cta_label || DEFAULT_STORE_SETTINGS.promo_cta_label,
      promo_cta_href:
        data.promo_cta_href || DEFAULT_STORE_SETTINGS.promo_cta_href,
      promo_image_url: data.promo_image_url ?? null,
      show_categories: data.show_categories ?? true,
      title_categories:
        data.title_categories || DEFAULT_STORE_SETTINGS.title_categories,
      show_deals: data.show_deals ?? true,
      title_deals: data.title_deals || DEFAULT_STORE_SETTINGS.title_deals,
      show_featured: data.show_featured ?? true,
      title_featured:
        data.title_featured || DEFAULT_STORE_SETTINGS.title_featured,
      show_new_arrivals: data.show_new_arrivals ?? true,
      title_new_arrivals:
        data.title_new_arrivals || DEFAULT_STORE_SETTINGS.title_new_arrivals,
      show_best_sellers: data.show_best_sellers ?? true,
      title_best_sellers:
        data.title_best_sellers || DEFAULT_STORE_SETTINGS.title_best_sellers,
    },
    tableMissing: false,
  };
}
