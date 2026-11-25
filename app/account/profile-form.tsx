"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateProfile } from "./actions";
import { Loader2, Save, CheckCircle } from "lucide-react";

type Props = {
  fullName: string;
  email: string;
};

export default function ProfileForm({ fullName, email }: Props) {
  const [name, setName] = useState(fullName);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const formData = new FormData();
    formData.set("fullName", name);

    startTransition(async () => {
      const result = await updateProfile(formData);

      if (!result.success) {
        setError(result.error || "Something went wrong.");
        return;
      }

      setMessage("Your profile has been updated successfully.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Full Name
        </label>

        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={100}
          disabled={isPending}
          placeholder="Enter your full name"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Email Address
        </label>

        <input
          type="email"
          value={email}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
        />

        <p className="mt-2 text-xs text-gray-400">
          Email address cannot be changed here.
        </p>
      </div>

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

      <button
        type="submit"
        disabled={isPending || name.trim().length < 2}
        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={18} />
            Save Changes
          </>
        )}
      </button>
    </form>
  );
}
