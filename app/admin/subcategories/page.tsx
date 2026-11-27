import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  CategoryRecord,
  SubcategoryWithParent,
} from "@/lib/categories/types";
import SubcategoriesClient from "./subcategories-client";

export const instant = false;

export default async function AdminSubcategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ main?: string }>;
}) {
  const sp = await searchParams;
  const initialMainFilter = sp.main ?? "";

  const supabase = await createClient();

  const [{ data: categoriesRaw, error }, { data: productsRaw }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase.from("products").select("id, category_id"),
    ]);

  const allCategories = (categoriesRaw ?? []) as CategoryRecord[];
  const mainCategories = allCategories.filter((c) => !c.parent_id);
  const mainById = new Map(mainCategories.map((m) => [m.id, m]));

  const productCountByCatId = new Map<string, number>();
  for (const p of productsRaw ?? []) {
    if (p.category_id) {
      productCountByCatId.set(
        p.category_id,
        (productCountByCatId.get(p.category_id) ?? 0) + 1,
      );
    }
  }

  const subcategories: SubcategoryWithParent[] = allCategories
    .filter((c) => Boolean(c.parent_id))
    .map((sub) => {
      const parent = sub.parent_id ? mainById.get(sub.parent_id) : undefined;
      return {
        ...sub,
        parent_name: parent?.name ?? null,
        parent_slug: parent?.slug ?? null,
        parent_is_active: parent?.is_active ?? null,
        product_count: productCountByCatId.get(sub.id) ?? 0,
      };
    });

  return (
    <Suspense fallback={null}>
      <SubcategoriesClient
        mainCategories={mainCategories}
        subcategories={subcategories}
        initialMainFilter={initialMainFilter}
        dbError={error ? error.message : null}
      />
    </Suspense>
  );
}
