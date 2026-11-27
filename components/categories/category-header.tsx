import Image from "next/image";
import { ArrowRight, Tag } from "lucide-react";

type Props = {
  mainCategory: {
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
  };
  activeSubcategory?: {
    name: string;
    slug: string;
    description?: string | null;
    image_url?: string | null;
  } | null;
  totalCategoryCount: number;
  totalFiltered: number;
  hasActiveFilters: boolean;
  hasQueryError: boolean;
  heroVariant?: "default" | "electronics" | "home-kitchen";
};

export default function CategoryHeader({
  mainCategory,
  activeSubcategory,
  totalCategoryCount,
  totalFiltered,
  hasActiveFilters,
  hasQueryError,
  heroVariant = "default",
}: Props) {
  const heading = activeSubcategory
    ? activeSubcategory.name
    : mainCategory.name;
  const description = activeSubcategory
    ? activeSubcategory.description ||
      `Explore ${activeSubcategory.name.toLowerCase()} in ${mainCategory.name} at ZicZo Mart.`
    : mainCategory.description ||
      `Explore quality ${mainCategory.name.toLowerCase()} essentials and everyday deals at ZicZo Mart.`;
  const displayImage =
    activeSubcategory?.image_url || mainCategory.image_url || null;

  if (heroVariant === "electronics" && !activeSubcategory) {
    return (
      <section
        aria-label="Electronics Banner"
        className="relative mt-3 overflow-hidden rounded-[20px] border border-blue-100/90 bg-gradient-to-r from-[#EEF5FF] via-[#DCEAFF] to-[#B7D6FF] shadow-sm"
      >
        <div className="relative flex flex-col justify-between md:h-[168px] md:flex-row md:items-center lg:h-[180px]">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <Image
              src="/images/electronics-hero.jpg"
              alt="ZicZo Mart Electronics Showcase"
              fill
              priority
              unoptimized
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-right"
            />
            <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#EEF5FF]/95 via-[#E5F0FF]/80 to-transparent" />
          </div>

          <div className="relative z-20 flex flex-col justify-center px-6 py-6 sm:px-9 md:w-[50%] md:py-0 lg:w-[46%] lg:px-10">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0A1633] sm:text-3xl lg:text-[34px]">
              {heading}
            </h1>
            <p className="mt-1.5 max-w-md text-xs font-medium text-slate-700 sm:text-sm">
              {description}
            </p>
            {!hasQueryError && (
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#1049C6] px-3.5 py-1 text-xs font-bold text-white shadow-xs">
                  {totalCategoryCount}{" "}
                  {totalCategoryCount === 1 ? "Product" : "Products"}
                </span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center rounded-full border border-blue-200/90 bg-white/95 px-3 py-1 text-xs font-semibold text-[#0A1633] shadow-xs">
                    {totalFiltered} matching
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="relative aspect-[16/6] w-full overflow-hidden md:hidden">
            <Image
              src="/images/electronics-hero.jpg"
              alt="ZicZo Mart Electronics Showcase"
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover object-right"
            />
          </div>
        </div>
      </section>
    );
  }

  if (heroVariant === "home-kitchen" && !activeSubcategory) {
    return (
      <section
        aria-label="Home & Kitchen Collection Banner"
        className="relative mt-3 overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-[#EFF6FF] shadow-sm"
      >
        <div className="relative flex min-h-[230px] flex-col justify-center sm:h-[270px] md:h-[300px] lg:h-[320px]">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/images/home-kitchen-hero.jpg"
              alt="ZicZo Mart Home & Kitchen collection"
              fill
              priority
              unoptimized
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
            />
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#EFF6FF]/95 via-[#EFF6FF]/85 to-transparent sm:w-[70%] md:w-[56%] lg:w-[52%]" />
          </div>

          <div className="relative z-10 max-w-xl px-6 py-7 sm:px-9 md:w-[54%] md:py-0 lg:w-[48%] lg:px-11">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563EB] shadow-2xs">
              ZICZO MART COLLECTION
            </span>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl lg:text-[38px] lg:leading-[1.12]">
              {heading}
            </h1>

            <p className="mt-2 max-w-md text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
              {description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="#category-products"
                className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] sm:text-sm"
              >
                Shop Collection
                <ArrowRight size={15} />
              </a>

              {!hasQueryError && (
                <span className="inline-flex items-center rounded-full border border-blue-200/90 bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#0F172A] shadow-2xs">
                  Explore {totalCategoryCount}{" "}
                  {totalCategoryCount === 1 ? "product" : "products"}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={`${heading} Banner`}
      className="relative mt-3 overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-gradient-to-r from-[#EFF6FF] via-[#E5F0FF] to-[#DBEAFE] shadow-sm"
    >
      <div className="flex flex-col items-center justify-between gap-4 px-6 py-7 sm:px-9 md:flex-row md:py-8 lg:px-11">
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563EB] shadow-2xs">
            {activeSubcategory ? mainCategory.name : "ZICZO MART COLLECTION"}
          </span>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl lg:text-[36px]">
            {heading}
          </h1>

          <p className="mt-2 max-w-lg text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
            {description}
          </p>

          {!hasQueryError && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#2563EB] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
                {activeSubcategory ? totalFiltered : totalCategoryCount}{" "}
                {(activeSubcategory ? totalFiltered : totalCategoryCount) === 1
                  ? "Product"
                  : "Products"}
              </span>
              {hasActiveFilters && !activeSubcategory && (
                <span className="inline-flex items-center rounded-full border border-blue-200/90 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-2xs">
                  {totalFiltered} matching
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-xs sm:h-32 sm:w-32 md:h-36 md:w-36">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={heading}
              fill
              sizes="144px"
              className="object-contain p-2"
            />
          ) : (
            <Tag size={40} className="text-[#2563EB]/50" />
          )}
        </div>
      </div>
    </section>
  );
}
