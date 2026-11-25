import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MapPin } from "lucide-react";
import AddressForm from "../address-form";

export const instant = false;

export default async function NewAddressPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/account/addresses/new");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold">
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          <Link
            href="/account/addresses"
            className="text-sm font-medium text-gray-600 hover:text-orange-500"
          >
            My Addresses
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/account/addresses"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          Back to Addresses
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-xl bg-orange-50 p-3">
              <MapPin className="text-orange-500" size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Add Delivery Address
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Enter the address where you want your orders delivered.
              </p>
            </div>
          </div>

          <AddressForm />
        </div>
      </section>
    </main>
  );
}
