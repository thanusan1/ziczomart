import type { SupabaseClient } from "@supabase/supabase-js";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type SubcategoryMatcher = {
  slug: string;
  name: string;
  keywords?: string[];
};

export type ResolvedCategoryTree = {
  mainCategory: CategoryRow | null;
  childCategories: CategoryRow[];
  targetCategoryIds: string[];
  categoryById: Map<string, CategoryRow>;
  hasParentIdColumn: boolean;
};

/**
 * Resolves a main category and its active child categories from Supabase.
 * Uses `parent_id` when the column exists in `public.categories`, and
 * safely falls back to optional slug/name matching if `parent_id` is not
 * yet present on the table. Never invents categories not in Supabase.
 */
export async function resolveCategoryTree(
  supabase: SupabaseClient,
  options: {
    matchMain: (cat: CategoryRow) => boolean;
    fallbackChildMatchers?: SubcategoryMatcher[];
  },
): Promise<ResolvedCategoryTree> {
  const { data: activeCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const allCategories = (activeCategories ?? []) as CategoryRow[];
  const hasParentIdColumn = allCategories.some((c) => "parent_id" in c);

  const mainCategory = allCategories.find(options.matchMain) ?? null;

  let childCategories: CategoryRow[] = [];

  if (mainCategory) {
    if (hasParentIdColumn) {
      childCategories = allCategories.filter(
        (c) => c.parent_id === mainCategory.id,
      );
    } else if (options.fallbackChildMatchers?.length) {
      childCategories = allCategories.filter((c) => {
        if (c.id === mainCategory.id) return false;
        const n = c.name.trim().toLowerCase();
        const s = c.slug.trim().toLowerCase();
        return options.fallbackChildMatchers!.some(
          (m) =>
            s === m.slug ||
            n === m.name.toLowerCase() ||
            (m.keywords ?? []).some((kw) => n.includes(kw)),
        );
      });
    }
  }

  const targetCategoryIds = [
    ...(mainCategory ? [mainCategory.id] : []),
    ...childCategories.map((c) => c.id),
  ];

  const categoryById = new Map(allCategories.map((c) => [c.id, c]));

  return {
    mainCategory,
    childCategories,
    targetCategoryIds,
    categoryById,
    hasParentIdColumn,
  };
}
