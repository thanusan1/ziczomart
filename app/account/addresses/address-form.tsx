"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addAddress, updateAddress } from "./actions";
import { Loader2, Save } from "lucide-react";

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  district: string | null;
  postal_code: string | null;
  is_default: boolean;
};

type Props = {
  address?: Address;
  onCancel?: () => void;
};

export default function AddressForm({ address, onCancel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    if (address) {
      formData.set("id", address.id);
    }

    startTransition(async () => {
      const result = address
        ? await updateAddress(formData)
        : await addAddress(formData);

      if (!result.success) {
        setError(result.error || "Something went wrong.");
        return;
      }

      router.refresh();

      if (onCancel) {
        onCancel();
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Full Name *
        </label>
        <input
          name="fullName"
          required
          minLength={2}
          maxLength={100}
          defaultValue={address?.full_name ?? ""}
          disabled={isPending}
          placeholder="Enter recipient name"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Phone Number *
        </label>
        <input
          name="phone"
          type="tel"
          required
          defaultValue={address?.phone ?? ""}
          disabled={isPending}
          placeholder="0771234567"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Address Line 1 *
        </label>
        <input
          name="addressLine1"
          required
          maxLength={200}
          defaultValue={address?.address_line_1 ?? ""}
          disabled={isPending}
          placeholder="House number, street name"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Address Line 2
        </label>
        <input
          name="addressLine2"
          defaultValue={address?.address_line_2 ?? ""}
          disabled={isPending}
          placeholder="Apartment, building, landmark (optional)"
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            City *
          </label>
          <input
            name="city"
            required
            defaultValue={address?.city ?? ""}
            disabled={isPending}
            placeholder="Colombo"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            District
          </label>
          <input
            name="district"
            defaultValue={address?.district ?? ""}
            disabled={isPending}
            placeholder="Colombo"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Postal Code
        </label>
        <input
          name="postalCode"
          defaultValue={address?.postal_code ?? ""}
          disabled={isPending}
          placeholder="Optional"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.is_default ?? false}
          disabled={isPending}
          className="h-4 w-4 accent-orange-500"
        />
        Set as my default delivery address
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              {address ? "Update Address" : "Save Address"}
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
