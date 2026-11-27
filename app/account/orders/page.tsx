import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
import CustomerOrdersClient, {
  type CustomerOrderSummary,
} from "@/components/orders/customer-orders-client";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "My Orders",
  description: "View, track, and manage your ZicZo Mart orders.",
};

export const instant = false;

export default async function MyOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/orders");

  // Fetch orders (with graceful fallback if 005_order_cancellation.sql is not yet applied)
  const ordersQuery = supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_method, payment_status,
       total, currency, created_at,
       cancellation_reason, cancelled_at, refund_status,
       order_items(id, product_id, product_name, quantity,
         products(product_images(storage_path, sort_order)))`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const [{ data: ordersRaw, error: ordersErr }, { data: userReviews }] =
    await Promise.all([
      ordersQuery,
      supabase.from("reviews").select("product_id").eq("user_id", user.id),
    ]);

  let ordersData = ordersRaw as unknown[] | null;

  if (ordersErr) {
    // Fallback query without 005 columns
    const { data: fallbackRaw, error: fallbackErr } = await supabase
      .from("orders")
      .select(
        `id, order_number, status, payment_method, payment_status,
         total, currency, created_at,
         order_items(id, product_id, product_name, quantity,
           products(product_images(storage_path, sort_order)))`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fallbackErr) throw new Error("Could not load your orders.");
    ordersData = fallbackRaw as unknown[] | null;
  }

  const reviewedProductIds = new Set(
    (userReviews ?? []).map((r) => r.product_id),
  );

  type RawOrderItemRow = {
    id: string;
    product_id: string | null;
    product_name: string | null;
    quantity: number;
    products:
      | {
          product_images: { storage_path: string; sort_order: number }[] | null;
        }
      | {
          product_images: { storage_path: string; sort_order: number }[] | null;
        }[]
      | null;
  };

  type RawOrderRow = {
    id: string;
    order_number: string;
    status: string;
    payment_method: string;
    payment_status: string;
    refund_status?: string | null;
    total: number | string;
    created_at: string;
    cancellation_reason?: string | null;
    cancelled_at?: string | null;
    order_items: RawOrderItemRow[] | null;
  };

  const initialOrders: CustomerOrderSummary[] = (
    (ordersData ?? []) as RawOrderRow[]
  ).map((raw) => {
    const itemsRaw = raw.order_items ?? [];
    const items = itemsRaw.map((it) => {
      const prodRaw = it.products;
      const prod = Array.isArray(prodRaw) ? prodRaw[0] : prodRaw;
      const imgs = [...(prod?.product_images ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
        const imageUrl = imgs[0]
          ? supabase.storage
              .from("product-images")
              .getPublicUrl(imgs[0].storage_path).data.publicUrl
          : null;

        return {
          id: it.id,
          productId: it.product_id ?? null,
          productName: it.product_name ?? "Product",
          quantity: Number(it.quantity ?? 1),
          imageUrl,
        };
      });

      const isDelivered =
        String(raw.status ?? "")
          .trim()
          .toLowerCase() === "delivered";
      const hasUnreviewed =
        isDelivered &&
        items.some((it) => it.productId && !reviewedProductIds.has(it.productId));
      const allReviewed =
        isDelivered &&
        items.length > 0 &&
        items.every(
          (it) => !it.productId || reviewedProductIds.has(it.productId),
        );

      return {
        id: raw.id,
        orderNumber: raw.order_number,
        status: raw.status,
        paymentMethod: raw.payment_method,
        paymentStatus: raw.payment_status,
        refundStatus: raw.refund_status ?? "none",
        total: Number(raw.total),
        createdAt: raw.created_at,
        cancellationReason: raw.cancellation_reason ?? null,
        cancelledAt: raw.cancelled_at ?? null,
        items,
        hasUnreviewedDeliveredItems: hasUnreviewed,
        allDeliveredItemsReviewed: allReviewed,
      };
    },
  );

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            <Breadcrumb
              items={[
                { label: "My Account", href: "/account" },
                { label: "My Orders" },
              ]}
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0F172A]">
                  My Orders
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {initialOrders.length} order
                  {initialOrders.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#2563EB]"
              >
                <ArrowLeft size={14} /> My Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <CustomerOrdersClient
            userId={user.id}
            initialOrders={initialOrders}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
