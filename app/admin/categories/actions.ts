"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function toggleCategoryStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const currentStatus = String(formData.get("is_active")) === "true";

  if (!id) throw new Error("Category ID is missing.");

  const supabase = await verifyAdmin();

  const { error } = await supabase
    .from("categories")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) throw new Error("Category ID is missing.");

  const supabase = await verifyAdmin();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(
      "Could not delete this category. It may be linked to existing products. " +
        error.message,
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products/new");
}
