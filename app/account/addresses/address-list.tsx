"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Pencil,
  Trash2,
  Star,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { deleteAddress, setDefaultAddress } from "./actions";

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  district: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
};

type Props = {
  addresses: Address[];
};

export default function AddressList({ addresses }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) return;

    setMessage("");
    setError("");
    setBusyId(id);

    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await deleteAddress(formData);

      setBusyId("");

      if (!result.success) {
        setError(result.error || "Could not delete address.");
        return;
      }

      setMessage("Address deleted successfully.");
      router.refresh();
    });
  }

  function handleSetDefault(id: string) {
    setMessage("");
    setError("");
    setBusyId(id);

    const formData = new FormData();
    formData.set("id", id);

    startTransition(async () => {
      const result = await setDefaultAddress(formData);

      setBusyId("");

      if (!result.success) {
        setError(result.error || "Could not update default address.");
        return;
      }

      setMessage("Default address updated successfully.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {addresses.map((address) => {
          const isBusy = isPending && busyId === address.id;

          return (
            <div
              key={address.id}
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                address.is_default
                  ? "border-orange-300 ring-1 ring-orange-100"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-50 p-3">
                    <MapPin className="text-orange-500" size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      {address.full_name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {address.phone}
                    </p>
                  </div>
                </div>

                {address.is_default && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    <Star size={12} />
                    Default
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-1 text-sm leading-6 text-gray-600">
                <p>{address.address_line_1}</p>

                {address.address_line_2 && <p>{address.address_line_2}</p>}

                <p>
                  {address.city}
                  {address.district ? `, ${address.district}` : ""}
                </p>

                {address.postal_code && (
                  <p>Postal Code: {address.postal_code}</p>
                )}

                <p>{address.country}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-500 hover:text-orange-500"
                >
                  <Pencil size={15} />
                  Edit
                </Link>

                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={isPending}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-500 hover:text-orange-500 disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      "Set Default"
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(address.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
