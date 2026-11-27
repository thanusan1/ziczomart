"use client";

import { useMemo } from "react";
import { FolderTree, Layers } from "lucide-react";

export type SelectableCategory = {
  id: string;
  name: string;
  parent_id?: string | null;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  categories: SelectableCategory[];
  loading: boolean;
  mainCategoryId: string;
  subcategoryId: string;
  onMainCategoryChange: (mainId: string) => void;
  onSubcategoryChange: (subId: string) => void;
  allowInactiveCurrent?: boolean;
  currentCategoryId?: string | null;
  required?: boolean;
};

export default function ProductCategorySelector({
  categories,
  loading,
  mainCategoryId,
  subcategoryId,
  onMainCategoryChange,
  onSubcategoryChange,
  allowInactiveCurrent = false,
  currentCategoryId = null,
  required = false,
}: Props) {
  const hasParentId = useMemo(
    () => categories.some((c) => "parent_id" in c),
    [categories],
  );

  const currentCat = useMemo(
    () => categories.find((c) => c.id === currentCategoryId) ?? null,
    [categories, currentCategoryId],
  );

  const mainCategories = useMemo(() => {
    const tops = hasParentId
      ? categories.filter((c) => !c.parent_id)
      : categories;
    return tops.filter(
      (c) =>
        c.is_active ||
        (allowInactiveCurrent &&
          (c.id === mainCategoryId || c.id === currentCat?.parent_id)),
    );
  }, [
    categories,
    hasParentId,
    allowInactiveCurrent,
    mainCategoryId,
    currentCat,
  ]);

  const subcategoriesForMain = useMemo(() => {
    if (!mainCategoryId || !hasParentId) return [];
    return categories.filter(
      (c) =>
        c.parent_id === mainCategoryId &&
        (c.is_active || (allowInactiveCurrent && c.id === subcategoryId)),
    );
  }, [
    categories,
    mainCategoryId,
    hasParentId,
    allowInactiveCurrent,
    subcategoryId,
  ]);

  function handleMainChange(nextMainId: string) {
    onMainCategoryChange(nextMainId);

    // Clear subcategory if it does not belong to the newly selected main category
    if (subcategoryId) {
      const stillValid = categories.some(
        (c) => c.id === subcategoryId && c.parent_id === nextMainId,
      );
      if (!stillValid) {
        onSubcategoryChange("");
      }
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Step 1: Main Category */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Layers size={14} className="text-[#1049C6]" />
          Main Category {required && <span className="text-red-500">*</span>}
        </label>

        <select
          required={required}
          value={mainCategoryId}
          onChange={(e) => handleMainChange(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        >
          <option value="">
            {loading ? "Loading categories..." : "Select a main category"}
          </option>
          {mainCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
              {!cat.is_active ? " (Inactive)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Subcategory */}
      <div>
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <FolderTree size={14} className="text-[#1049C6]" />
          Subcategory{" "}
          {subcategoriesForMain.length > 0 && required && (
            <span className="text-red-500">*</span>
          )}
        </label>

        <select
          required={required && subcategoriesForMain.length > 0}
          value={subcategoryId}
          onChange={(e) => onSubcategoryChange(e.target.value)}
          disabled={
            loading || !mainCategoryId || subcategoriesForMain.length === 0
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1049C6] focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">
            {!mainCategoryId
              ? "Select a main category first"
              : subcategoriesForMain.length === 0
                ? "No subcategories under this category"
                : "Select a subcategory"}
          </option>
          {subcategoriesForMain.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
              {!sub.is_active ? " (Inactive)" : ""}
            </option>
          ))}
        </select>

        {mainCategoryId && subcategoriesForMain.length > 0 && (
          <p className="mt-1.5 text-xs text-slate-500">
            Showing {subcategoriesForMain.length} subcategor
            {subcategoriesForMain.length === 1 ? "y" : "ies"} for the selected
            main category.
          </p>
        )}
      </div>
    </div>
  );
}
