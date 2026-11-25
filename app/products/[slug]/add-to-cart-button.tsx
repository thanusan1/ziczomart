"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  productId: string;
  stockQuantity: number;
};

export default function AddToCartButton({ productId, stockQuantity }: Props) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleAddToCart() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();

      // Check whether the customer has an active session.
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) {
        throw new Error(authError.message);
      }

      // Guests must log in before adding products.
      if (!session) {
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }

      const user = session.user;

      // Find the customer's active cart.
      const { data: existingCart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cartError) {
        throw new Error(cartError.message);
      }

      let cartId = existingCart?.id;

      // Create a cart if one does not exist.
      if (!cartId) {
        const { data: newCart, error: createCartError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select("id")
          .single();

        if (createCartError) {
          throw new Error(createCartError.message);
        }

        cartId = newCart.id;
      }

      // Check whether this product is already in the cart.
      const { data: existingItem, error: itemError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .maybeSingle();

      if (itemError) {
        throw new Error(itemError.message);
      }

      const newQuantity = (existingItem?.quantity ?? 0) + quantity;

      if (newQuantity > stockQuantity) {
        throw new Error(
          `Only ${stockQuantity} item(s) are available in stock.`,
        );
      }

      if (existingItem) {
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      setMessage("Product added to your cart successfully!");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add product to cart.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <label className="mb-3 block text-sm font-semibold text-gray-700">
        Quantity
      </label>

      <div className="mb-6 inline-flex items-center overflow-hidden rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1 || loading}
          className="px-4 py-3 transition hover:bg-gray-100 disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          <Minus size={16} />
        </button>

        <span className="min-w-12 text-center font-semibold">{quantity}</span>

        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
          disabled={quantity >= stockQuantity || loading}
          className="px-4 py-3 transition hover:bg-gray-100 disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={stockQuantity <= 0 || loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-orange-500 px-8 py-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <ShoppingCart size={20} />
        )}

        {loading ? "Adding..." : "Add to Cart"}
      </button>

      {message && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
