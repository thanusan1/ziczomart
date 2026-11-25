import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import CheckoutForm from "./checkout-form";

export const instant = false;

export default async function CheckoutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/checkout");
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) {
    redirect("/cart");
  }

  const { data: items, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      products (
        id,
        name,
        price,
        stock_quantity,
        is_active
      )
    `,
    )
    .eq("cart_id", cart.id);

  if (error) {
    throw new Error(error.message);
  }

  const validItems = (items ?? [])
    .map((item: any) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      return {
        id: item.id,
        quantity: item.quantity,
        product,
      };
    })
    .filter((item) => item.product);

  if (validItems.length === 0) {
    redirect("/cart");
  }

  const subtotal = validItems.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );

  const hasUnavailableItems = validItems.some(
    (item) =>
      !item.product.is_active || item.product.stock_quantity < item.quantity,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-orange-500"
          >
            <ArrowLeft size={16} />
            Back to Cart
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="font-semibold uppercase tracking-wider text-orange-500">
          Almost There
        </p>

        <h1 className="mt-2 text-4xl font-extrabold text-gray-900">Checkout</h1>

        <p className="mt-3 text-gray-500">
          Enter your delivery details to place your order.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {hasUnavailableItems ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h2 className="font-bold text-red-700">
                  Some products need attention
                </h2>
                <p className="mt-2 text-sm text-red-600">
                  A product is inactive or has insufficient stock. Please return
                  to your cart and update it before checkout.
                </p>
                <Link
                  href="/cart"
                  className="mt-4 inline-block font-semibold text-red-700 underline"
                >
                  Return to Cart
                </Link>
              </div>
            ) : (
              <CheckoutForm subtotal={subtotal} cartId={cart.id} />
            )}
          </div>

          <aside className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-orange-500" />
              <h2 className="text-xl font-bold">Order Summary</h2>
            </div>

            <div className="mt-6 space-y-4">
              {validItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <p className="whitespace-nowrap font-semibold">
                    Rs.{" "}
                    {(
                      Number(item.product.price) * item.quantity
                    ).toLocaleString("en-LK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-6 border-t border-gray-100" />

            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>
                Rs.{" "}
                {subtotal.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>To be confirmed</span>
            </div>

            <div className="my-6 border-t border-gray-100" />

            <div className="flex justify-between text-lg font-extrabold">
              <span>Subtotal</span>
              <span>
                Rs.{" "}
                {subtotal.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
