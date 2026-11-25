import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MapPin } from "lucide-react";
import AddressForm from "../../address-form";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAddressPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/account/addresses/${id}/edit`);
  }

  const { data: address, error } = await supabase
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
      is_default
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !address) {
    notFound();
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
                Edit Delivery Address
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update your saved delivery information.
              </p>
            </div>
          </div>

          <AddressForm address={address} />
        </div>
      </section>
    </main>
  );
}
