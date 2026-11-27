import type { Metadata } from "next";
import CategoryListingView, {
  type CategoryListingSearchParams,
} from "@/components/categories/category-listing-view";

export const metadata: Metadata = {
  title: "Home & Kitchen",
  description:
    "Shop Home & Kitchen products at ZicZo Mart. Discover kitchen appliances, cookware, home decor, storage solutions and everyday essentials.",
};

export const instant = false;

type Props = { searchParams: Promise<CategoryListingSearchParams> };

export default async function HomeKitchenCategoryPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <CategoryListingView
      matchMain={(c) => {
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
      }}
      searchParams={sp}
      heroVariant="home-kitchen"
    />
  );
}
