import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin,
  Plus,
  ArrowLeft,
  Home,
  Briefcase,
  MapPinned,
} from "lucide-react";
import AddressList from "./address-list";

export const instant = false;

export default async function AddressesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/account/addresses");
  }

  const { data: addresses, error } = await supabase
    .from("addresses")
    .select(
      `
      id,
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      district,
      postal_code,
      country,
      is_default,
      created_at
    `,
    )
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load your saved addresses.");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/account"
            className="text-sm font-medium text-gray-600 hover:text-orange-500"
          >
            My Account
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/account"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          Back to Account
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold uppercase tracking-widest text-orange-500">
              My Account
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
              Saved Addresses
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your delivery addresses.
            </p>
          </div>

          <Link
            href="/account/addresses/new"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Address
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <MapPin size={44} className="mx-auto text-gray-300" />

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No saved addresses
            </h2>

            <p className="mt-2 text-gray-500">
              Add your first delivery address to make checkout easier.
            </p>

            <Link
              href="/account/addresses/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
            >
              <Plus size={18} />
              Add Your First Address
            </Link>
          </div>
        ) : (
          <AddressList addresses={addresses} />
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <Home className="mb-3 text-orange-500" size={24} />
            <h3 className="font-bold">Home Address</h3>
            <p className="mt-1 text-sm text-gray-500">
              Save your home delivery location.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <Briefcase className="mb-3 text-orange-500" size={24} />
            <h3 className="font-bold">Office Address</h3>
            <p className="mt-1 text-sm text-gray-500">
              Save your workplace delivery location.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <MapPinned className="mb-3 text-orange-500" size={24} />
            <h3 className="font-bold">Other Addresses</h3>
            <p className="mt-1 text-sm text-gray-500">
              Save other places you receive deliveries.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
