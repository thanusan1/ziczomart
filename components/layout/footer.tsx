import Link from "next/link";
import {
  ShoppingBag,
  Share2,
  MessageCircle,
  Globe,
  Video,
} from "lucide-react";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Deals", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/about#contact" },
];

const CUSTOMER_SUPPORT_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Track Order", href: "/account/orders" },
  { label: "Saved Addresses", href: "/account/addresses" },
  { label: "Shopping Cart", href: "/cart" },
  { label: "Help & FAQs", href: "/about" },
];

const SHOPPING_INFO_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Featured Products", href: "/products?featured=true" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Create Account", href: "/register" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A1633] text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1049C6] text-white">
                <ShoppingBag size={19} />
              </span>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                ZicZo<span className="text-blue-400"> Mart</span>
              </span>
            </Link>

            <p className="mt-3 text-sm font-medium text-blue-100/90">
              Shop Smart. Live Better.
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-400">
              Your trusted online shopping destination in Sri Lanka. Quality
              products, great prices, and fast island-wide delivery.
            </p>

            {/* Payment Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {["VISA", "Mastercard", "Cash on Delivery", "LKR"].map(
                (method) => (
                  <span
                    key={method}
                    className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-200"
                  >
                    {method}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Quick Links</h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-white">
              Customer Support
            </h3>
            <ul className="space-y-2.5">
              {CUSTOMER_SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shopping Information + Follow Us */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-white">
              Shopping Information
            </h3>
            <ul className="space-y-2.5">
              {SHOPPING_INFO_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <p className="mb-2.5 text-xs font-bold text-white">Follow Us</p>
              <div className="flex items-center gap-2">
                {[
                  { Icon: Share2, label: "Facebook", href: "#" },
                  { Icon: MessageCircle, label: "Instagram", href: "#" },
                  { Icon: Video, label: "YouTube", href: "#" },
                  { Icon: Globe, label: "Website", href: "#" },
                ].map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-[#1049C6] hover:text-white"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-gray-400 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} ZicZo Mart. All rights reserved.</p>
          <p>Trusted Online Store · Sri Lanka</p>
        </div>
      </div>
    </footer>
  );
}
