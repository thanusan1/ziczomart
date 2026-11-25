import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Package, Eye, ShoppingCart } from "lucide-react";

export const instant = false;

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      payment_method,
      payment_status,
      total,
      currency,
      shipping_full_name,
      shipping_phone,
      shipping_city,
      shipping_district,
      created_at,
      order_items (
        id
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load orders: " + error.message);
  }

  const formatMoney = (amount: number) =>
    Number(amount).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      case "shipped":
        return "bg-blue-50 text-blue-700";
      case "processing":
        return "bg-purple-50 text-purple-700";
      default:
        return "bg-yellow-50 text-yellow-700";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold uppercase tracking-wider text-orange-500">
            Store Management
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            Customer Orders
          </h1>
          <p className="mt-2 text-gray-500">
            View and manage orders placed through ZicZo Mart.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-3">
          <ShoppingCart className="text-orange-500" size={22} />
          <div>
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold">{orders?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto text-gray-300" size={48} />
          <h2 className="mt-4 text-xl font-bold">No orders yet</h2>
          <p className="mt-2 text-gray-500">
            Customer orders will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Items</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">
                        {order.order_number}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {order.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {order.shipping_full_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.shipping_phone}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {order.shipping_city}
                        {order.shipping_district
                          ? `, ${order.shipping_district}`
                          : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4">{order.order_items.length}</td>

                    <td className="px-5 py-4 font-bold text-gray-900">
                      {order.currency} {formatMoney(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold uppercase">
                        {order.payment_method}
                      </p>
                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {order.payment_status}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-LK")}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-semibold text-gray-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Eye size={15} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
