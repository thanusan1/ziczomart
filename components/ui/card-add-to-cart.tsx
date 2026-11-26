"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Props {
  productId: string;
  stockQuantity: number;
  slug: string;
}

export default function CardAddToCart({ productId, stockQuantity, slug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
        return;
      }

      const userId = session.user.id;

      // Get or create cart
      let { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!cart) {
        const { data: newCart, error: createErr } = await supabase
          .from("carts")
          .insert({ user_id: userId })
          .select("id")
          .single();
        if (createErr) throw new Error(createErr.message);
        cart = newCart;
      }

      // Check existing item
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart!.id)
        .eq("product_id", productId)
        .maybeSingle();

      const newQty = (existing?.quantity ?? 0) + 1;

      if (newQty > stockQuantity) {
        throw new Error(`Only ${stockQuantity} available in stock.`);
      }

      if (existing) {
        const { error: updateErr } = await supabase
          .from("cart_items")
          .update({ quantity: newQty })
          .eq("id", existing.id);
        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase
          .from("cart_items")
          .insert({ cart_id: cart!.id, product_id: productId, quantity: 1 });
        if (insertErr) throw new Error(insertErr.message);
      }

      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add to cart.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading || added}
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
          added
            ? "bg-emerald-600 text-white"
            : "bg-[#1049C6] text-white hover:bg-[#0B3BA8]"
        } disabled:opacity-80`}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : added ? (
          <Check size={13} />
        ) : (
          <ShoppingCart size={13} />
        )}
        {loading ? "Adding…" : added ? "Added!" : "Add to Cart"}
      </button>

      {error && (
        <p className="mt-1.5 text-center text-[10px] text-red-500">{error}</p>
      )}
    </div>
  );
}
