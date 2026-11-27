"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Star,
  Check,
  FolderTree,
} from "lucide-react";
import { SORT_OPTIONS, type FilterCategory } from "@/components/ui/product-filters";

export interface CategorySidebarFiltersProps {
  categoryTitle: string;
  allCategoryLabel?: string;
  subcategories: FilterCategory[];
  totalCount: number;
  inStockCount: number;
  outOfStockCount: number;
  priceBounds: { min: number; max: number };
  brands?: { name: string; count: number }[];
  onCloseMobile?: () => void;
}

const RATING_OPTIONS = [
  { value: "5", label: "5 stars", stars: 5 },
  { value: "4", label: "4 stars & above", stars: 4 },
  { value: "3", label: "3 stars & above", stars: 3 },
];

const DISCOUNT_OPTIONS = [
  { value: "10", label: "10% Off & above" },
  { value: "20", label: "20% Off & above" },
  { value: "30", label: "30% Off & above" },
  { value: "50", label: "50% Off & above" },
];

const INITIAL_CATEGORY_LIMIT = 8;

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-2.5 flex w-full items-center justify-between text-left text-[11px] font-bold uppercase tracking-wider text-[#0F172A] transition hover:text-[#2563EB]"
      >
        <span>{title}</span>
        {open ? (
          <ChevronUp size={14} className="text-gray-400" />
        ) : (
          <ChevronDown size={14} className="text-gray-400" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function CategorySidebarFilters({
  categoryTitle,
  allCategoryLabel,
  subcategories,
  totalCount,
  inStockCount,
  outOfStockCount,
  priceBounds,
  brands = [],
  onCloseMobile,
}: CategorySidebarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentSub = searchParams.get("sub") ?? "";
  const currentBrand = searchParams.get("brand") ?? "";
  const currentSort = searchParams.get("sort") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentRating = searchParams.get("rating") ?? "";
  const currentStock = searchParams.get("stock") ?? "";
  const currentDiscount = searchParams.get("discount") ?? "";
  const currentFeatured = searchParams.get("featured") ?? "";

  const [searchText, setSearchText] = useState(currentQ);
  const [minInput, setMinInput] = useState(currentMinPrice);
  const [maxInput, setMaxInput] = useState(currentMaxPrice);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [prevQ, setPrevQ] = useState(currentQ);
  if (prevQ !== currentQ) {
    setPrevQ(currentQ);
    setSearchText(currentQ);
  }

  const [prevPriceKey, setPrevPriceKey] = useState(
    `${currentMinPrice}|${currentMaxPrice}`,
  );
  const currentPriceKey = `${currentMinPrice}|${currentMaxPrice}`;
  if (prevPriceKey !== currentPriceKey) {
    setPrevPriceKey(currentPriceKey);
    setMinInput(currentMinPrice);
    setMaxInput(currentMaxPrice);
  }

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");

      Object.entries(overrides).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  function pushFilter(overrides: Record<string, string>) {
    router.push(buildUrl(overrides), { scroll: false });
  }

  function handleSelectCategory(slug: string) {
    pushFilter({ sub: slug });
    onCloseMobile?.();
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pushFilter({ q: searchText.trim() });
    onCloseMobile?.();
  }

  function applyPriceRange(minVal: string, maxVal: string) {
    let minStr = minVal.trim();
    let maxStr = maxVal.trim();
    if (minStr !== "" && maxStr !== "" && Number(minStr) > Number(maxStr)) {
      [minStr, maxStr] = [maxStr, minStr];
      setMinInput(minStr);
      setMaxInput(maxStr);
    }
    pushFilter({
      minPrice: minStr,
      maxPrice: maxStr,
    });
  }

  function clearAllFilters() {
    setSearchText("");
    setMinInput("");
    setMaxInput("");
    router.push(pathname, { scroll: false });
    onCloseMobile?.();
  }

  const hasActiveFilters = Boolean(
    currentQ ||
      currentSub ||
      currentBrand ||
      currentSort ||
      currentMinPrice ||
      currentMaxPrice ||
      currentRating ||
      currentStock ||
      currentDiscount ||
      currentFeatured,
  );

  const sliderMin = priceBounds.min >= priceBounds.max ? 0 : priceBounds.min;
  const sliderMax = Math.max(priceBounds.max, sliderMin + 1000);
  const parsedMax = maxInput.trim() !== "" ? Number(maxInput) : NaN;
  const sliderValue = Number.isFinite(parsedMax)
    ? Math.min(Math.max(parsedMax, sliderMin), sliderMax)
    : sliderMax;
  const displayMin =
    minInput.trim() !== "" && Number.isFinite(Number(minInput))
      ? Number(minInput)
      : sliderMin;
  const displayMax = sliderValue;

  const visibleSubcategories = showAllCategories
    ? subcategories
    : subcategories.slice(0, INITIAL_CATEGORY_LIMIT);
  const hasMoreCategories = subcategories.length > INITIAL_CATEGORY_LIMIT;

  const allLabel = allCategoryLabel ?? `All ${categoryTitle}`;

  return (
    <div className="space-y-4">
      {/* ── 1. CATEGORIES ────────────────────────────────────────── */}
      <FilterSection title="Categories">
        <nav aria-label={`${categoryTitle} subcategories`} className="space-y-1">
          {/* First option: All [Category] */}
          <button
            type="button"
            onClick={() => handleSelectCategory("")}
            aria-current={!currentSub ? "true" : undefined}
            className={`flex w-full items-center justify-between rounded-lg border-l-2 px-2.5 py-2 text-left text-xs transition ${
              !currentSub
                ? "border-[#2563EB] bg-[#EFF6FF] font-semibold text-[#2563EB]"
                : "border-transparent bg-white font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
            }`}
          >
            <span className="truncate">{allLabel}</span>
            <span
              className={`ml-2 text-[11px] ${
                !currentSub ? "text-[#2563EB]" : "text-slate-400"
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Actual Child Categories from Supabase */}
          {visibleSubcategories.map((cat) => {
            const active = currentSub === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(active ? "" : cat.slug)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center justify-between rounded-lg border-l-2 px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? "border-[#2563EB] bg-[#EFF6FF] font-semibold text-[#2563EB]"
                    : "border-transparent bg-white font-medium text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span
                  className={`ml-2 text-[11px] ${
                    active ? "text-[#2563EB]" : "text-slate-400"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}

          {hasMoreCategories && (
            <button
              type="button"
              onClick={() => setShowAllCategories((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] transition hover:underline"
            >
              {showAllCategories
                ? "Show Less"
                : `Show More (+${subcategories.length - INITIAL_CATEGORY_LIMIT})`}
            </button>
          )}
        </nav>
      </FilterSection>

      <div className="border-t border-gray-100" />

      {/* ── 2. SEARCH ────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="category-sidebar-search"
          className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#0F172A]"
        >
          Search {categoryTitle}
        </label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="category-sidebar-search"
            name="q"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={`Search ${categoryTitle.toLowerCase()}...`}
            className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-8 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
          />
          {searchText && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchText("");
                pushFilter({ q: "" });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </form>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── 3. PRICE RANGE ───────────────────────────────────────── */}
      <FilterSection title="Price Range">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">Selected:</span>
          <span className="text-[11px] font-semibold text-[#2563EB]">
            Rs. {displayMin.toLocaleString()} – Rs.{" "}
            {displayMax.toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          aria-label="Maximum price slider"
          min={sliderMin}
          max={sliderMax}
          step={Math.max(50, Math.round((sliderMax - sliderMin) / 40))}
          value={sliderValue}
          onChange={(e) => setMaxInput(e.target.value)}
          onPointerUp={(e) =>
            applyPriceRange(minInput, (e.target as HTMLInputElement).value)
          }
          onKeyUp={(e) => {
            if (
              e.key === "ArrowLeft" ||
              e.key === "ArrowRight" ||
              e.key === "ArrowUp" ||
              e.key === "ArrowDown"
            ) {
              applyPriceRange(minInput, (e.target as HTMLInputElement).value);
            }
          }}
          className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-[#2563EB]"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyPriceRange(minInput, maxInput);
          }}
          className="grid grid-cols-2 gap-2"
        >
          <input
            type="number"
            min={0}
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#2563EB]"
          />
          <input
            type="number"
            min={0}
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#2563EB]"
          />
          <button
            type="submit"
            className={`rounded-lg border border-blue-200 bg-[#EFF6FF] py-1.5 text-[11px] font-semibold text-[#2563EB] transition hover:bg-[#2563EB] hover:text-white ${
              currentMinPrice || currentMaxPrice ? "col-span-1" : "col-span-2"
            }`}
          >
            Apply Price
          </button>
          {(currentMinPrice || currentMaxPrice) && (
            <button
              type="button"
              onClick={() => {
                setMinInput("");
                setMaxInput("");
                applyPriceRange("", "");
              }}
              className="col-span-1 rounded-lg border border-gray-200 bg-white py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </form>
      </FilterSection>

      <div className="border-t border-gray-100" />

      {/* ── 4. CUSTOMER RATINGS ──────────────────────────────────── */}
      <FilterSection title="Customer Ratings">
        <div className="space-y-1.5">
          {RATING_OPTIONS.map((opt) => {
            const checked = currentRating === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  pushFilter({ rating: checked ? "" : opt.value })
                }
                className="group flex w-full items-center gap-2 rounded-md py-1 text-left text-xs"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
                    checked
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-gray-300 bg-white group-hover:border-[#2563EB]"
                  }`}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={
                        i < opt.stars
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200"
                      }
                    />
                  ))}
                </span>
                <span
                  className={
                    checked ? "font-semibold text-[#2563EB]" : "text-gray-700"
                  }
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <div className="border-t border-gray-100" />

      {/* ── 5. AVAILABILITY ──────────────────────────────────────── */}
      <FilterSection title="Availability">
        <div className="space-y-1.5">
          {[
            { value: "in_stock", label: "In Stock", count: inStockCount },
            {
              value: "out_of_stock",
              label: "Out of Stock",
              count: outOfStockCount,
            },
          ].map((opt) => {
            const checked = currentStock === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => pushFilter({ stock: checked ? "" : opt.value })}
                className="group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-xs"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
                    checked
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-gray-300 bg-white group-hover:border-[#2563EB]"
                  }`}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span
                  className={`flex-1 ${
                    checked ? "font-semibold text-[#2563EB]" : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </span>
                <span className="text-[11px] text-gray-400">
                  ({opt.count})
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* ── 6. BRAND (only when actual brand data exists) ────────── */}
      {brands.length > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <FilterSection title="Brand">
            <div className="space-y-1.5">
              {brands.map((b) => {
                const checked = currentBrand === b.name;
                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() =>
                      pushFilter({ brand: checked ? "" : b.name })
                    }
                    className="group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-xs"
                  >
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
                        checked
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-gray-300 bg-white group-hover:border-[#2563EB]"
                      }`}
                    >
                      {checked && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span
                      className={`flex-1 truncate ${
                        checked
                          ? "font-semibold text-[#2563EB]"
                          : "text-gray-700"
                      }`}
                    >
                      {b.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      ({b.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </FilterSection>
        </>
      )}

      <div className="border-t border-gray-100" />

      {/* ── 7. DISCOUNT ──────────────────────────────────────────── */}
      <FilterSection title="Discount">
        <div className="space-y-1.5">
          {DISCOUNT_OPTIONS.map((opt) => {
            const checked = currentDiscount === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  pushFilter({ discount: checked ? "" : opt.value })
                }
                className="group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-xs"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
                    checked
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-gray-300 bg-white group-hover:border-[#2563EB]"
                  }`}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span
                  className={
                    checked ? "font-semibold text-[#2563EB]" : "text-gray-700"
                  }
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <div className="border-t border-gray-100" />

      {/* ── HIGHLIGHTS ───────────────────────────────────────────── */}
      <FilterSection title="Highlights" defaultOpen={false}>
        <button
          type="button"
          onClick={() =>
            pushFilter({ featured: currentFeatured === "true" ? "" : "true" })
          }
          className="group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-xs"
        >
          <span
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
              currentFeatured === "true"
                ? "border-[#2563EB] bg-[#2563EB] text-white"
                : "border-gray-300 bg-white group-hover:border-[#2563EB]"
            }`}
          >
            {currentFeatured === "true" && <Check size={11} strokeWidth={3} />}
          </span>
          <span
            className={
              currentFeatured === "true"
                ? "font-semibold text-[#2563EB]"
                : "text-gray-700"
            }
          >
            Featured {categoryTitle}
          </span>
        </button>
      </FilterSection>

      {/* ── Clear All Filters ────────────────────────────────────── */}
      <button
        type="button"
        onClick={clearAllFilters}
        disabled={!hasActiveFilters}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        <RotateCcw size={13} />
        Clear All
      </button>
    </div>
  );
}

/* ── Mobile Filter & Categories Bar + Slide-Over Drawer ────────── */
export function CategoryMobileFilterBar(props: CategorySidebarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentSort = searchParams.get("sort") ?? "";
  const currentStock = searchParams.get("stock") ?? "";
  const currentDiscount = searchParams.get("discount") ?? "";

  const activeCount = [
    searchParams.get("q"),
    searchParams.get("sub"),
    searchParams.get("brand"),
    searchParams.get("minPrice"),
    searchParams.get("maxPrice"),
    searchParams.get("rating"),
    currentStock,
    currentDiscount,
    searchParams.get("featured"),
  ].filter(Boolean).length;

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function pushParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] shadow-xs transition hover:border-[#2563EB] hover:text-[#2563EB]"
        >
          <SlidersHorizontal size={13} className="text-[#2563EB]" />
          Filter &amp; Categories
          {activeCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="relative flex-shrink-0">
          <select
            aria-label={`Sort ${props.categoryTitle} products`}
            value={currentSort}
            onChange={(e) => pushParam("sort", e.target.value)}
            className="h-9 appearance-none rounded-lg border border-[#E2E8F0] bg-white pl-3 pr-7 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            pushParam("stock", currentStock === "in_stock" ? "" : "in_stock")
          }
          className={`h-9 flex-shrink-0 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition ${
            currentStock === "in_stock"
              ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
              : "border-[#E2E8F0] bg-white text-gray-700"
          }`}
        >
          In Stock
        </button>

        <button
          type="button"
          onClick={() =>
            pushParam("discount", currentDiscount === "10" ? "" : "10")
          }
          className={`h-9 flex-shrink-0 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition ${
            currentDiscount === "10"
              ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
              : "border-[#E2E8F0] bg-white text-gray-700"
          }`}
        >
          10%+ Off
        </button>
      </div>

      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${props.categoryTitle} categories and filters`}
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <FolderTree size={16} className="text-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Categories &amp; Filters
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close categories and filters"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <CategorySidebarFilters
                {...props}
                onCloseMobile={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
