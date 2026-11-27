import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoryListingView, {
  type CategoryListingSearchParams,
} from "@/components/categories/category-listing-view";

export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategoryListingSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!cat) {
    return { title: "Category" };
  }

  return {
    title: cat.name,
    description:
      cat.description ||
      `Shop ${cat.name} products at ZicZo Mart. Quality items, great prices, and fast island-wide delivery.`,
  };
}

export default async function DynamicCategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const lowerSlug = slug.toLowerCase();

  if (lowerSlug.startsWith("electronics")) {
    redirect("/categories/electronics");
  }
  if (
    lowerSlug.startsWith("home-kitchen") ||
    lowerSlug.startsWith("home-and-kitchen")
  ) {
    redirect("/categories/home-kitchen");
  }

  const sp = await searchParams;

  return (
    <CategoryListingView
      matchMain={(c) => c.slug.toLowerCase() === lowerSlug}
      searchParams={sp}
    />
  );
}
