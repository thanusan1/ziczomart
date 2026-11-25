"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2, Loader2, Pencil } from "lucide-react";

import { deleteProduct, toggleProductStatus } from "./actions";

type Props = {
  productId: string;
  isActive: boolean;
};

export default function ProductActions({ productId, isActive }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function handleToggle() {
    const confirmed = window.confirm(
      isActive
        ? "Pause this product? Customers will no longer see it as active."
        : "Activate this product?",
    );

    if (!confirmed) return;

    setLoading("toggle");
    setError("");

    const formData = new FormData();
    formData.set("id", productId);
    formData.set("is_active", String(isActive));

    try {
      await toggleProductStatus(formData);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update product.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this product?\n\nThis action cannot be undone.",
    );

    if (!confirmed) return;

    setLoading("delete");
    setError("");

    const formData = new FormData();
    formData.set("id", productId);

    try {
      await deleteProduct(formData);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete product.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-w-36 flex-col gap-2">
      <Link
        href={`/admin/products/${productId}/edit`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
      >
        <Pencil size={14} />
        Edit
      </Link>

      <button
        type="button"
        onClick={handleToggle}
        disabled={loading !== null}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        {loading === "toggle" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isActive ? (
          <Pause size={14} />
        ) : (
          <Play size={14} />
        )}

        {isActive ? "Pause" : "Activate"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading !== null}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {loading === "delete" ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
        Delete
      </button>

      {error && (
        <span className="max-w-40 text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
