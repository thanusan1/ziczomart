import Link from "next/link";
import type { FilterCategory } from "@/components/ui/product-filters";

type Props = {
  mainCategoryName: string;
  baseCategoryPath: string;
  subcategories: FilterCategory[];
  activeSubSlug?: string;
  totalCount: number;
};

export default function SubcategoryList({
  mainCategoryName,
  baseCategoryPath,
  subcategories,
  activeSubSlug = "",
  totalCount,
}: Props) {
  if (subcategories.length === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
      <Link
        href={baseCategoryPath}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
          !activeSubSlug
            ? "border-[#2563EB] bg-[#2563EB] text-white shadow-xs"
            : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB]"
        }`}
      >
        All {mainCategoryName} ({totalCount})
      </Link>

      {subcategories.map((sub) => {
        const active = activeSubSlug === sub.slug;
        return (
          <Link
            key={sub.id}
            href={`${baseCategoryPath}/${sub.slug}`}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-[#2563EB] bg-[#2563EB] text-white shadow-xs"
                : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB]"
            }`}
          >
            {sub.name}{" "}
            <span className={active ? "text-blue-100" : "text-slate-400"}>
              ({sub.count})
            </span>
          </Link>
        );
      })}
    </div>
  );
}
