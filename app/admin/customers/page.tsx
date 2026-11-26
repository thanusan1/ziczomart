import { createClient } from "@/lib/supabase/server";
import { Users, Phone } from "lucide-react";

export const instant = false;

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, role")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">Could not load customers</p>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
            Store Management
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold text-gray-900">Customers</h1>
          <p className="mt-1.5 text-gray-500">
            Registered customer accounts on ZicZo Mart.
          </p>
        </div>

        {/* Count badge */}
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Users size={19} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Customers</p>
            <p className="text-2xl font-extrabold text-gray-900">
              {customers?.length ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Table / Empty State */}
      {!customers || customers.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Users size={28} className="text-gray-400" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">No customers yet</h2>
          <p className="mt-2 text-gray-500">
            Registered customers will appear here once they sign up.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Customer ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer, idx) => (
                  <tr key={customer.id} className="transition hover:bg-gray-50">
                    {/* Row number */}
                    <td className="px-6 py-4 text-xs text-gray-400">{idx + 1}</td>

                    {/* Name + avatar initial */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                          {customer.full_name
                            ? customer.full_name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {customer.full_name || "Unnamed Customer"}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 text-gray-600">
                      {customer.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" />
                          {customer.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-6 py-4 text-gray-500">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString("en-LK", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      {customer.id.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
            <p className="text-xs text-gray-400">
              Showing {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
