import type { Metadata } from "next";
import CategoryListingView, {
  type CategoryListingSearchParams,
} from "@/components/categories/category-listing-view";

export const metadata: Metadata = {
  title: "Electronics",
  description:
    "Discover the latest electronics, gadgets and accessories at amazing prices on ZicZo Mart.",
};

export const instant = false;

type Props = { searchParams: Promise<CategoryListingSearchParams> };

export default async function ElectronicsCategoryPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <CategoryListingView
      matchMain={(c) =>
        c.name.trim().toLowerCase() === "electronics" ||
        c.slug.toLowerCase().startsWith("electronics")
      }
      searchParams={sp}
      heroVariant="electronics"
    />
  );
}
