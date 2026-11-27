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
    throw new Error("Authentication required.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return { supabase, userId: user.id };
}

export type DealProductInput = {
  productId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  dealPrice: number;
};

export type SaveDealInput = {
  id?: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  startAt: string;
  endAt: string;
  status: "draft" | "scheduled" | "active" | "paused";
  isFeatured: boolean;
  showOnHomepage: boolean;
  displayPriority: number;
  products: DealProductInput[];
};

export async function saveSpecialDealAction(
  input: SaveDealInput,
): Promise<{ ok: boolean; dealId?: string; error?: string }> {
  try {
    const { supabase, userId } = await verifyAdmin();

    const name = input.name.trim();
    if (!name) return { ok: false, error: "Deal name is required." };

    const startMs = new Date(input.startAt).getTime();
    const endMs = new Date(input.endAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return { ok: false, error: "Valid start and end dates are required." };
    }
    if (endMs <= startMs) {
      return {
        ok: false,
        error: "End date & time must be after the start date & time.",
      };
    }

    if (input.products.length === 0) {
      return {
        ok: false,
        error: "Please select at least one product for this deal.",
      };
    }

    // Deduplicate product IDs & validate prices against actual DB product prices
    const uniqueMap = new Map<string, DealProductInput>();
    for (const item of input.products) {
      uniqueMap.set(item.productId, item);
    }
    const productIds = Array.from(uniqueMap.keys());

    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price")
      .in("id", productIds);

    if (prodErr || !dbProducts) {
      return { ok: false, error: "Could not verify selected products." };
    }

    const dbPriceMap = new Map(
      dbProducts.map((p) => [p.id, { name: p.name, price: Number(p.price) }]),
    );

    const validatedItems: {
      product_id: string;
      discount_type: "percentage" | "fixed";
      discount_value: number;
      deal_price: number;
    }[] = [];

    for (const [pid, item] of uniqueMap.entries()) {
      const dbProd = dbPriceMap.get(pid);
      if (!dbProd) {
        return { ok: false, error: "One of the selected products was not found." };
      }
      const dealPrice = Number(item.dealPrice);
      if (
        !Number.isFinite(dealPrice) ||
        dealPrice <= 0 ||
        dealPrice >= dbProd.price
      ) {
        return {
          ok: false,
          error: `Deal price for "${dbProd.name}" must be greater than 0 and lower than its regular price (Rs. ${dbProd.price}).`,
        };
      }
      validatedItems.push({
        product_id: pid,
        discount_type: item.discountType,
        discount_value: Number(item.discountValue),
        deal_price: Number(dealPrice.toFixed(2)),
      });
    }

    let dealId = input.id;

    if (dealId) {
      const { error: updateErr } = await supabase
        .from("special_deals")
        .update({
          name,
          description: input.description.trim() || null,
          banner_url: input.bannerUrl || null,
          start_at: new Date(startMs).toISOString(),
          end_at: new Date(endMs).toISOString(),
          status: input.status,
          is_featured: input.isFeatured,
          show_on_homepage: input.showOnHomepage,
          display_priority: Number(input.displayPriority) || 0,
        })
        .eq("id", dealId);

      if (updateErr) return { ok: false, error: updateErr.message };

      await supabase
        .from("special_deal_products")
        .delete()
        .eq("deal_id", dealId);
    } else {
      const { data: created, error: insertErr } = await supabase
        .from("special_deals")
        .insert({
          name,
          description: input.description.trim() || null,
          banner_url: input.bannerUrl || null,
          start_at: new Date(startMs).toISOString(),
          end_at: new Date(endMs).toISOString(),
          status: input.status,
          is_featured: input.isFeatured,
          show_on_homepage: input.showOnHomepage,
          display_priority: Number(input.displayPriority) || 0,
          created_by: userId,
        })
        .select("id")
        .single();

      if (insertErr || !created) {
        return {
          ok: false,
          error: insertErr?.message ?? "Could not create special deal.",
        };
      }
      dealId = created.id;
    }

    const { error: itemsErr } = await supabase
      .from("special_deal_products")
      .insert(validatedItems.map((it) => ({ ...it, deal_id: dealId })));

    if (itemsErr) {
      return { ok: false, error: itemsErr.message };
    }

    revalidatePath("/admin/special-deals");
    revalidatePath("/products");
    revalidatePath("/");

    return { ok: true, dealId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save deal.",
    };
  }
}

export async function togglePauseDealAction(
  dealId: string,
  action: "pause" | "resume",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await verifyAdmin();
    const nextStatus = action === "pause" ? "paused" : "active";

    const { error } = await supabase
      .from("special_deals")
      .update({ status: nextStatus })
      .eq("id", dealId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/special-deals");
    revalidatePath("/products");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update deal.",
    };
  }
}

export async function duplicateDealAction(
  dealId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await verifyAdmin();

    const { data: source, error: fetchErr } = await supabase
      .from("special_deals")
      .select("*, special_deal_products(*)")
      .eq("id", dealId)
      .single();

    if (fetchErr || !source) {
      return { ok: false, error: "Deal not found." };
    }

    const { data: copy, error: copyErr } = await supabase
      .from("special_deals")
      .insert({
        name: `${source.name} (Copy)`,
        description: source.description,
        banner_url: source.banner_url,
        start_at: source.start_at,
        end_at: source.end_at,
        status: "draft",
        is_featured: false,
        show_on_homepage: false,
        display_priority: source.display_priority,
        created_by: userId,
      })
      .select("id")
      .single();

    if (copyErr || !copy) {
      return { ok: false, error: copyErr?.message ?? "Could not duplicate." };
    }

    const sourceProducts = (source.special_deal_products ?? []) as {
      product_id: string;
      discount_type: string;
      discount_value: number;
      deal_price: number;
    }[];

    if (sourceProducts.length > 0) {
      await supabase.from("special_deal_products").insert(
        sourceProducts.map((p) => ({
          deal_id: copy.id,
          product_id: p.product_id,
          discount_type: p.discount_type,
          discount_value: p.discount_value,
          deal_price: p.deal_price,
        })),
      );
    }

    revalidatePath("/admin/special-deals");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not duplicate deal.",
    };
  }
}

export async function deleteDealAction(
  dealId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase
      .from("special_deals")
      .delete()
      .eq("id", dealId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/special-deals");
    revalidatePath("/products");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not delete deal.",
    };
  }
}
