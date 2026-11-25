import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import CartActions from "./cart-actions";

export const instant = false;

export default async function CartPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/cart");
  }

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartError) {
    throw new Error(cartError.message);
  }

  let items: any[] = [];

  if (cart) {
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        quantity,
        products (
          id,
          name,
          slug,
          price,
          stock_quantity,
          is_active,
          product_images (
            storage_path,
            sort_order
          )
        )
      `,
      )
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    items = (data ?? []).map((item: any) => {
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;

      const images = [...(product?.product_images ?? [])].sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      );

      const imageUrl = images[0]
        ? supabase.storage
            .from("product-images")
            .getPublicUrl(images[0].storage_path).data.publicUrl
        : null;

      return {
        id: item.id,
        quantity: item.quantity,
        product,
        imageUrl,
      };
    });
  }

  const subtotal = items.reduce(
    (total, item) => total + Number(item.product?.price ?? 0) * item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/products"
            className="text-sm font-semibold text-gray-600 hover:text-orange-500"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="font-semibold uppercase tracking-wider text-orange-500">
            Your Shopping
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
            Shopping Cart
          </h1>

          <p className="mt-3 text-gray-500">
            Review your selected products before checkout.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-20 text-center">
            <ShoppingBag size={55} className="mx-auto text-gray-300" />

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-3 text-gray-500">
              You haven't added any products yet.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              <ArrowLeft size={17} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap gap-5 rounded-2xl border border-gray-200 bg-white p-5"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.product.name}
                      className="h-28 w-28 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gray-100">
                      <ShoppingBag className="text-gray-300" size={35} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-lg font-bold text-gray-900 hover:text-orange-500"
                    >
                      {item.product.name}
                    </Link>

                    <p className="mt-2 font-semibold text-orange-500">
                      Rs.{" "}
                      {Number(item.product.price).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>

                    {!item.product.is_active && (
                      <p className="mt-2 text-sm text-red-600">
                        This product is no longer available.
                      </p>
                    )}

                    {item.quantity > item.product.stock_quantity && (
                      <p className="mt-2 text-sm text-red-600">
                        Only {item.product.stock_quantity} available in stock.
                      </p>
                    )}

                    <CartActions
                      cartItemId={item.id}
                      quantity={item.quantity}
                      stockQuantity={item.product.stock_quantity}
                    />
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      Rs.{" "}
                      {(
                        Number(item.product.price) * item.quantity
                      ).toLocaleString("en-LK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

              <div className="mt-6 flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  Rs.{" "}
                  {subtotal.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="mt-4 flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="my-6 border-t border-gray-100" />

              <div className="flex justify-between text-lg font-extrabold">
                <span>Total</span>
                <span>
                  Rs.{" "}
                  {subtotal.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-7 flex w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-4 font-bold text-white transition hover:bg-orange-600"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="mt-4 block text-center text-sm font-semibold text-gray-500 hover:text-orange-500"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
