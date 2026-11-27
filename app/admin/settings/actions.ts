"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export type SaveStoreSettingsResult = {
  ok: boolean;
  error?: string;
};

export async function saveStoreSettings(
  formData: FormData,
): Promise<SaveStoreSettingsResult> {
  try {
    const supabase = await verifyAdmin();

    const announcement_1 = String(formData.get("announcement_1") || "").trim();
    const announcement_2 = String(formData.get("announcement_2") || "").trim();
    const announcement_3 = String(formData.get("announcement_3") || "").trim();
    const announcement_mobile = String(
      formData.get("announcement_mobile") || "",
    ).trim();
    const announcement_link =
      String(formData.get("announcement_link") || "").trim() ||
      "/products?deals=true";

    const promo_title = String(formData.get("promo_title") || "").trim();
    const promo_subtitle = String(formData.get("promo_subtitle") || "").trim();
    const promo_cta_label =
      String(formData.get("promo_cta_label") || "").trim() || "Explore Now";
    const promo_cta_href =
      String(formData.get("promo_cta_href") || "").trim() || "/products";
    const existingImageUrl = String(
      formData.get("existing_promo_image_url") || "",
    ).trim();
    const removePromoImage = formData.get("remove_promo_image") === "true";

    const show_categories = formData.get("show_categories") === "true";
    const title_categories =
      String(formData.get("title_categories") || "").trim() ||
      "Shop by Category";
    const show_deals = formData.get("show_deals") === "true";
    const title_deals =
      String(formData.get("title_deals") || "").trim() || "Today's Best Deals";
    const show_featured = formData.get("show_featured") === "true";
    const title_featured =
      String(formData.get("title_featured") || "").trim() || "Featured Products";
    const show_new_arrivals = formData.get("show_new_arrivals") === "true";
    const title_new_arrivals =
      String(formData.get("title_new_arrivals") || "").trim() || "New Arrivals";
    const show_best_sellers = formData.get("show_best_sellers") === "true";
    const title_best_sellers =
      String(formData.get("title_best_sellers") || "").trim() || "Best Sellers";

    if (!announcement_1 || !announcement_2 || !announcement_3) {
      return {
        ok: false,
        error: "All three announcement bar messages are required.",
      };
    }

    if (!promo_title || !promo_subtitle) {
      return {
        ok: false,
        error: "Promo card title and subtitle are required.",
      };
    }

    let promo_image_url: string | null = removePromoImage
      ? null
      : existingImageUrl || null;

    const imageFile = formData.get("promo_image");
    if (imageFile instanceof File && imageFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(imageFile.type)) {
        return {
          ok: false,
          error: "Promo image must be a JPG, PNG, or WebP file.",
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          ok: false,
          error: "Promo image must be smaller than 5 MB.",
        };
      }

      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `promotions/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        return { ok: false, error: uploadError.message };
      }

      const { data: publicData } = supabase.storage
        .from("product-images")
        .getPublicUrl(storagePath);

      promo_image_url = publicData.publicUrl;
    }

    const { error } = await supabase.from("store_settings").upsert(
      {
        id: "default",
        announcement_1,
        announcement_2,
        announcement_3,
        announcement_mobile: announcement_mobile || announcement_1,
        announcement_link,
        promo_title,
        promo_subtitle,
        promo_cta_label,
        promo_cta_href,
        promo_image_url,
        show_categories,
        title_categories,
        show_deals,
        title_deals,
        show_featured,
        title_featured,
        show_new_arrivals,
        title_new_arrivals,
        show_best_sellers,
        title_best_sellers,
      },
      { onConflict: "id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");
    revalidatePath("/admin/settings");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to save store settings.",
    };
  }
}

export async function updateProductMerchandising(input: {
  id: string;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_best_deal: boolean;
}): Promise<SaveStoreSettingsResult> {
  try {
    const supabase = await verifyAdmin();

    if (!input.id || Number.isNaN(input.price) || input.price < 0) {
      return { ok: false, error: "Invalid product price." };
    }

    if (
      input.compare_at_price != null &&
      (Number.isNaN(input.compare_at_price) || input.compare_at_price < 0)
    ) {
      return { ok: false, error: "Invalid compare-at price." };
    }

    const { error } = await supabase
      .from("products")
      .update({
        price: input.price,
        compare_at_price: input.compare_at_price,
        is_featured: input.is_featured,
        is_best_seller: input.is_best_seller,
        is_new_arrival: input.is_new_arrival,
        is_best_deal: input.is_best_deal,
      })
      .eq("id", input.id);

    if (error) {
      if (
        error.message.includes("is_best_seller") ||
        error.message.includes("is_new_arrival") ||
        error.message.includes("is_best_deal")
      ) {
        const { error: fallbackError } = await supabase
          .from("products")
          .update({
            price: input.price,
            compare_at_price: input.compare_at_price,
            is_featured: input.is_featured,
          })
          .eq("id", input.id);
        if (fallbackError) {
          return { ok: false, error: fallbackError.message };
        }
        return {
          ok: false,
          error:
            "Saved price & featured status. Run updated 002_store_settings.sql to enable Best Deal, Best Seller & New Arrival flags.",
        };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/products");

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update product merchandising.",
    };
  }
}
