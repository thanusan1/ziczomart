"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setEmail(null);
      } else {
        setEmail(session?.user.email ?? null);
      }

      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Unable to log out. Please try again.");
      setLoggingOut(false);
      return;
    }

    setEmail(null);
    setLoggingOut(false);

    router.replace("/");
    router.refresh();
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Logged-in Customer
  if (email) {
    return (
      <div className="flex items-center gap-4">
        <span className="hidden max-w-48 truncate text-sm font-medium text-gray-700 sm:block">
          {email}
        </span>

        <Link
          href="/account"
          className="text-sm font-medium transition hover:text-orange-500"
        >
          My Account
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:border-orange-500 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    );
  }

  // Logged-out Customer
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-sm font-medium transition hover:text-orange-500"
      >
        Login
      </Link>

      <Link
        href="/register"
        className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        Register
      </Link>
    </div>
  );
}
