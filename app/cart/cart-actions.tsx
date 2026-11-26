"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Minus, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";

type Props = {
  cartItemId: string;
  quantity: number;
  stockQuantity: number;
};

export default function CartActions({
  cartItemId,
  quantity,
  stockQuantity,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function updateQuantity(newQuantity: number) {
    if (newQuantity < 1 || newQuantity > stockQuantity) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", cartItemId);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update quantity.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove item.");
      setLoading(false);
    }
  }

  /* Inline confirm UI instead of window.confirm() */
  if (confirmRemove) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
        <AlertCircle size={13} className="flex-shrink-0 text-red-500" />
        <span className="text-xs text-red-700">Remove item?</span>
        <button
          type="button"
          onClick={removeItem}
          disabled={loading}
          className="ml-1 rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? <Loader2 size={10} className="animate-spin" /> : "Yes"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmRemove(false)}
          className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {/* Quantity stepper */}
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => updateQuantity(quantity - 1)}
            disabled={loading || quantity <= 1}
            className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={13} />
          </button>
          <span className="min-w-8 select-none text-center text-sm font-semibold text-gray-900">
            {loading ? <Loader2 size={12} className="mx-auto animate-spin text-gray-400" /> : quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(quantity + 1)}
            disabled={loading || quantity >= stockQuantity}
            className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Remove item"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
