"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";

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
      setError(
        err instanceof Error ? err.message : "Could not update quantity.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeItem() {
    const confirmed = window.confirm(
      "Remove this product from your shopping cart?",
    );

    if (!confirmed) return;

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
      setError(
        err instanceof Error ? err.message : "Could not remove product.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => updateQuantity(quantity - 1)}
            disabled={loading || quantity <= 1}
            className="p-2 transition hover:bg-gray-100 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>

          <span className="min-w-10 text-center text-sm font-semibold">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => updateQuantity(quantity + 1)}
            disabled={loading || quantity >= stockQuantity}
            className="p-2 transition hover:bg-gray-100 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={removeItem}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Remove
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
