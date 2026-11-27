"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_STORE_SETTINGS,
  getStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";
import {
  ShoppingCart,
  ShoppingBag,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Package,
  MapPin,
  ChevronDown,
  ChevronRight,
  Truck,
  Tag,
  RefreshCw,
  Flame,
  LayoutGrid,
  Heart,
} from "lucide-react";

type CategoryNav = {
  id: string;
  name: string;
  slug: string;
};

function getCategoryHref(cat: CategoryNav): string {
  const lowerName = cat.name.toLowerCase();
  const lowerSlug = cat.slug.toLowerCase();
  if (lowerName === "electronics" || lowerSlug.startsWith("electronics")) {
    return "/categories/electronics";
  }
  if (
    lowerName === "home & kitchen" ||
    lowerName === "home and kitchen" ||
    lowerSlug.startsWith("home-kitchen") ||
    lowerSlug.startsWith("home-and-kitchen")
  ) {
    return "/categories/home-kitchen";
  }
  return `/categories/${cat.slug}`;
}

const FALLBACK_NAV = [
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
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [categories, setCategories] = useState<CategoryNav[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(
    DEFAULT_STORE_SETTINGS,
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const [{ data: sessionData }, { data: cats }, { settings }] =
        await Promise.all([
          supabase.auth.getSession(),
          supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          getStoreSettings(supabase),
        ]);

      setStoreSettings(settings);

      const topLevelCats = ((cats ?? []) as (CategoryNav & { parent_id?: string | null })[]).filter(
        (c) => !c.parent_id,
      );
      setCategories(topLevelCats);

      if (sessionData.session?.user) {
        setEmail(sessionData.session.user.email ?? null);
        await loadProfileAndCart(supabase, sessionData.session.user.id);
      }

      setAuthLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setEmail(session.user.email ?? null);
        await loadProfileAndCart(supabase, session.user.id);
      } else {
        setEmail(null);
        setIsAdmin(false);
        setCartCount(0);
        setWishlistCount(0);
      }
      setAuthLoading(false);
    });

    async function handleCartOrWishlistEvent() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfileAndCart(supabase, session.user.id);
      }
    }

    window.addEventListener("ziczomart:cart-updated", handleCartOrWishlistEvent);
    window.addEventListener("ziczomart:wishlist-updated", handleCartOrWishlistEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("ziczomart:cart-updated", handleCartOrWishlistEvent);
      window.removeEventListener("ziczomart:wishlist-updated", handleCartOrWishlistEvent);
    };
  }, []);

  async function loadProfileAndCart(
    supabase: ReturnType<typeof createClient>,
    userId: string,
  ) {
    const [{ data: profile }, { data: cart }, { count: wishCount }] =
      await Promise.all([
        supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
        supabase.from("carts").select("id").eq("user_id", userId).maybeSingle(),
        supabase
          .from("wishlists")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    setIsAdmin(profile?.role === "admin");
    setWishlistCount(wishCount ?? 0);

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

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setCatOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
    } else {
      router.push("/products");
    }
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Top Royal Blue Announcement Bar ───────────────────────── */}
      <div className="bg-[#0B46C6] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs font-medium sm:px-6">
          <div className="hidden items-center gap-8 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <Truck size={13} className="text-blue-200" />
              {storeSettings.announcement_1}
            </span>
            <span className="text-blue-300/50">|</span>
            <span className="inline-flex items-center gap-1.5">
              <Tag size={13} className="text-blue-200" />
              {storeSettings.announcement_2}
            </span>
            <span className="text-blue-300/50">|</span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw size={13} className="text-blue-200" />
              {storeSettings.announcement_3}
            </span>
          </div>
          <div className="flex w-full items-center justify-center md:hidden">
            <span className="inline-flex items-center gap-1.5 truncate">
              <Truck size={13} className="flex-shrink-0 text-blue-200" />
              {storeSettings.announcement_mobile}
            </span>
          </div>
          <Link
            href={storeSettings.announcement_link || "/products"}
            aria-label="Browse deals"
            className="hidden items-center gap-0.5 text-blue-100 transition hover:text-white md:inline-flex"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Main White Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex flex-shrink-0 items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1049C6] text-white shadow-sm">
              <ShoppingBag size={19} />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-[#0A1633] sm:text-2xl">
              ZicZo<span className="text-[#1049C6]"> Mart</span>
            </span>
          </Link>

          {/* Desktop Center Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden max-w-xl flex-1 md:flex"
          >
            <div className="flex w-full overflow-hidden rounded-lg border border-gray-300 bg-white transition focus-within:border-[#1049C6] focus-within:ring-2 focus-within:ring-blue-100">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                aria-label="Search for products"
                className="flex-1 bg-transparent px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex items-center justify-center bg-[#1049C6] px-4 text-white transition hover:bg-[#0B3BA8]"
              >
                <Search size={17} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Account */}
            {!authLoading &&
              (email ? (
                <div className="relative" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-label="Account menu"
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-[#1049C6]"
                  >
                    <User size={18} className="text-gray-600" />
                    <span className="hidden sm:inline">Account</span>
                    <ChevronDown
                      size={14}
                      className={`hidden transition-transform sm:block ${
                        accountOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                          {email}
                        </p>
                      </div>
                      <div className="py-1">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#1049C6] hover:bg-blue-50"
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
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-[#1049C6]"
                  >
                    <User size={17} />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#1049C6] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#0B3BA8]"
                  >
                    Register
                  </Link>
                </div>
              ))}

            {/* Wishlist */}
            <Link
              href="/products?wishlist=true"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
              className="relative hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-[#1049C6] sm:flex"
            >
              <div className="relative">
                <Heart size={18} className="text-gray-600" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1049C6] px-1 text-[10px] font-bold text-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </div>
              <span>Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-[#1049C6]"
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle mobile menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 md:hidden"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="border-t border-gray-100 px-4 py-2.5 md:hidden">
          <form onSubmit={handleSearch} className="flex w-full overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              aria-label="Search for products"
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex items-center justify-center bg-[#1049C6] px-3.5 text-white"
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* ── Secondary Category Navigation Bar (Desktop) ─────────── */}
        <div className="hidden border-t border-gray-100 bg-white md:block">
          <div
            ref={catRef}
            className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 sm:px-6"
          >
            {/* All Categories Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1049C6] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0B3BA8]"
              >
                <Menu size={14} />
                All Categories
                <ChevronDown
                  size={13}
                  className={`transition-transform ${catOpen ? "rotate-180" : ""}`}
                />
              </button>

              {catOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-[520px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl lg:w-[640px]">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 px-2 pb-2">
                    <Link
                      href="/categories"
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1049C6] hover:underline"
                    >
                      <LayoutGrid size={14} /> Browse All Categories ({categories.length})
                    </Link>
                  </div>
                  {categories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                      {categories.map((cat) => {
                        const catHref = getCategoryHref(cat);
                        const isActiveCat = pathname === catHref;
                        return (
                          <Link
                            key={cat.id}
                            href={catHref}
                            onClick={() => setCatOpen(false)}
                            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                              isActiveCat
                                ? "bg-blue-50 font-semibold text-[#1049C6]"
                                : "text-gray-700 hover:bg-blue-50/70 hover:text-[#1049C6]"
                            }`}
                          >
                            {cat.name}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-3 py-3 text-xs text-gray-400">
                      No categories yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Horizontal Nav Links (No scrolling — top categories + More button) */}
            <nav className="flex flex-1 items-center gap-5 text-[13px] font-medium text-gray-700">
              {categories.length > 0 ? (
                <>
                  {categories.slice(0, 5).map((cat) => {
                    const catHref = getCategoryHref(cat);
                    const activeCat = pathname === catHref;
                    return (
                      <Link
                        key={cat.id}
                        href={catHref}
                        className={`whitespace-nowrap transition hover:text-[#1049C6] ${
                          activeCat ? "font-semibold text-[#1049C6]" : ""
                        }`}
                      >
                        {cat.name}
                      </Link>
                    );
                  })}
                  {categories.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setCatOpen((v) => !v)}
                      className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-[#1049C6] transition hover:text-[#0B3BA8]"
                    >
                      More ({categories.length - 5}+)
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${catOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </>
              ) : (
                FALLBACK_NAV.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`whitespace-nowrap transition hover:text-[#1049C6] ${
                      isActive(link.href) ? "font-semibold text-[#1049C6]" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                ))
              )}

              <Link
                href="/products?deals=true"
                className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-[#0A1633] transition hover:text-[#1049C6]"
              >
                <Flame size={14} className="text-red-500" />
                Deals
              </Link>
              <Link
                href="/about"
                className="whitespace-nowrap text-gray-500 transition hover:text-[#1049C6]"
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-In Menu ────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl md:hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1049C6] text-white">
                  <ShoppingBag size={16} />
                </span>
                <span className="text-lg font-extrabold text-[#0A1633]">
                  ZicZo<span className="text-[#1049C6]"> Mart</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Shop
              </p>
              {FALLBACK_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mb-1 flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-blue-50 text-[#1049C6]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {categories.length > 0 && (
                <>
                  <p className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Categories
                  </p>
                  {categories.map((cat) => {
                    const lowerName = cat.name.toLowerCase();
                    const lowerSlug = cat.slug.toLowerCase();
                    const isElectronics =
                      lowerName === "electronics" ||
                      lowerSlug.startsWith("electronics");
                    const isHomeKitchen =
                      lowerName === "home & kitchen" ||
                      lowerName === "home and kitchen" ||
                      lowerSlug.startsWith("home-kitchen") ||
                      lowerSlug.startsWith("home-and-kitchen");
                    const catHref = isElectronics
                      ? "/categories/electronics"
                      : isHomeKitchen
                        ? "/categories/home-kitchen"
                        : `/products?category=${cat.slug}`;
                    return (
                      <Link
                        key={cat.id}
                        href={catHref}
                        className="mb-1 flex items-center rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      >
                        {cat.name}
                      </Link>
                    );
                  })}
                </>
              )}

              <div className="my-4 border-t border-gray-100" />

              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Account
              </p>
              {email ? (
                <>
                  <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2.5">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                      {email}
                    </p>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1049C6] hover:bg-blue-50"
                    >
                      <Package size={15} /> Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <User size={15} /> My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <Package size={15} /> My Orders
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <MapPin size={15} /> Saved Addresses
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {loggingOut ? "Signing out…" : "Sign Out"}
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center rounded-xl bg-[#1049C6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B3BA8]"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </nav>

            <div className="border-t border-gray-100 p-4">
              <Link
                href="/cart"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A1633] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1049C6]"
              >
                <ShoppingCart size={17} />
                View Cart
                {cartCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold">
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
