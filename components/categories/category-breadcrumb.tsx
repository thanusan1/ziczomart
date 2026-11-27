import Breadcrumb from "@/components/ui/breadcrumb";
import { getMainCategoryHref } from "@/lib/categories/slug";

type Props = {
  mainCategory: {
    name: string;
    slug: string;
  };
  activeSubcategory?: {
    name: string;
    slug: string;
  } | null;
};

export default function CategoryBreadcrumb({
  mainCategory,
  activeSubcategory,
}: Props) {
  const items: { label: string; href?: string }[] = activeSubcategory
    ? [
        {
          label: mainCategory.name,
          href: getMainCategoryHref(mainCategory),
        },
        { label: activeSubcategory.name },
      ]
    : [{ label: mainCategory.name }];

  return <Breadcrumb items={items} />;
}
