import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { CategoryRow } from "@/lib/categories/resolve-category-tree";
import CategoryListingView, {
  type CategoryListingSearchParams,
} from "@/components/categories/category-listing-view";

export const instant = false;

type Props = {
  params: Promise<{ slug: string; subSlug: string }>;
  searchParams: Promise<CategoryListingSearchParams>;
};

function buildMainMatcher(lowerSlug: string): (c: CategoryRow) => boolean {
  if (lowerSlug === "electronics" || lowerSlug.startsWith("electronics")) {
    return (c) =>
      c.name.trim().toLowerCase() === "electronics" ||
      c.slug.toLowerCase().startsWith("electronics");
  }
  if (
    lowerSlug === "home-kitchen" ||
    lowerSlug === "home-and-kitchen" ||
    lowerSlug.startsWith("home-kitchen") ||
    lowerSlug.startsWith("home-and-kitchen")
  ) {
    return (c) => {
      const n = c.name.trim().toLowerCase();
      const s = c.slug.trim().toLowerCase();
      return (
        n === "home & kitchen" ||
        n === "home and kitchen" ||
        s === "home-kitchen" ||
        s === "home-and-kitchen" ||
        s.startsWith("home-kitchen") ||
        s.startsWith("home-and-kitchen")
      );
    };
  }
  return (c) => c.slug.toLowerCase() === lowerSlug;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subSlug } = await params;
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", subSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!sub) {
    return { title: "Subcategory" };
  }

  return {
    title: sub.name,
    description:
      sub.description ||
      `Shop ${sub.name} products at ZicZo Mart. Quality items, great prices, and fast island-wide delivery.`,
  };
}

export default async function DynamicSubcategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug, subSlug } = await params;
  const lowerSlug = slug.toLowerCase();
  const sp = await searchParams;

  return (
    <CategoryListingView
      matchMain={buildMainMatcher(lowerSlug)}
      subSlugFromPath={subSlug}
      searchParams={sp}
    />
  );
}
