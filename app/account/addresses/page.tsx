import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  MapPinned,
} from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
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
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "Saved Addresses" },
              ]}
            />
          </div>
        </div>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {/* Page header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                My Account
              </p>
              <h1 className="mt-1.5 text-3xl font-extrabold text-gray-900">
                Saved Addresses
              </h1>
              <p className="mt-1.5 text-gray-500">
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

          {/* Address list or empty state */}
          {addresses.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <MapPin size={28} className="text-orange-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                No saved addresses
              </h2>
              <p className="mt-2 text-gray-500">
                Add your first delivery address to make checkout easier.
              </p>
              <Link
                href="/account/addresses/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
              >
                <Plus size={18} />
                Add Your First Address
              </Link>
            </div>
          ) : (
            <AddressList addresses={addresses} />
          )}

          {/* Info cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Home,
                title: "Home Address",
                desc: "Save your home delivery location.",
              },
              {
                icon: Briefcase,
                title: "Office Address",
                desc: "Save your workplace delivery location.",
              },
              {
                icon: MapPinned,
                title: "Other Addresses",
                desc: "Save other places you receive deliveries.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <Icon className="mb-3 text-orange-500" size={22} />
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
