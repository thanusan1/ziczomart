"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { placeOrder } from "./actions";
import { MapPin, CreditCard, Banknote, Loader2 } from "lucide-react";

type Props = {
  subtotal: number;
  cartId: string;
};

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  is_default: boolean;
};

export default function CheckoutForm(_props: Props) {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAddresses() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const savedAddresses = (data ?? []) as Address[];

        setAddresses(savedAddresses);

        const defaultAddress =
          savedAddresses.find((address) => address.is_default) ??
          savedAddresses[0];

        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
          setAddressFields(defaultAddress);
        }
      } catch (err) {
        console.error("Address loading error:", err);
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadAddresses();
  }, []);

  function setAddressFields(address: Address) {
    setFullName(address.full_name);
    setPhone(address.phone);
    setLine1(address.address_line_1);
    setLine2(address.address_line_2 ?? "");
    setCity(address.city);
    setDistrict(address.district);
    setPostalCode(address.postal_code ?? "");
  }

  function selectSavedAddress(addressId: string) {
    setSelectedAddress(addressId);

    const address = addresses.find((item) => item.id === addressId);

    if (address) {
      setAddressFields(address);
    } else {
      setFullName("");
      setPhone("");
      setLine1("");
      setLine2("");
      setCity("");
      setDistrict("");
      setPostalCode("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !line1.trim() ||
      !city.trim() ||
      !district.trim()
    ) {
      setError("Please complete all required delivery details.");
      return;
    }

    if (!/^(\+94|0)?[0-9]{9,10}$/.test(phone.replace(/[\s-]/g, ""))) {
      setError("Please enter a valid Sri Lankan phone number.");
      return;
    }

    if (paymentMethod !== "cod") {
      setError("Please select Cash on Delivery.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.set("fullName", fullName);
      formData.set("phone", phone);
      formData.set("addressLine1", line1);
      formData.set("addressLine2", line2);
      formData.set("city", city);
      formData.set("district", district);
      formData.set("postalCode", postalCode);

      const result = await placeOrder(formData);

      if (!result.success || !result.orderId) {
        throw new Error(result.error || "Could not place your order.");
      }

      router.push(`/account/orders/${result.orderId}?placed=1`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not place your order.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 md:p-8"
    >
      <section>
        <div className="mb-6 flex items-center gap-3">
          <MapPin className="text-orange-500" />
          <h2 className="text-xl font-bold">Delivery Information</h2>
        </div>

        {loadingAddresses ? (
          <p className="mb-5 text-sm text-gray-500">
            Loading saved addresses...
          </p>
        ) : addresses.length > 0 ? (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold">
              Saved Addresses
            </label>

            <select
              value={selectedAddress}
              onChange={(event) => selectSavedAddress(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.full_name} — {address.city}, {address.district}
                  {address.is_default ? " (Default)" : ""}
                </option>
              ))}

              <option value="">Enter a new address</option>
            </select>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Full Name *
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Phone Number *
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              District *
            </label>
            <input
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Colombo"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Address Line 1 *
            </label>
            <input
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="House number, street name"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Address Line 2
            </label>
            <input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Apartment, landmark (optional)"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">City *</label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Your city"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Postal Code
            </label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section>
        <div className="mb-5 flex items-center gap-3">
          <CreditCard className="text-orange-500" />
          <h2 className="text-xl font-bold">Payment Method</h2>
        </div>

        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-orange-500 bg-orange-50 p-5">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-4 w-4 accent-orange-500"
          />

          <Banknote className="text-orange-500" size={25} />

          <div>
            <p className="font-bold text-gray-900">Cash on Delivery</p>
            <p className="mt-1 text-sm text-gray-500">
              Pay when your order arrives.
            </p>
          </div>
        </label>

        <div className="mt-3 flex items-center gap-4 rounded-xl border border-gray-200 p-5 opacity-50">
          <CreditCard className="text-gray-400" size={25} />

          <div>
            <p className="font-bold text-gray-700">Online Payment</p>
            <p className="mt-1 text-sm text-gray-500">
              Coming soon — payment gateway setup required.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || loadingAddresses}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-orange-500 px-6 py-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Placing Order...
          </>
        ) : (
          "Place Order — Cash on Delivery"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Your order will be submitted using Cash on Delivery.
      </p>
    </form>
  );
}
