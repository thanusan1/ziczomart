"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

interface ProductFiltersProps {
  categories: Category[];
  totalCount: number;
}

const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
];

export default function ProductFilters({
  categories,
  totalCount,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "";
  const currentFeatured = searchParams.get("featured") ?? "";

  /* Build updated URL with new params */
  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(overrides).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement).value.trim();
    router.push(buildUrl({ q }));
  }

  function clearSearch() {
    router.push(buildUrl({ q: "" }));
  }

  function handleCategory(slug: string) {
    router.push(buildUrl({ category: slug, featured: "" }));
  }

  function handleSort(sort: string) {
    router.push(buildUrl({ sort }));
  }

  function handleFeatured() {
    router.push(buildUrl({ featured: currentFeatured ? "" : "true", category: "" }));
  }

  function clearAllFilters() {
    router.push(pathname);
  }

  const hasActiveFilters = !!(currentQ || currentCategory || currentSort || currentFeatured);

  return (
    <div className="space-y-6">
      {/* ── Search ─────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">
          Search
        </label>
        <form onSubmit={handleSearch} className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            name="q"
            type="search"
            defaultValue={currentQ}
            placeholder="Search products…"
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          {currentQ && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* ── Sort ───────────────────────────────────── */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">
          Sort By
        </label>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-200 py-2.5 pl-3 pr-8 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      {/* ── Featured Toggle ────────────────────────── */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">
          Filter
        </label>
        <button
          type="button"
          onClick={handleFeatured}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
            currentFeatured
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          Featured Products
          {currentFeatured && (
            <X size={13} className="text-orange-500" />
          )}
        </button>
      </div>

      {/* ── Categories ─────────────────────────────── */}
      {categories.length > 0 && (
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">
            Category
          </label>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleCategory("")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                !currentCategory && !currentFeatured
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              All Products
              <span className="text-xs text-gray-400">{totalCount}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategory(cat.slug)}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                  currentCategory === cat.slug
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Clear All ──────────────────────────────── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-xs font-semibold text-gray-500 transition hover:border-red-300 hover:text-red-500"
        >
          <X size={12} />
          Clear All Filters
        </button>
      )}
    </div>
  );
}

/* ── Compact mobile filter bar ───────────────────────────── */
export function MobileFilterBar({
  categories,
  totalCount,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSort = searchParams.get("sort") ?? "";
  const currentFeatured = searchParams.get("featured") ?? "";

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(overrides).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* Sort dropdown — compact */}
      <div className="relative flex-shrink-0">
        <select
          value={currentSort}
          onChange={(e) =>
            router.push(buildUrl({ sort: e.target.value }))
          }
          className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-7 text-xs font-medium text-gray-700 outline-none focus:border-orange-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value ? opt.label : "Sort"}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      {/* Featured */}
      <button
        type="button"
        onClick={() =>
          router.push(
            buildUrl({ featured: currentFeatured ? "" : "true", category: "" }),
          )
        }
        className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
          currentFeatured
            ? "border-orange-500 bg-orange-50 text-orange-600"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        <SlidersHorizontal size={12} />
        Featured
        {currentFeatured && <X size={10} />}
      </button>

      {/* Category chips */}
      <button
        type="button"
        onClick={() => router.push(buildUrl({ category: "", featured: "" }))}
        className={`h-9 flex-shrink-0 rounded-lg border px-3 text-xs font-medium transition ${
          !currentCategory && !currentFeatured
            ? "border-orange-500 bg-orange-50 text-orange-600"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() =>
            router.push(buildUrl({ category: cat.slug, featured: "" }))
          }
          className={`h-9 flex-shrink-0 whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition ${
            currentCategory === cat.slug
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
