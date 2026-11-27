"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProductCard, { type ProductCardData } from "@/components/ui/product-card";

interface RelatedProductsSectionProps {
  products: ProductCardData[];
  viewAllHref: string;
}

export default function RelatedProductsSection({
  products,
  viewAllHref,
}: RelatedProductsSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2600);
  }

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
    setPendingId(productId);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const userId = session.user.id;
      const saved = wishlistedIds.has(productId);

      if (saved) {
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
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Could not update wishlist",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div id="related-products" className="scroll-mt-24">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-[#0F172A]">
          You May Also Like
        </h2>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] transition hover:underline"
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="compact"
              isWishlisted={wishlistedIds.has(product.id)}
              wishlistPending={pendingId === product.id}
              onToggleWishlist={handleToggleWishlist}
              onToast={showToast}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            More products in this category coming soon.
          </p>
          <Link
            href="/products"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:underline"
          >
            Browse All Products <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 right-4 z-50 rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg lg:bottom-6 ${
            toast.type === "success" ? "bg-[#0F172A]" : "bg-[#DC2626]"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
