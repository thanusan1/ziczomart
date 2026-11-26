import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import CheckoutForm from "./checkout-form";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowLeft, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Checkout",
  description: "Complete your ZicZo Mart order.",
};

export default async function CheckoutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/checkout");

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) redirect("/cart");

  const { data: items, error } = await supabase
    .from("cart_items")
    .select(
      `id, quantity,
       products(id, name, price, stock_quantity, is_active)`,
    )
    .eq("cart_id", cart.id);

  if (error) throw new Error(error.message);

  const validItems = (items ?? [])
    .map((item: any) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;
      return { id: item.id, quantity: item.quantity, product };
    })
    .filter((item) => item.product);

  if (validItems.length === 0) redirect("/cart");

  const subtotal = validItems.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );

  const hasUnavailableItems = validItems.some(
    (item) =>
      !item.product.is_active || item.product.stock_quantity < item.quantity,
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Breadcrumb
              items={[
                { label: "Cart", href: "/cart" },
                { label: "Checkout" },
              ]}
            />
            <div className="mt-3 flex items-center gap-4">
              <Link
                href="/cart"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-500"
              >
                <ArrowLeft size={15} />
                Back to Cart
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <h1 className="text-2xl font-extrabold text-gray-900">
                Checkout
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid items-start gap-6 lg:grid-cols-3">
            {/* Left — Form or Warning */}
            <div className="lg:col-span-2">
              {hasUnavailableItems ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-red-500"
                    />
                    <div>
                      <h2 className="font-bold text-red-800">
                        Some items need attention
                      </h2>
                      <p className="mt-1.5 text-sm text-red-700">
                        One or more products in your cart are unavailable or
                        have insufficient stock. Please return to your cart and
                        update your order before proceeding.
                      </p>
                      <Link
                        href="/cart"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        <ArrowLeft size={14} />
                        Return to Cart
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <CheckoutForm subtotal={subtotal} cartId={cart.id} />
              )}
            </div>

            {/* Right — Order Summary */}
            <aside className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <ShoppingBag size={18} className="text-orange-500" />
                <h2 className="font-bold text-gray-900">Order Summary</h2>
              </div>

              <div className="mt-4 space-y-3">
                {validItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-gray-800">
                        {item.product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-semibold text-gray-900">
                      {formatPrice(Number(item.product.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-4 border-t border-gray-100" />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-medium text-gray-500">
                    To be confirmed
                  </span>
                </div>
              </div>

              <div className="my-4 border-t border-gray-100" />

              <div className="flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-lg font-extrabold text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Trust badges */}
              <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-xs text-green-700">
                ✓ Your order is protected · Cash on Delivery available
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
