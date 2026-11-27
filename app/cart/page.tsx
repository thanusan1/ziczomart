import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import CartActions from "./cart-actions";
import {
  ShoppingBag,
  ArrowRight,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import {
  getActiveDealsWithProducts,
  resolveProductDealPricing,
} from "@/lib/deals";

export const metadata = {
  title: "Shopping Cart",
  description: "Review your selected products before checkout.",
};

export const instant = false;

export default async function CartPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/cart");

  /* Fetch cart */
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartError) throw new Error(cartError.message);

  /* Fetch cart items */
  let items: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      stock_quantity: number;
      is_active: boolean;
    };
    imageUrl: string | null;
  }[] = [];

  if (cart) {
    const [{ data, error }, { productDealMap }] = await Promise.all([
      supabase
        .from("cart_items")
        .select(
          `id, quantity,
           products(id, name, slug, price, compare_at_price, stock_quantity, is_active,
             product_images(storage_path, sort_order))`,
        )
        .eq("cart_id", cart.id)
        .order("created_at", { ascending: false }),
      getActiveDealsWithProducts(supabase),
    ]);

    if (error) throw new Error(error.message);

    type RawCartProduct = {
      id: string;
      name: string;
      slug: string;
      price: number | string;
      compare_at_price: number | string | null;
      stock_quantity: number;
      is_active: boolean;
      product_images: { storage_path: string; sort_order: number }[] | null;
    };

    type RawCartItem = {
      id: string;
      quantity: number;
      products: RawCartProduct | RawCartProduct[] | null;
    };

    items = ((data ?? []) as RawCartItem[])
      .map((item) => {
        const product = Array.isArray(item.products)
          ? item.products[0]
          : item.products;
        if (!product) return null;
        const imgs = [...(product.product_images ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        const imageUrl = imgs[0]
          ? supabase.storage
              .from("product-images")
              .getPublicUrl(imgs[0].storage_path).data.publicUrl
          : null;
        const pricing = resolveProductDealPricing(
          Number(product.price),
          product.compare_at_price ? Number(product.compare_at_price) : null,
          productDealMap.get(product.id),
        );
        return {
          id: item.id,
          quantity: item.quantity,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: pricing.effectivePrice,
            stock_quantity: product.stock_quantity,
            is_active: product.is_active,
          },
          imageUrl,
        };
      })
      .filter((x): x is (typeof items)[number] => x !== null);
  }

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.product?.price ?? 0) * item.quantity,
    0,
  );

  const itemCount = items.reduce((n, item) => n + item.quantity, 0);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Breadcrumb items={[{ label: "Shopping Cart" }]} />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Shopping Cart
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                </p>
              </div>
              <Link
                href="/products"
                className="hidden items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 sm:flex"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {items.length === 0 ? (
            /* ── Empty Cart ─────────────────────────── */
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">
                <ShoppingBag size={36} className="text-orange-400" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-gray-900">
                Your cart is empty
              </h2>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                You haven&apos;t added any products yet. Discover our collection
                and find something you love.
              </p>
              <Link
                href="/products"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
              >
                Start Shopping
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* ── Cart Content ───────────────────────── */
            <div className="grid items-start gap-6 lg:grid-cols-3">
              {/* Item list */}
              <div className="space-y-3 lg:col-span-2">
                {items.map((item) => {
                  const unavailable = !item.product?.is_active;
                  const overStock =
                    item.quantity > item.product?.stock_quantity;

                  return (
                    <div
                      key={item.id}
                      className={`flex gap-4 rounded-xl border bg-white p-4 sm:p-5 ${
                        unavailable || overStock
                          ? "border-red-200 bg-red-50/30"
                          : "border-gray-100"
                      }`}
                    >
                      {/* Image */}
                      <Link
                        href={`/products/${item.product?.slug}`}
                        className="flex-shrink-0"
                      >
                        <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.product?.name ?? "Product"}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package size={24} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/products/${item.product?.slug}`}
                              className="font-semibold text-gray-900 hover:text-orange-500 line-clamp-2"
                            >
                              {item.product?.name}
                            </Link>

                            {unavailable && (
                              <p className="mt-1 text-xs font-medium text-red-600">
                                This product is no longer available
                              </p>
                            )}
                            {!unavailable && overStock && (
                              <p className="mt-1 text-xs font-medium text-red-600">
                                Only {item.product?.stock_quantity} available
                              </p>
                            )}
                          </div>

                          {/* Line total (desktop) */}
                          <p className="hidden flex-shrink-0 font-bold text-gray-900 sm:block">
                            {formatPrice(
                              Number(item.product?.price) * item.quantity,
                            )}
                          </p>
                        </div>

                        {/* Unit price */}
                        <p className="mt-1 text-sm font-semibold text-orange-500">
                          {formatPrice(Number(item.product?.price))} each
                        </p>

                        {/* Controls */}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <CartActions
                            cartItemId={item.id}
                            quantity={item.quantity}
                            stockQuantity={item.product?.stock_quantity ?? 0}
                          />
                          {/* Line total (mobile) */}
                          <p className="font-bold text-gray-900 sm:hidden">
                            {formatPrice(
                              Number(item.product?.price) * item.quantity,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Continue shopping (mobile) */}
                <div className="flex sm:hidden">
                  <Link
                    href="/products"
                    className="flex w-full items-center justify-center rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:border-orange-500 hover:text-orange-500"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <aside className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Subtotal ({itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"})
                    </span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery</span>
                    <span className="font-medium text-green-600">
                      Calculated at checkout
                    </span>
                  </div>
                </div>

                <div className="my-5 border-t border-gray-100" />

                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-extrabold text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-bold text-white transition hover:bg-orange-600"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Link>

                {/* Trust badges */}
                <div className="mt-5 space-y-2.5">
                  {[
                    { icon: ShieldCheck, text: "Secure checkout" },
                    { icon: Truck, text: "Island-wide delivery" },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      <Icon size={13} className="text-green-500" />
                      {text}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
