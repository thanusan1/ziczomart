"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProductCard, { type ProductCardData } from "@/components/ui/product-card";
import ProductPlaceholderCard from "@/components/ui/product-placeholder-card";
import QuickViewModal from "@/components/ui/quick-view-modal";
import { SORT_OPTIONS } from "@/components/ui/product-filters";

export type ActiveFilterChip = {
  key: string;
  label: string;
  clearKeys?: string[];
};

interface ProductsListingClientProps {
  products: ProductCardData[];
  totalFiltered: number;
  currentPage: number;
  perPage: number;
  hasActiveFilters: boolean;
  searchQuery: string;
  minVisualSlots?: number;
  placeholderCategory?: string;
  clearFiltersHref?: string;
  activeFilterChips?: ActiveFilterChip[];
}

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export default function ProductsListingClient({
  products,
  totalFiltered,
  currentPage,
  perPage,
  hasActiveFilters,
  searchQuery,
  minVisualSlots = 0,
  placeholderCategory,
  clearFiltersHref = "/products",
  activeFilterChips = [],
}: ProductsListingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductCardData | null>(null);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [wishlistPendingId, setWishlistPendingId] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<ToastState>(null);

  const currentSort = searchParams.get("sort") ?? "";

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* Load user's wishlist IDs */
  useEffect(() => {
    const supabase = createClient();

    async function loadWishlist() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setWishlistedIds(new Set());
        return;
      }

      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", session.user.id);

      setWishlistedIds(new Set((data ?? []).map((w) => w.product_id)));
    }

    loadWishlist();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadWishlist();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleToggleWishlist(productId: string) {
    setWishlistPendingId(productId);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        const currentUrl = searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
        router.push(`/login?next=${encodeURIComponent(currentUrl)}`);
        return;
      }

      const userId = session.user.id;
      const isCurrentlySaved = wishlistedIds.has(productId);

      if (isCurrentlySaved) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) throw new Error(error.message);

        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        showToast("success", "Removed from wishlist");
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: userId, product_id: productId });

        if (error) throw new Error(error.message);

        setWishlistedIds((prev) => new Set(prev).add(productId));
        showToast("success", "Saved to wishlist");
      }

      window.dispatchEvent(new CustomEvent("ziczomart:wishlist-updated"));
      if (searchParams.get("wishlist") === "true") {
        router.refresh();
      }
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Could not update wishlist",
      );
    } finally {
      setWishlistPendingId(null);
    }
  }

  function pushParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
  }

  /* Pagination calculations */
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const startItem =
    totalFiltered === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalFiltered);

  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="min-w-0 flex-1">
      {/* ── Top Listing Toolbar ────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 shadow-xs">
        <p className="text-xs font-medium text-slate-600 sm:text-sm">
          {totalFiltered > 0 ? (
            <>
              Showing{" "}
              <span className="font-bold text-[#0A1633]">
                {startItem}–{endItem}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[#0A1633]">{totalFiltered}</span>{" "}
              {totalFiltered === 1 ? "Product" : "Products"}
            </>
          ) : (
            <span>0 Products found</span>
          )}
        </p>

        <div className="flex items-center gap-3">
          {/* Desktop Sort Dropdown */}
          <div className="hidden items-center gap-2 sm:flex">
            <label
              htmlFor="toolbar-sort"
              className="text-xs font-medium text-slate-500"
            >
              Sort By:
            </label>
            <div className="relative">
              <select
                id="toolbar-sort"
                value={currentSort}
                onChange={(e) =>
                  pushParams({ sort: e.target.value, page: "" })
                }
                className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-xs font-semibold text-[#0A1633] outline-none transition focus:border-[#1049C6]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Grid / List Toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5"
          >
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                viewMode === "grid"
                  ? "bg-[#1049C6] text-white shadow-xs"
                  : "text-gray-500 hover:text-[#0A1633]"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                viewMode === "list"
                  ? "bg-[#1049C6] text-white shadow-xs"
                  : "text-gray-500 hover:text-[#0A1633]"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Filter Chips ────────────────────────────────── */}
      {activeFilterChips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                const keysToClear = chip.clearKeys ?? [chip.key];
                const overrides: Record<string, string> = { page: "" };
                keysToClear.forEach((k) => {
                  overrides[k] = "";
                });
                pushParams(overrides);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-[#1049C6] transition hover:bg-blue-100"
            >
              <span>{chip.label}</span>
              <X size={12} />
            </button>
          ))}
          <Link
            href={clearFiltersHref}
            className="text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-[#1049C6] hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* ── Product Grid / List (+ Smart Visual Placeholders) ──── */}
      {(() => {
        const showEmptyFiltered = products.length === 0 && hasActiveFilters;
        const placeholderCount =
          !showEmptyFiltered &&
          currentPage === 1 &&
          minVisualSlots > 0 &&
          products.length < minVisualSlots
            ? minVisualSlots - products.length
            : 0;

        if (products.length === 0 && placeholderCount === 0) {
          return null;
        }

        return (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                : "space-y-4"
            }
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                isWishlisted={wishlistedIds.has(product.id)}
                wishlistPending={wishlistPendingId === product.id}
                onToggleWishlist={handleToggleWishlist}
                onQuickView={setQuickViewProduct}
                onToast={showToast}
              />
            ))}
            {Array.from({ length: placeholderCount }).map((_, idx) => (
              <ProductPlaceholderCard
                key={`placeholder-${idx}`}
                variant="default"
                viewMode={viewMode}
                category={placeholderCategory}
                slotIndex={idx}
              />
            ))}
          </div>
        );
      })()}

      {/* ── Empty State (With Filters) ─────────────────────────── */}
      {products.length === 0 && hasActiveFilters && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Search size={28} className="text-[#1049C6]" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#0A1633]">
            No products found
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            {searchQuery
              ? `We couldn't find any products matching "${searchQuery}". Try adjusting your search or filters.`
              : "No products match your current filters. Try removing some filters to see more items."}
          </p>
          <Link
            href={clearFiltersHref}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1049C6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8]"
          >
            Clear All Filters
          </Link>
        </div>
      )}

      {/* ── Empty State (No Products in Store) ─────────────────── */}
      {products.length === 0 && !hasActiveFilters && minVisualSlots === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Package size={28} className="text-[#1049C6]" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#0A1633]">
            No products available yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            New products are being added to our catalog. Please check back soon.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-[#0A1633] transition hover:border-[#1049C6] hover:text-[#1049C6]"
          >
            Back to Home
          </Link>
        </div>
      )}

      {/* ── Pagination Bar ─────────────────────────────────────── */}
      {totalFiltered > 0 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200/80 bg-white px-4 py-3.5 sm:flex-row">
          <div className="hidden text-xs text-slate-500 sm:block">
            Page <span className="font-bold text-[#0A1633]">{currentPage}</span>{" "}
            of <span className="font-bold text-[#0A1633]">{totalPages}</span>
          </div>

          {/* Page Controls */}
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-center gap-1.5"
          >
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                pushParams({
                  page: currentPage - 1 <= 1 ? "" : String(currentPage - 1),
                })
              }
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:border-[#1049C6] hover:text-[#1049C6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            {getPageNumbers().map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-gray-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    pushParams({ page: item === 1 ? "" : String(item) })
                  }
                  aria-current={item === currentPage ? "page" : undefined}
                  className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                    item === currentPage
                      ? "bg-[#1049C6] text-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-[#1049C6] hover:text-[#1049C6]"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => pushParams({ page: String(currentPage + 1) })}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:border-[#1049C6] hover:text-[#1049C6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </nav>

          {/* Items per page */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="items-per-page"
              className="text-xs font-medium text-slate-500"
            >
              Items per page:
            </label>
            <div className="relative">
              <select
                id="items-per-page"
                value={String(perPage)}
                onChange={(e) =>
                  pushParams({ limit: e.target.value, page: "" })
                }
                className="h-8 appearance-none rounded-lg border border-gray-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-[#0A1633] outline-none focus:border-[#1049C6]"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="36">36</option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Quick View Modal ───────────────────────────────────── */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        isWishlisted={
          quickViewProduct ? wishlistedIds.has(quickViewProduct.id) : false
        }
        onToggleWishlist={handleToggleWishlist}
        onToast={showToast}
      />

      {/* ── Toast Notification ─────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-xl transition-all ${
            toast.type === "success" ? "bg-[#0A1633]" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-white" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-1 text-white/70 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
