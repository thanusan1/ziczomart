"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  Image as ImageIcon,
  FolderTree,
  Tags,
  AlertTriangle,
  X,
  CheckCircle2,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import type { MainCategorySummary } from "@/lib/categories/types";
import {
  toggleCategoryActiveAction,
  deleteMainCategorySafe,
} from "./actions";

type Props = {
  initialCategories: MainCategorySummary[];
  dbError: string | null;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

export default function MainCategoriesClient({
  initialCategories,
  dbError,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "sort_order" | "name_asc" | "name_desc" | "products_desc"
  >("sort_order");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  // Delete / dependency modal state
  const [deleteTarget, setDeleteTarget] = useState<MainCategorySummary | null>(
    null,
  );
  const [reassignToId, setReassignToId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = initialCategories.filter((cat) => {
      if (statusFilter === "active" && !cat.is_active) return false;
      if (statusFilter === "inactive" && cat.is_active) return false;
      if (q) {
        return (
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          (cat.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "products_desc") return b.product_count - a.product_count;
      return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
    });

    return list;
  }, [initialCategories, search, statusFilter, sortBy]);

  const totalMain = initialCategories.length;
  const activeMain = initialCategories.filter((c) => c.is_active).length;
  const totalSubs = initialCategories.reduce(
    (sum, c) => sum + c.subcategory_count,
    0,
  );

  async function handleToggleStatus(cat: MainCategorySummary) {
    setBusyId(cat.id);
    const res = await toggleCategoryActiveAction(cat.id, !cat.is_active);
    setBusyId(null);

    if (!res.ok) {
      showToast("error", res.error);
      return;
    }

    showToast(
      "success",
      `"${cat.name}" is now ${!cat.is_active ? "active" : "inactive"}.`,
    );
    router.refresh();
  }

  function openDeleteModal(cat: MainCategorySummary) {
    setDeleteTarget(cat);
    setReassignToId("");
    setDeleteError("");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    const res = await deleteMainCategorySafe({
      id: deleteTarget.id,
      reassignToId: reassignToId || undefined,
    });

    setDeleting(false);

    if (!res.ok) {
      setDeleteError(res.error);
      return;
    }

    const deletedName = deleteTarget.name;
    setDeleteTarget(null);
    showToast("success", res.message || `"${deletedName}" deleted.`);
    router.refresh();
  }

  const reassignOptions = useMemo(() => {
    if (!deleteTarget) return [];
    return initialCategories.filter((c) => c.id !== deleteTarget.id);
  }, [initialCategories, deleteTarget]);

  const hasFilters = Boolean(
    search.trim() || statusFilter !== "all" || sortBy !== "sort_order",
  );

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle size={17} className="shrink-0 text-red-600" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded p-0.5 hover:bg-black/5"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1049C6]">
            Store Management
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Main Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage top-level product categories across ZicZo Mart.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/subcategories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-[#1049C6] hover:text-[#1049C6]"
          >
            <FolderTree size={16} />
            Manage Subcategories
          </Link>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1049C6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8]"
          >
            <Plus size={17} />
            Add Main Category
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Main Categories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {totalMain}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Main Categories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {activeMain}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Subcategories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[#1049C6]">
            {totalSubs}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search main categories..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1049C6] focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          aria-label="Filter by status"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1049C6]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={15} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as
                  | "sort_order"
                  | "name_asc"
                  | "name_desc"
                  | "products_desc",
              )
            }
            aria-label="Sort categories"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1049C6]"
          >
            <option value="sort_order">Sort: Display Order</option>
            <option value="name_asc">Sort: Name (A–Z)</option>
            <option value="name_desc">Sort: Name (Z–A)</option>
            <option value="products_desc">Sort: Most Products</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setSortBy("sort_order");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        )}
      </div>

      {/* Error / Table / Empty */}
      {dbError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-bold">Unable to load categories</p>
          <p className="mt-1">{dbError}</p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Main Category</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5 text-center">Subcategories</th>
                  <th className="px-5 py-3.5 text-center">Products</th>
                  <th className="px-5 py-3.5 text-center">Order</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1049C6]">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-semibold text-slate-900">
                            {category.name}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {category.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {category.slug}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/admin/subcategories?main=${category.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1049C6] transition hover:bg-blue-100"
                      >
                        <FolderTree size={12} />
                        {category.subcategory_count}
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-center font-semibold text-slate-700">
                      {category.product_count}
                    </td>

                    <td className="px-5 py-4 text-center text-slate-600">
                      {category.sort_order}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          category.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          title="Edit main category"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                        >
                          <Pencil size={15} />
                        </Link>

                        <button
                          type="button"
                          disabled={busyId === category.id}
                          onClick={() => handleToggleStatus(category)}
                          title={
                            category.is_active
                              ? "Deactivate category"
                              : "Activate category"
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6] disabled:opacity-50"
                        >
                          {category.is_active ? (
                            <Pause size={15} />
                          ) : (
                            <Play size={15} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(category)}
                          title="Delete main category"
                          className="rounded-lg border border-slate-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Tags className="mx-auto text-slate-300" size={40} />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {hasFilters ? "No matching main categories" : "No categories yet"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {hasFilters
              ? "Try clearing your search or status filter."
              : "Create main categories to organize your store."}
          </p>
        </div>
      )}

      {/* Safe Delete & Dependency Reassignment Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete Main Category
                  </h3>
                  <p className="text-xs text-slate-500">{deleteTarget.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {deleteTarget.subcategory_count > 0 ||
            deleteTarget.product_count > 0 ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                  This main category currently has{" "}
                  <strong>{deleteTarget.subcategory_count}</strong>{" "}
                  subcategor
                  {deleteTarget.subcategory_count === 1 ? "y" : "ies"} and{" "}
                  <strong>{deleteTarget.product_count}</strong> product
                  {deleteTarget.product_count === 1 ? "" : "s"}. Products and
                  subcategories will not be deleted.
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Reassign subcategories &amp; direct products to:
                  </label>
                  <select
                    value={reassignToId}
                    onChange={(e) => setReassignToId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1049C6]"
                  >
                    <option value="">Select target main category...</option>
                    {reassignOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Are you sure you want to delete{" "}
                <strong>{deleteTarget.name}</strong>? This action cannot be
                undone.
              </p>
            )}

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleting ||
                  ((deleteTarget.subcategory_count > 0 ||
                    deleteTarget.product_count > 0) &&
                    !reassignToId)
                }
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : deleteTarget.subcategory_count > 0 ||
                      deleteTarget.product_count > 0
                    ? "Reassign & Delete"
                    : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
