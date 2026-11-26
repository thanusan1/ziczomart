import Link from "next/link";
import {
  MapPin,
  Mail,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Share2,
  MessageCircle,
  Video,
  Globe,
} from "lucide-react";

const SHOP_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Featured", href: "/products?featured=true" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "My Orders", href: "/account/orders" },
  { label: "Saved Addresses", href: "/account/addresses" },
  { label: "Shopping Cart", href: "/cart" },
];

const SUPPORT_LINKS = [
  { label: "About ZicZo Mart", href: "/about" },
  { label: "Contact Us", href: "/about#contact" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
];

const TRUST_BADGES = [
  {
    icon: Truck,
    title: "Island-Wide Delivery",
    desc: "Delivered to your door",
  },
  {
    icon: ShieldCheck,
    title: "Secure Shopping",
    desc: "Safe & trusted checkout",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    desc: "Hassle-free returns",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    desc: "Here to help you",
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Trust Badges Strip */}
      <div className="border-b border-gray-800">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-gray-800 sm:grid-cols-4">
          {TRUST_BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.title}
                className="flex items-center gap-3 bg-gray-900 px-6 py-5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <Icon size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {badge.title}
                  </p>
                  <p className="text-xs text-gray-500">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-block text-2xl font-extrabold tracking-tight text-white"
            >
              ZicZo<span className="text-orange-500">Mart</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              Your trusted online shopping destination in Sri Lanka. Quality
              products, great prices, and fast delivery across the island.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-400">
                <MapPin size={14} className="flex-shrink-0 text-orange-500" />
                Sri Lanka
              </div>
              <a
                href="mailto:support@ziczomart.com"
                className="flex items-center gap-2.5 text-sm text-gray-400 transition hover:text-orange-400"
              >
                <Mail size={14} className="flex-shrink-0 text-orange-500" />
                support@ziczomart.com
              </a>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: Share2, label: "Facebook", href: "#" },
                { Icon: MessageCircle, label: "Instagram", href: "#" },
                { Icon: Globe, label: "Twitter", href: "#" },
                { Icon: Video, label: "YouTube", href: "#" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition hover:bg-orange-500 hover:text-white"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
              Shop
            </h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition hover:text-orange-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
              My Account
            </h3>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition hover:text-orange-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white">
              Help &amp; Info
            </h3>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition hover:text-orange-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Payment Info */}
            <div className="mt-6 rounded-lg bg-gray-800 px-4 py-3">
              <p className="text-xs font-semibold text-gray-300">
                Payment Method
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Cash on Delivery — pay when your order arrives.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} ZicZo Mart. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Proudly serving Sri Lanka 🇱🇰
          </p>
        </div>
      </div>
    </footer>
  );
}
