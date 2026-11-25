import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Users, Phone, MapPin, ArrowLeft } from "lucide-react";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, role")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="mt-4 text-red-600">
          Could not load customers: {error.message}
        </p>
      </div>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>

          <p className="mt-2 text-gray-500">
            Manage your ZicZo Mart customers.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-orange-50 px-5 py-4">
          <Users className="text-orange-500" size={28} />
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {customers?.length ?? 0}
            </p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold">Customer ID</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {customer.full_name || "Unnamed Customer"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <Phone size={15} />
                        {customer.phone || "Not provided"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {customer.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="mx-auto text-gray-300" size={48} />
            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              No customers found
            </h2>
            <p className="mt-2 text-gray-500">
              Registered customers will appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
