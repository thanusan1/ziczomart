"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { placeOrder } from "./actions";
import {
  MapPin,
  Banknote,
  CreditCard,
  Loader2,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

type Props = { subtotal: number; cartId: string };

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

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

export default function CheckoutForm({ cartId }: Props) {
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const saved = (data ?? []) as Address[];
        setAddresses(saved);

        const def = saved.find((a) => a.is_default) ?? saved[0];
        if (def) { setSelectedAddress(def.id); setFields(def); }
      } finally {
        setLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, []);

  function setFields(a: Address) {
    setFullName(a.full_name);
    setPhone(a.phone);
    setLine1(a.address_line_1);
    setLine2(a.address_line_2 ?? "");
    setCity(a.city);
    setDistrict(a.district);
    setPostalCode(a.postal_code ?? "");
  }

  function selectSaved(id: string) {
    setSelectedAddress(id);
    const a = addresses.find((x) => x.id === id);
    if (a) setFields(a);
    else { setFullName(""); setPhone(""); setLine1(""); setLine2(""); setCity(""); setDistrict(""); setPostalCode(""); }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !line1.trim() || !city.trim() || !district.trim()) {
      setError("Please complete all required delivery fields.");
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
      const fd = new FormData();
      fd.set("fullName", fullName);
      fd.set("phone", phone);
      fd.set("addressLine1", line1);
      fd.set("addressLine2", line2);
      fd.set("city", city);
      fd.set("district", district);
      fd.set("postalCode", postalCode);

      const result = await placeOrder(fd);
      if (!result.success || !result.orderId) throw new Error(result.error || "Could not place order.");

      router.push(`/account/orders/${result.orderId}?placed=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Delivery Section ─────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <MapPin size={16} className="text-orange-500" />
          </div>
          <h2 className="font-bold text-gray-900">Delivery Information</h2>
        </div>

        {/* Saved address selector */}
        {loadingAddresses && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            Loading saved addresses…
          </div>
        )}

        {!loadingAddresses && addresses.length > 0 && (
          <div className="mb-5">
            <label className={labelClass}>Use a saved address</label>
            <div className="relative">
              <select
                value={selectedAddress}
                onChange={(e) => selectSaved(e.target.value)}
                className={inputClass + " pr-10 appearance-none"}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} — {a.city}, {a.district}
                    {a.is_default ? " (Default)" : ""}
                  </option>
                ))}
                <option value="">Enter a new address</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}

        {/* Address fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full Name *</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>District *</label>
            <input required value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Colombo" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address Line 1 *</label>
            <input required value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="House number, street name" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address Line 2 <span className="font-normal text-gray-400">(optional)</span></label>
            <input value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Apartment, landmark" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>City *</label>
            <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Postal Code <span className="font-normal text-gray-400">(optional)</span></label>
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 10100" className={inputClass} />
          </div>
        </div>
      </div>

      {/* ── Payment Section ──────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <CreditCard size={16} className="text-orange-500" />
          </div>
          <h2 className="font-bold text-gray-900">Payment Method</h2>
        </div>

        <div className="space-y-3">
          {/* COD */}
          <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-orange-500 bg-orange-50 p-4 transition">
            <input
              type="radio" name="payment" value="cod"
              checked={paymentMethod === "cod"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-4 w-4 accent-orange-500"
            />
            <Banknote size={22} className="flex-shrink-0 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-900">Cash on Delivery</p>
              <p className="mt-0.5 text-xs text-gray-500">Pay in cash when your order arrives.</p>
            </div>
            <CheckCircle2 size={18} className="ml-auto flex-shrink-0 text-orange-500" />
          </label>

          {/* Online (disabled) */}
          <div className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-gray-200 p-4 opacity-50">
            <CreditCard size={22} className="flex-shrink-0 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-700">Online Payment</p>
              <p className="mt-0.5 text-xs text-gray-500">Coming soon — payment gateway required.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="mt-0.5 flex-shrink-0">⚠</span>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || loadingAddresses}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Placing Order…</>
        ) : (
          "Place Order — Cash on Delivery"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        By placing your order, you agree to our terms. Payment is collected on delivery.
      </p>
    </form>
  );
}
