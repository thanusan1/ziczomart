"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugifyCategoryName } from "@/lib/categories/slug";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | {
      ok: false;
      error: string;
      blocked?: boolean;
      productCount?: number;
      subcategoryCount?: number;
    };

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

function revalidateAllCategoryViews() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/subcategories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/categories/electronics");
  revalidatePath("/categories/home-kitchen");
  revalidatePath("/products");
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

  revalidateAllCategoryViews();
}

export async function toggleCategoryActiveAction(
  id: string,
  nextActive: boolean,
): Promise<ActionResult> {
  try {
    if (!id) return { ok: false, error: "Category ID is missing." };
    const supabase = await verifyAdmin();

    const { error } = await supabase
      .from("categories")
      .update({ is_active: nextActive })
      .eq("id", id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateAllCategoryViews();
    return {
      ok: true,
      message: nextActive ? "Category activated." : "Category deactivated.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    };
  }
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Category ID is missing.");

  const result = await deleteMainCategorySafe({ id });
  if (!result.ok) {
    throw new Error(result.error);
  }
}

export async function deleteMainCategorySafe(params: {
  id: string;
  reassignToId?: string;
}): Promise<ActionResult> {
  try {
    const { id, reassignToId } = params;
    if (!id) return { ok: false, error: "Category ID is missing." };

    const supabase = await verifyAdmin();

    const [{ count: subCount, error: subErr }, { count: prodCount, error: prodErr }] =
      await Promise.all([
        supabase
          .from("categories")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id),
      ]);

    if (subErr || prodErr) {
      return {
        ok: false,
        error: "Unable to check category dependencies before deletion.",
      };
    }

    const subcategoryCount = subCount ?? 0;
    const productCount = prodCount ?? 0;

    if ((subcategoryCount > 0 || productCount > 0) && !reassignToId) {
      return {
        ok: false,
        blocked: true,
        subcategoryCount,
        productCount,
        error: `Cannot delete this main category while it has ${subcategoryCount} subcategor${subcategoryCount === 1 ? "y" : "ies"} and ${productCount} direct product${productCount === 1 ? "" : "s"}. Reassign them first.`,
      };
    }

    if (reassignToId) {
      if (reassignToId === id) {
        return {
          ok: false,
          error: "Please choose a different main category for reassignment.",
        };
      }

      const { data: targetCat, error: targetErr } = await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("id", reassignToId)
        .single();

      if (targetErr || !targetCat || targetCat.parent_id !== null) {
        return {
          ok: false,
          error: "Selected target must be a valid main category.",
        };
      }

      if (subcategoryCount > 0) {
        const { error: moveSubErr } = await supabase
          .from("categories")
          .update({ parent_id: reassignToId })
          .eq("parent_id", id);

        if (moveSubErr) {
          return { ok: false, error: moveSubErr.message };
        }
      }

      if (productCount > 0) {
        const { error: moveProdErr } = await supabase
          .from("products")
          .update({ category_id: reassignToId })
          .eq("category_id", id);

        if (moveProdErr) {
          return { ok: false, error: moveProdErr.message };
        }
      }
    }

    const { error: delErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (delErr) {
      return { ok: false, error: delErr.message };
    }

    revalidateAllCategoryViews();
    return { ok: true, message: "Main category deleted successfully." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete category.",
    };
  }
}

export async function createSubcategoryAction(input: {
  parentId: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await verifyAdmin();

    const parentId = input.parentId.trim();
    const name = input.name.trim();
    const rawSlug = input.slug.trim() || name;
    const slug = slugifyCategoryName(rawSlug);
    const sortOrder = Number(input.sortOrder);

    if (!parentId) {
      return { ok: false, error: "Please select a Main Category." };
    }
    if (!name) {
      return { ok: false, error: "Subcategory name is required." };
    }
    if (!slug) {
      return { ok: false, error: "A valid slug is required." };
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return {
        ok: false,
        error: "Display order must be a non-negative whole number.",
      };
    }

    // Validate parent is a top-level main category
    const { data: parentCat, error: parentErr } = await supabase
      .from("categories")
      .select("id, parent_id")
      .eq("id", parentId)
      .single();

    if (parentErr || !parentCat) {
      return { ok: false, error: "Selected Main Category does not exist." };
    }
    if (parentCat.parent_id !== null) {
      return {
        ok: false,
        error: "Subcategories can only be assigned to a Main Category.",
      };
    }

    // Check duplicate name under same parent
    const { data: sameName } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", parentId)
      .ilike("name", name)
      .limit(1);

    if (sameName && sameName.length > 0) {
      return {
        ok: false,
        error: `A subcategory named "${name}" already exists under this Main Category.`,
      };
    }

    // Check global slug uniqueness
    const { data: sameSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (sameSlug && sameSlug.length > 0) {
      return {
        ok: false,
        error: `The slug "${slug}" is already in use. Please choose a unique slug.`,
      };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("categories")
      .insert({
        parent_id: parentId,
        name,
        slug,
        description: input.description?.trim() || null,
        image_url: input.imageUrl || null,
        sort_order: sortOrder,
        is_active: Boolean(input.isActive),
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return {
        ok: false,
        error: insertErr?.message || "Unable to create subcategory.",
      };
    }

    revalidateAllCategoryViews();
    return {
      ok: true,
      data: { id: inserted.id },
      message: `Subcategory "${name}" created.`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to create subcategory.",
    };
  }
}

export async function updateSubcategoryAction(input: {
  id: string;
  parentId: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<ActionResult> {
  try {
    const supabase = await verifyAdmin();

    const id = input.id.trim();
    const parentId = input.parentId.trim();
    const name = input.name.trim();
    const slug = slugifyCategoryName(input.slug.trim() || name);
    const sortOrder = Number(input.sortOrder);

    if (!id) return { ok: false, error: "Subcategory ID is missing." };
    if (!parentId) return { ok: false, error: "Please select a Main Category." };
    if (parentId === id) {
      return { ok: false, error: "A category cannot be its own parent." };
    }
    if (!name) return { ok: false, error: "Subcategory name is required." };
    if (!slug) return { ok: false, error: "A valid slug is required." };
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return {
        ok: false,
        error: "Display order must be a non-negative whole number.",
      };
    }

    const { data: parentCat, error: parentErr } = await supabase
      .from("categories")
      .select("id, parent_id")
      .eq("id", parentId)
      .single();

    if (parentErr || !parentCat) {
      return { ok: false, error: "Selected Main Category does not exist." };
    }
    if (parentCat.parent_id !== null) {
      return {
        ok: false,
        error: "Subcategories cannot be nested under another subcategory.",
      };
    }

    const { data: sameName } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", parentId)
      .ilike("name", name)
      .neq("id", id)
      .limit(1);

    if (sameName && sameName.length > 0) {
      return {
        ok: false,
        error: `Another subcategory named "${name}" already exists under this Main Category.`,
      };
    }

    const { data: sameSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .limit(1);

    if (sameSlug && sameSlug.length > 0) {
      return {
        ok: false,
        error: `The slug "${slug}" is already in use by another category.`,
      };
    }

    const { error: updateErr } = await supabase
      .from("categories")
      .update({
        parent_id: parentId,
        name,
        slug,
        description: input.description?.trim() || null,
        image_url: input.imageUrl ?? null,
        sort_order: sortOrder,
        is_active: Boolean(input.isActive),
      })
      .eq("id", id);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    revalidateAllCategoryViews();
    return { ok: true, message: `Subcategory "${name}" updated.` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to update subcategory.",
    };
  }
}

export async function deleteSubcategorySafe(params: {
  id: string;
  reassignToId?: string;
}): Promise<ActionResult> {
  try {
    const { id, reassignToId } = params;
    if (!id) return { ok: false, error: "Subcategory ID is missing." };

    const supabase = await verifyAdmin();

    const { count: prodCount, error: prodErr } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (prodErr) {
      return {
        ok: false,
        error: "Unable to check products assigned to this subcategory.",
      };
    }

    const productCount = prodCount ?? 0;

    if (productCount > 0 && !reassignToId) {
      return {
        ok: false,
        blocked: true,
        productCount,
        error: `This subcategory has ${productCount} assigned product${productCount === 1 ? "" : "s"}. Reassign them to another subcategory before deleting.`,
      };
    }

    if (productCount > 0 && reassignToId) {
      if (reassignToId === id) {
        return {
          ok: false,
          error: "Please select a different subcategory for reassignment.",
        };
      }

      const { data: targetSub, error: targetErr } = await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("id", reassignToId)
        .single();

      if (targetErr || !targetSub || targetSub.parent_id === null) {
        return {
          ok: false,
          error: "Selected target must be a valid subcategory.",
        };
      }

      const { error: moveErr } = await supabase
        .from("products")
        .update({ category_id: reassignToId })
        .eq("category_id", id);

      if (moveErr) {
        return { ok: false, error: moveErr.message };
      }
    }

    const { error: delErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (delErr) {
      return { ok: false, error: delErr.message };
    }

    revalidateAllCategoryViews();
    return {
      ok: true,
      message:
        productCount > 0
          ? `Reassigned ${productCount} product${productCount === 1 ? "" : "s"} and deleted subcategory.`
          : "Subcategory deleted successfully.",
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to delete subcategory.",
    };
  }
}
