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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function toggleProductStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const currentStatus = String(formData.get("is_active")) === "true";

  if (!id) {
    throw new Error("Product ID is missing.");
  }

  const supabase = await verifyAdmin();

  const { error } = await supabase
    .from("products")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Product ID is missing.");
  }

  const supabase = await verifyAdmin();

  // Keep products that are already part of an order.
  const { count, error: orderError } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if (orderError) {
    throw new Error("Could not check whether this product has orders.");
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "This product is linked to an order and cannot be deleted. Pause it instead.",
    );
  }

  // Get image paths before deleting the product.
  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);

  if (imagesError) {
    throw new Error("Could not load the product images.");
  }

  // Delete the product first. If another table references it,
  // Supabase will return an error and the image files will remain.
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw new Error(
      "Could not delete this product. It may be referenced by other store records. " +
        deleteError.message,
    );
  }

  // Remove image files after the product has been deleted.
  const paths = (images ?? [])
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove(paths);

    if (storageError) {
      console.error("Product image cleanup failed:", storageError.message);
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
}
