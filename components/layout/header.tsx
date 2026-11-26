"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Package,
  MapPin,
  ChevronDown,
} from "lucide-react";

type CartCount = number;

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartCount, setCartCount] = useState<CartCount>(0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  /* ── Auth & Cart ──────────────────────────────────────── */
  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setEmail(session.user.email ?? null);
        await loadProfileAndCart(supabase, session.user.id);
      }

      setAuthLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setEmail(session.user.email ?? null);
          await loadProfileAndCart(supabase, session.user.id);
        } else {
          setEmail(null);
          setIsAdmin(false);
          setCartCount(0);
        }
        setAuthLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfileAndCart(supabase: ReturnType<typeof createClient>, userId: string) {
    const [{ data: profile }, { data: cart }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
      supabase.from("carts").select("id").eq("user_id", userId).maybeSingle(),
    ]);

    setIsAdmin(profile?.role === "admin");

    if (cart) {
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("cart_id", cart.id);
      setCartCount(count ?? 0);
    } else {
      setCartCount(0);
    }
  }

  /* ── Close mobile menu on route change ───────────────── */
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  /* ── Close account dropdown on outside click ─────────── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Focus search input when opened ──────────────────── */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  /* ── Lock body scroll when mobile menu open ──────────── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setIsAdmin(false);
    setCartCount(0);
    setLoggingOut(false);
    setAccountOpen(false);
    router.replace("/");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Announcement Bar ──────────────────────────────── */}
      <div className="bg-gray-900 px-4 py-2 text-center text-xs font-medium text-gray-300 tracking-wide">
        Free delivery on orders over Rs. 5,000 &nbsp;·&nbsp; Cash on Delivery available island-wide
      </div>

      {/* ── Main Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl"
          >
            ZicZo<span className="text-orange-500">Mart</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <Search size={19} />
            </button>

            {/* Account */}
            {!authLoading && (
              email ? (
                <div className="relative" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-label="Account menu"
                    className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:flex"
                  >
                    <User size={16} />
                    <span className="max-w-24 truncate">Account</span>
                    <ChevronDown size={14} className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Mobile account icon */}
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-label="Account menu"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 sm:hidden"
                  >
                    <User size={19} />
                  </button>

                  {/* Account Dropdown */}
                  {accountOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{email}</p>
                      </div>
                      <div className="py-1">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
                          >
                            <Package size={15} /> Admin Dashboard
                          </Link>
                        )}
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <User size={15} /> My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Package size={15} /> My Orders
                        </Link>
                        <Link
                          href="/account/addresses"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <MapPin size={15} /> Saved Addresses
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <LogOut size={15} />
                          {loggingOut ? "Signing out…" : "Sign Out"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
                  >
                    Register
                  </Link>
                </div>
              )
            )}

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle mobile menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-20"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <form onSubmit={handleSearch} className="flex items-center gap-3 p-4">
              <Search size={20} className="flex-shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </form>
            <div className="border-t border-gray-100 px-4 pb-3 pt-2 text-xs text-gray-400">
              Press Enter to search · Esc to close
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Menu ───────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl md:hidden">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Link href="/" className="text-xl font-extrabold tracking-tight">
                ZicZo<span className="text-orange-500">Mart</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Navigation
              </p>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors mb-1 ${
                    isActive(link.href)
                      ? "bg-orange-50 text-orange-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider */}
              <div className="my-4 border-t border-gray-100" />

              {/* Auth Section */}
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Account
              </p>
              {email ? (
                <>
                  <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{email}</p>
                  </div>
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 mb-1">
                      <Package size={15} /> Admin Dashboard
                    </Link>
                  )}
                  <Link href="/account" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1">
                    <User size={15} /> My Account
                  </Link>
                  <Link href="/account/orders" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1">
                    <Package size={15} /> My Orders
                  </Link>
                  <Link href="/account/addresses" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 mb-1">
                    <MapPin size={15} /> Saved Addresses
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {loggingOut ? "Signing out…" : "Sign Out"}
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Cart CTA */}
            <div className="border-t border-gray-100 p-4">
              <Link
                href="/cart"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                <ShoppingCart size={17} />
                View Cart
                {cartCount > 0 && (
                  <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
