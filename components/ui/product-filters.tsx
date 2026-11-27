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
} from "lucide-react";

export type FilterCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export interface ProductFiltersProps {
  categories: FilterCategory[];
  totalCount: number;
  inStockCount: number;
  outOfStockCount: number;
  priceBounds: { min: number; max: number };
  onCloseMobile?: () => void;
}

export const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "top_rated", label: "Top Rated" },
];

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

export default function ProductFilters({
  categories,
  inStockCount,
  outOfStockCount,
  priceBounds,
  onCloseMobile,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentCategoryParam = searchParams.get("category") ?? "";
  const selectedCategories = currentCategoryParam
    ? currentCategoryParam.split(",").filter(Boolean)
    : [];
  const currentSort = searchParams.get("sort") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentRating = searchParams.get("rating") ?? "";
  const currentStock = searchParams.get("stock") ?? "";
  const currentDiscount = searchParams.get("discount") ?? "";
  const currentFeatured = searchParams.get("featured") ?? "";
  const currentDeals = searchParams.get("deals") ?? "";
  const currentWishlist = searchParams.get("wishlist") ?? "";

  const [searchText, setSearchText] = useState(currentQ);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [minInput, setMinInput] = useState(currentMinPrice);
  const [maxInput, setMaxInput] = useState(currentMaxPrice);

  useEffect(() => {
    setSearchText(currentQ);
  }, [currentQ]);

  useEffect(() => {
    setMinInput(currentMinPrice);
    setMaxInput(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset to page 1 whenever filters change
      params.delete("page");

      Object.entries(overrides).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  function pushFilter(overrides: Record<string, string>) {
    router.push(buildUrl(overrides), { scroll: false });
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pushFilter({ q: searchText.trim() });
    onCloseMobile?.();
  }

  function toggleCategory(slug: string) {
    const exists = selectedCategories.includes(slug);
    const next = exists
      ? selectedCategories.filter((s) => s !== slug)
      : [...selectedCategories, slug];
    pushFilter({ category: next.join(","), featured: "" });
  }

  function applyPriceRange(minVal: string, maxVal: string) {
    pushFilter({
      minPrice: minVal.trim(),
      maxPrice: maxVal.trim(),
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
      currentCategoryParam ||
      currentSort ||
      currentMinPrice ||
      currentMaxPrice ||
      currentRating ||
      currentStock ||
      currentDiscount ||
      currentFeatured ||
      currentDeals ||
      currentWishlist,
  );

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 5);

  const sliderMax = Math.max(priceBounds.max, 1000);
  const currentMaxNumeric = currentMaxPrice
    ? Math.min(Number(currentMaxPrice), sliderMax)
    : sliderMax;

  return (
    <div className="space-y-5">
      {/* ── Search ─────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="sidebar-search"
          className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#0A1633]"
        >
          Search
        </label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            id="sidebar-search"
            name="q"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100"
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

      {/* ── Sort By ────────────────────────────────────────────── */}
      <div>
        <label
          htmlFor="sidebar-sort"
          className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#0A1633]"
        >
          Sort By
        </label>
        <div className="relative">
          <select
            id="sidebar-sort"
            value={currentSort}
            onChange={(e) => pushFilter({ sort: e.target.value })}
            className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-gray-800 outline-none transition focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Category ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#0A1633]">
            Category
          </p>
          <div className="space-y-1.5">
            {visibleCategories.map((cat) => {
              const checked = selectedCategories.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className="group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-xs transition hover:text-[#1049C6]"
                >
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
                      checked
                        ? "border-[#1049C6] bg-[#1049C6] text-white"
                        : "border-gray-300 bg-white group-hover:border-[#1049C6]"
                    }`}
                  >
                    {checked && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span
                    className={`flex-1 truncate ${
                      checked
                        ? "font-semibold text-[#1049C6]"
                        : "text-gray-700"
                    }`}
                  >
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ({cat.count})
                  </span>
                </button>
              );
            })}
          </div>

          {categories.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1049C6] hover:text-[#0B3BA8]"
            >
              {showAllCategories ? (
                <>
                  Show less <ChevronUp size={13} />
                </>
              ) : (
                <>
                  Show more ({categories.length - 5}) <ChevronDown size={13} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="border-t border-gray-100" />

      {/* ── Price Range ────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A1633]">
            Price Range
          </span>
          <span className="text-[11px] font-semibold text-[#1049C6]">
            Rs. {(Number(minInput) || 0).toLocaleString()} – Rs.{" "}
            {(Number(maxInput) || sliderMax).toLocaleString()}
          </span>
        </div>

        <input
          type="range"
          aria-label="Maximum price slider"
          min={priceBounds.min}
          max={sliderMax}
          step={Math.max(100, Math.round(sliderMax / 50))}
          value={currentMaxNumeric}
          onChange={(e) => {
            setMaxInput(e.target.value);
          }}
          onMouseUp={(e) =>
            applyPriceRange(minInput, (e.target as HTMLInputElement).value)
          }
          onTouchEnd={(e) =>
            applyPriceRange(minInput, (e.target as HTMLInputElement).value)
          }
          className="mb-3 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-[#1049C6]"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyPriceRange(minInput, maxInput);
          }}
          className="grid grid-cols-2 gap-2"
        >
          <div className="relative">
            <input
              type="number"
              min={0}
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder="Min"
              aria-label="Minimum price"
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#1049C6]"
            />
          </div>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="Max"
              aria-label="Maximum price"
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#1049C6]"
            />
          </div>
          <button
            type="submit"
            className="col-span-2 rounded-lg border border-blue-200 bg-blue-50/70 py-1.5 text-[11px] font-semibold text-[#1049C6] transition hover:bg-[#1049C6] hover:text-white"
          >
            Apply Price
          </button>
        </form>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Customer Ratings ───────────────────────────────────── */}
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#0A1633]">
          Customer Ratings
        </p>
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
                      ? "border-[#1049C6] bg-[#1049C6] text-white"
                      : "border-gray-300 bg-white group-hover:border-[#1049C6]"
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
                    checked ? "font-semibold text-[#1049C6]" : "text-gray-700"
                  }
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Availability ───────────────────────────────────────── */}
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#0A1633]">
          Availability
        </p>
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
                onClick={() =>
                  pushFilter({ stock: checked ? "" : opt.value })
                }
                className="group flex w-full items-center gap-2.5 rounded-md py-1 text-left text-xs"
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${
                    checked
                      ? "border-[#1049C6] bg-[#1049C6] text-white"
                      : "border-gray-300 bg-white group-hover:border-[#1049C6]"
                  }`}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span
                  className={`flex-1 ${
                    checked ? "font-semibold text-[#1049C6]" : "text-gray-700"
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
      </div>

      <div className="border-t border-gray-100" />

      {/* ── Discount ───────────────────────────────────────────── */}
      <div>
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#0A1633]">
          Discount
        </p>
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
                      ? "border-[#1049C6] bg-[#1049C6] text-white"
                      : "border-gray-300 bg-white group-hover:border-[#1049C6]"
                  }`}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
                <span
                  className={
                    checked ? "font-semibold text-[#1049C6]" : "text-gray-700"
                  }
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Clear All Filters ──────────────────────────────────── */}
      <button
        type="button"
        onClick={clearAllFilters}
        disabled={!hasActiveFilters}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1049C6] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        <RotateCcw size={13} />
        Clear All Filters
      </button>
    </div>
  );
}

/* ── Mobile Filter Bar + Slide-Over Drawer ───────────────────── */
export function MobileFilterBar(props: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "";

  const activeCount = [
    searchParams.get("q"),
    currentCategory,
    searchParams.get("minPrice"),
    searchParams.get("maxPrice"),
    searchParams.get("rating"),
    searchParams.get("stock"),
    searchParams.get("discount"),
    searchParams.get("featured"),
    searchParams.get("deals"),
    searchParams.get("wishlist"),
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
          className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-[#0A1633] shadow-xs transition hover:border-[#1049C6] hover:text-[#1049C6]"
        >
          <SlidersHorizontal size={13} className="text-[#1049C6]" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1049C6] px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <div className="relative flex-shrink-0">
          <select
            aria-label="Sort products"
            value={currentSort}
            onChange={(e) => pushParam("sort", e.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 text-xs font-semibold text-[#0A1633] outline-none focus:border-[#1049C6]"
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
          onClick={() => pushParam("category", "")}
          className={`h-9 flex-shrink-0 rounded-lg border px-3 text-xs font-medium transition ${
            !currentCategory
              ? "border-[#1049C6] bg-[#1049C6] text-white"
              : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          All
        </button>

        {props.categories.slice(0, 6).map((cat) => {
          const active = currentCategory.split(",").includes(cat.slug);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => pushParam("category", active ? "" : cat.slug)}
              className={`h-9 flex-shrink-0 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition ${
                active
                  ? "border-[#1049C6] bg-blue-50 text-[#1049C6]"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-[#0A1633]/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#1049C6]" />
                <h2 className="text-sm font-bold text-[#0A1633]">Filters</h2>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <ProductFilters
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
