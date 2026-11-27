import { createClient } from "@/lib/supabase/server";
import type {
  CategoryRecord,
  MainCategorySummary,
} from "@/lib/categories/types";
import MainCategoriesClient from "./main-categories-client";

export const instant = false;

export default async function AdminCategoriesPage() {
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
  const subcategories = allCategories.filter((c) => Boolean(c.parent_id));

  const productCountByCatId = new Map<string, number>();
  for (const p of productsRaw ?? []) {
    if (p.category_id) {
      productCountByCatId.set(
        p.category_id,
        (productCountByCatId.get(p.category_id) ?? 0) + 1,
      );
    }
  }

  const summaries: MainCategorySummary[] = mainCategories.map((main) => {
    const children = subcategories.filter((s) => s.parent_id === main.id);
    const activeChildren = children.filter((s) => s.is_active);
    const directProducts = productCountByCatId.get(main.id) ?? 0;
    const childProducts = children.reduce(
      (sum, s) => sum + (productCountByCatId.get(s.id) ?? 0),
      0,
    );

    return {
      ...main,
      parent_id: main.parent_id ?? null,
      subcategory_count: children.length,
      active_subcategory_count: activeChildren.length,
      product_count: directProducts + childProducts,
    };
  });

  return (
    <MainCategoriesClient
      initialCategories={summaries}
      dbError={error ? error.message : null}
    />
  );
}
