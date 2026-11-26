import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapPin } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Breadcrumb from "@/components/ui/breadcrumb";
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
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "Saved Addresses", href: "/account/addresses" },
                { label: "New Address" },
              ]}
            />
          </div>
        </div>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            {/* Card header */}
            <div className="mb-8 flex items-center gap-4 border-b border-gray-100 pb-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <MapPin className="text-orange-500" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Add Delivery Address
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Enter the address where you want your orders delivered.
                </p>
              </div>
            </div>

            <AddressForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
