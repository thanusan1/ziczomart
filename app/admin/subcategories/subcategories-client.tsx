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
  FolderTree,
  RotateCcw,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Tags,
} from "lucide-react";
import type {
  CategoryRecord,
  SubcategoryWithParent,
} from "@/lib/categories/types";
import {
  toggleCategoryActiveAction,
  deleteSubcategorySafe,
} from "../categories/actions";
import SubcategoryFormModal from "./subcategory-form-modal";

type Props = {
  mainCategories: CategoryRecord[];
  subcategories: SubcategoryWithParent[];
  initialMainFilter?: string;
  dbError: string | null;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const PAGE_SIZE = 20;

export default function SubcategoriesClient({
  mainCategories,
  subcategories,
  initialMainFilter = "",
  dbError,
}: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [mainFilter, setMainFilter] = useState(initialMainFilter);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"sort_order" | "name_asc" | "name_desc">(
    "sort_order",
  );
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSub, setEditingSub] = useState<SubcategoryWithParent | null>(
    null,
  );

  // Safe Delete modal
  const [deleteTarget, setDeleteTarget] =
    useState<SubcategoryWithParent | null>(null);
  const [reassignToId, setReassignToId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = subcategories.filter((sub) => {
      if (mainFilter && sub.parent_id !== mainFilter) return false;
      if (statusFilter === "active" && !sub.is_active) return false;
      if (statusFilter === "inactive" && sub.is_active) return false;
      if (q) {
        return (
          sub.name.toLowerCase().includes(q) ||
          sub.slug.toLowerCase().includes(q) ||
          (sub.parent_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      return (
        a.sort_order - b.sort_order ||
        (a.parent_name ?? "").localeCompare(b.parent_name ?? "") ||
        a.name.localeCompare(b.name)
      );
    });

    return list;
  }, [subcategories, search, mainFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const totalMainCount = mainCategories.length;
  const totalSubCount = subcategories.length;
  const activeSubCount = subcategories.filter((s) => s.is_active).length;
  const inactiveSubCount = totalSubCount - activeSubCount;

  const hasFilters = Boolean(
    search.trim() ||
      mainFilter ||
      statusFilter !== "all" ||
      sortBy !== "sort_order",
  );

  function resetFilters() {
    setSearch("");
    setMainFilter("");
    setStatusFilter("all");
    setSortBy("sort_order");
    setPage(1);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingSub(null);
    setModalOpen(true);
  }

  function openEditModal(sub: SubcategoryWithParent) {
    setModalMode("edit");
    setEditingSub(sub);
    setModalOpen(true);
  }

  async function handleToggleStatus(sub: SubcategoryWithParent) {
    setBusyId(sub.id);
    const res = await toggleCategoryActiveAction(sub.id, !sub.is_active);
    setBusyId(null);

    if (!res.ok) {
      showToast("error", res.error);
      return;
    }

    showToast(
      "success",
      `"${sub.name}" is now ${!sub.is_active ? "active" : "inactive"}.`,
    );
    router.refresh();
  }

  function openDeleteModal(sub: SubcategoryWithParent) {
    setDeleteTarget(sub);
    setReassignToId("");
    setDeleteError("");
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    const res = await deleteSubcategorySafe({
      id: deleteTarget.id,
      reassignToId: reassignToId || undefined,
    });

    setDeleting(false);

    if (!res.ok) {
      setDeleteError(res.error);
      return;
    }

    setDeleteTarget(null);
    showToast("success", res.message || "Subcategory deleted.");
    router.refresh();
  }

  const reassignOptions = useMemo(() => {
    if (!deleteTarget) return [];
    return subcategories.filter((s) => s.id !== deleteTarget.id);
  }, [subcategories, deleteTarget]);

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

      {/* Top Section */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1049C6]">
            Store Management
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Subcategory Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage product subcategories across all your main categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-[#1049C6] hover:text-[#1049C6]"
          >
            <Tags size={16} />
            Main Categories
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1049C6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B3BA8]"
          >
            <Plus size={17} />
            Add Subcategory
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Main Categories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {totalMainCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Subcategories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[#1049C6]">
            {totalSubCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Subcategories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {activeSubCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inactive Subcategories
          </p>
          <p className="mt-2 text-2xl font-extrabold text-slate-500">
            {inactiveSubCount}
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="relative min-w-[210px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by subcategory name..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1049C6] focus:bg-white"
          />
        </div>

        <select
          value={mainFilter}
          onChange={(e) => {
            setMainFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by main category"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1049C6]"
        >
          <option value="">All Main Categories</option>
          {mainCategories.map((main) => (
            <option key={main.id} value={main.id}>
              {main.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "all" | "active" | "inactive");
            setPage(1);
          }}
          aria-label="Filter by status"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1049C6]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={15} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as "sort_order" | "name_asc" | "name_desc",
              )
            }
            aria-label="Sort subcategories"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1049C6]"
          >
            <option value="sort_order">Sort: Display Order</option>
            <option value="name_asc">Sort: Name (A–Z)</option>
            <option value="name_desc">Sort: Name (Z–A)</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
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
          <p className="font-bold">Unable to load subcategories</p>
          <p className="mt-1">{dbError}</p>
        </div>
      ) : paginated.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Subcategory</th>
                    <th className="px-5 py-3.5">Slug</th>
                    <th className="px-5 py-3.5">Main Category</th>
                    <th className="px-5 py-3.5 text-center">Products</th>
                    <th className="px-5 py-3.5 text-center">Display Order</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginated.map((sub) => (
                    <tr
                      key={sub.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {sub.image_url ? (
                            <img
                              src={sub.image_url}
                              alt={sub.name}
                              className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1049C6]">
                              <FolderTree size={18} />
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <p className="truncate font-semibold text-slate-900">
                              {sub.name}
                            </p>
                            {sub.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                {sub.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {sub.slug}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {sub.parent_name || "Unassigned"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-semibold text-slate-700">
                        {sub.product_count}
                      </td>

                      <td className="px-5 py-3.5 text-center text-slate-600">
                        {sub.sort_order}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            sub.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {sub.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(sub)}
                            title="Edit subcategory"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6]"
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            disabled={busyId === sub.id}
                            onClick={() => handleToggleStatus(sub)}
                            title={
                              sub.is_active
                                ? "Deactivate subcategory"
                                : "Activate subcategory"
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#1049C6] hover:bg-blue-50 hover:text-[#1049C6] disabled:opacity-50"
                          >
                            {sub.is_active ? (
                              <Pause size={15} />
                            ) : (
                              <Play size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(sub)}
                            title="Delete subcategory"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                –{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {filtered.length}
                </span>{" "}
                subcategories
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Prev
                </button>
                <span className="px-2 text-xs font-semibold text-slate-600">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <FolderTree className="mx-auto text-slate-300" size={40} />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {hasFilters ? "No matching subcategories" : "No subcategories yet"}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {hasFilters
              ? "Try adjusting your search or category filter."
              : "Create your first subcategory under any main category."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1049C6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B3BA8]"
            >
              <Plus size={16} />
              Add Subcategory
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Subcategory Modal */}
      <SubcategoryFormModal
        key={`${modalMode}-${editingSub?.id ?? "new"}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        mode={modalMode}
        mainCategories={mainCategories}
        editingSubcategory={editingSub}
        defaultParentId={mainFilter}
        onClose={() => setModalOpen(false)}
        onSuccess={(msg) => {
          showToast("success", msg);
          router.refresh();
        }}
      />

      {/* Safe Delete & Reassignment Modal */}
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
                    Delete Subcategory
                  </h3>
                  <p className="text-xs text-slate-500">
                    {deleteTarget.parent_name
                      ? `${deleteTarget.parent_name} → ${deleteTarget.name}`
                      : deleteTarget.name}
                  </p>
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

            {deleteTarget.product_count > 0 ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                  <strong>{deleteTarget.product_count}</strong> product
                  {deleteTarget.product_count === 1 ? " is" : "s are"} currently
                  assigned to <strong>{deleteTarget.name}</strong>. Deletion is
                  blocked until these products are reassigned.
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Reassign affected products to:
                  </label>
                  <select
                    value={reassignToId}
                    onChange={(e) => setReassignToId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#1049C6]"
                  >
                    <option value="">Select target subcategory...</option>
                    {reassignOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.parent_name
                          ? `${opt.parent_name} → ${opt.name}`
                          : opt.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Are you sure you want to delete{" "}
                <strong>{deleteTarget.name}</strong>? No products are assigned
                to it.
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
                  (deleteTarget.product_count > 0 && !reassignToId)
                }
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : deleteTarget.product_count > 0
                    ? "Reassign & Delete"
                    : "Delete Subcategory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
