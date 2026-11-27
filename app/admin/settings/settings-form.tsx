"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  RotateCcw,
  LayoutGrid,
  Tags,
  Search,
} from "lucide-react";
import { type StoreSettings } from "@/lib/store-settings";
import { saveStoreSettings, updateProductMerchandising } from "./actions";

export type MerchandisingProduct = {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_best_deal: boolean;
};

function ProductMerchandisingRow({
  product,
  onSaved,
}: {
  product: MerchandisingProduct;
  onSaved: (msg: string, isError?: boolean) => void;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(String(product.price));
  const [compareAt, setCompareAt] = useState(
    product.compare_at_price != null ? String(product.compare_at_price) : "",
  );
  const [isFeatured, setIsFeatured] = useState(product.is_featured);
  const [isBestSeller, setIsBestSeller] = useState(product.is_best_seller);
  const [isNewArrival, setIsNewArrival] = useState(product.is_new_arrival);
  const [isBestDeal, setIsBestDeal] = useState(product.is_best_deal);
  const [saving, setSaving] = useState(false);

  const numPrice = Number(price);
  const numCompare = compareAt.trim() ? Number(compareAt) : null;
  const discountPct =
    numCompare && numCompare > numPrice && numPrice > 0
      ? Math.round(((numCompare - numPrice) / numCompare) * 100)
      : 0;

  async function handleRowSave() {
    setSaving(true);
    const res = await updateProductMerchandising({
      id: product.id,
      price: numPrice,
      compare_at_price: numCompare,
      is_featured: isFeatured,
      is_best_seller: isBestSeller,
      is_new_arrival: isNewArrival,
      is_best_deal: isBestDeal,
    });
    setSaving(false);

    if (res.ok) {
      onSaved(`Updated "${product.name}".`);
      router.refresh();
    } else {
      onSaved(res.error || "Update failed.", true);
    }
  }

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-slate-50/70">
      <td className="py-3 pr-3">
        <p className="max-w-[200px] truncate text-xs font-semibold text-[#0F172A]">
          {product.name}
        </p>
        {discountPct > 0 && (
          <span className="mt-0.5 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
            -{discountPct}% Deal
          </span>
        )}
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label={`Price for ${product.name}`}
          className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#2563EB]"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          step="0.01"
          value={compareAt}
          onChange={(e) => setCompareAt(e.target.value)}
          placeholder="None"
          aria-label={`Compare-at price for ${product.name}`}
          className="w-24 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#2563EB]"
        />
      </td>
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          checked={isBestDeal}
          onChange={(e) => setIsBestDeal(e.target.checked)}
          aria-label={`Best Deal: ${product.name}`}
          className="h-4 w-4 accent-[#2563EB]"
        />
      </td>
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          aria-label={`Featured: ${product.name}`}
          className="h-4 w-4 accent-[#2563EB]"
        />
      </td>
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          checked={isBestSeller}
          onChange={(e) => setIsBestSeller(e.target.checked)}
          aria-label={`Best Seller: ${product.name}`}
          className="h-4 w-4 accent-[#2563EB]"
        />
      </td>
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          checked={isNewArrival}
          onChange={(e) => setIsNewArrival(e.target.checked)}
          aria-label={`New Arrival: ${product.name}`}
          className="h-4 w-4 accent-[#2563EB]"
        />
      </td>
      <td className="py-3 pl-2 text-right">
        <button
          type="button"
          onClick={handleRowSave}
          disabled={saving}
          className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

export default function StoreSettingsForm({
  initialSettings,
  tableMissing,
  products,
}: {
  initialSettings: StoreSettings;
  tableMissing: boolean;
  products: MerchandisingProduct[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcement1, setAnnouncement1] = useState(
    initialSettings.announcement_1,
  );
  const [announcement2, setAnnouncement2] = useState(
    initialSettings.announcement_2,
  );
  const [announcement3, setAnnouncement3] = useState(
    initialSettings.announcement_3,
  );
  const [announcementMobile, setAnnouncementMobile] = useState(
    initialSettings.announcement_mobile,
  );
  const [announcementLink, setAnnouncementLink] = useState(
    initialSettings.announcement_link,
  );

  const [promoTitle, setPromoTitle] = useState(initialSettings.promo_title);
  const [promoSubtitle, setPromoSubtitle] = useState(
    initialSettings.promo_subtitle,
  );
  const [promoCtaLabel, setPromoCtaLabel] = useState(
    initialSettings.promo_cta_label,
  );
  const [promoCtaHref, setPromoCtaHref] = useState(
    initialSettings.promo_cta_href,
  );

  const [showCategories, setShowCategories] = useState(
    initialSettings.show_categories,
  );
  const [titleCategories, setTitleCategories] = useState(
    initialSettings.title_categories,
  );
  const [showDeals, setShowDeals] = useState(initialSettings.show_deals);
  const [titleDeals, setTitleDeals] = useState(initialSettings.title_deals);
  const [showFeatured, setShowFeatured] = useState(
    initialSettings.show_featured,
  );
  const [titleFeatured, setTitleFeatured] = useState(
    initialSettings.title_featured,
  );
  const [showNewArrivals, setShowNewArrivals] = useState(
    initialSettings.show_new_arrivals,
  );
  const [titleNewArrivals, setTitleNewArrivals] = useState(
    initialSettings.title_new_arrivals,
  );
  const [showBestSellers, setShowBestSellers] = useState(
    initialSettings.show_best_sellers,
  );
  const [titleBestSellers, setTitleBestSellers] = useState(
    initialSettings.title_best_sellers,
  );

  const [existingImageUrl, setExistingImageUrl] = useState(
    initialSettings.promo_image_url ?? "",
  );
  const [removePromoImage, setRemovePromoImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [productQuery, setProductQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRemovePromoImage(false);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    const formData = new FormData();
    formData.set("announcement_1", announcement1);
    formData.set("announcement_2", announcement2);
    formData.set("announcement_3", announcement3);
    formData.set("announcement_mobile", announcementMobile);
    formData.set("announcement_link", announcementLink);
    formData.set("promo_title", promoTitle);
    formData.set("promo_subtitle", promoSubtitle);
    formData.set("promo_cta_label", promoCtaLabel);
    formData.set("promo_cta_href", promoCtaHref);
    formData.set("existing_promo_image_url", existingImageUrl);
    formData.set("remove_promo_image", removePromoImage ? "true" : "false");
    formData.set("show_categories", showCategories ? "true" : "false");
    formData.set("title_categories", titleCategories);
    formData.set("show_deals", showDeals ? "true" : "false");
    formData.set("title_deals", titleDeals);
    formData.set("show_featured", showFeatured ? "true" : "false");
    formData.set("title_featured", titleFeatured);
    formData.set("show_new_arrivals", showNewArrivals ? "true" : "false");
    formData.set("title_new_arrivals", titleNewArrivals);
    formData.set("show_best_sellers", showBestSellers ? "true" : "false");
    formData.set("title_best_sellers", titleBestSellers);
    if (selectedFile) {
      formData.set("promo_image", selectedFile);
    }

    const result = await saveStoreSettings(formData);
    setSaving(false);

    if (result.ok) {
      setStatus({
        type: "success",
        message: "Storefront settings updated successfully.",
      });
      setSelectedFile(null);
      router.refresh();
    } else {
      setStatus({
        type: "error",
        message: result.error || "Could not save settings.",
      });
    }
  }

  const displayedPromoImg =
    previewUrl ||
    (!removePromoImage && existingImageUrl) ||
    "/images/promo-woman.jpg";

  const filteredProducts = productQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(productQuery.trim().toLowerCase()),
      )
    : products;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {tableMissing && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <p className="font-bold">Database migration required</p>
            <p className="mt-1">
              Run{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
                supabase/migrations/002_store_settings.sql
              </code>{" "}
              in your Supabase SQL Editor before saving changes here. Until
              then, your storefront safely uses the default settings below.
            </p>
          </div>
        )}

        {status && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* ── Section 1: Top Announcement Bar ──────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              <Megaphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Top Announcement Bar
              </h2>
              <p className="text-xs text-slate-500">
                Displayed at the very top of every page in royal blue.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Message 1 (Delivery)
              </label>
              <input
                type="text"
                required
                value={announcement1}
                onChange={(e) => setAnnouncement1(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Message 2 (Deals / Discount)
              </label>
              <input
                type="text"
                required
                value={announcement2}
                onChange={(e) => setAnnouncement2(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Message 3 (Returns / Guarantee)
              </label>
              <input
                type="text"
                required
                value={announcement3}
                onChange={(e) => setAnnouncement3(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Announcement Link (Arrow CTA)
              </label>
              <input
                type="text"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="/products?deals=true"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Mobile Compact Message
              </label>
              <input
                type="text"
                value={announcementMobile}
                onChange={(e) => setAnnouncementMobile(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Homepage Sections Visibility & Titles ──────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                <LayoutGrid size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">
                  Homepage Sections
                </h2>
                <p className="text-xs text-slate-500">
                  Show or hide homepage sections and customize their headings.
                </p>
              </div>
            </div>
            <Link
              href="/admin/categories"
              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-100"
            >
              Manage Categories →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Shop by Category",
                checked: showCategories,
                setChecked: setShowCategories,
                title: titleCategories,
                setTitle: setTitleCategories,
              },
              {
                label: "Today's Best Deals",
                checked: showDeals,
                setChecked: setShowDeals,
                title: titleDeals,
                setTitle: setTitleDeals,
              },
              {
                label: "Featured Products",
                checked: showFeatured,
                setChecked: setShowFeatured,
                title: titleFeatured,
                setTitle: setTitleFeatured,
              },
              {
                label: "New Arrivals",
                checked: showNewArrivals,
                setChecked: setShowNewArrivals,
                title: titleNewArrivals,
                setTitle: setTitleNewArrivals,
              },
              {
                label: "Best Sellers",
                checked: showBestSellers,
                setChecked: setShowBestSellers,
                title: titleBestSellers,
                setTitle: setTitleBestSellers,
              },
            ].map((sec) => (
              <div
                key={sec.label}
                className="rounded-xl border border-gray-200 bg-slate-50/50 p-4"
              >
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A]">
                    {sec.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={sec.checked}
                    onChange={(e) => sec.setChecked(e.target.checked)}
                    className="h-4 w-4 accent-[#2563EB]"
                  />
                </label>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => sec.setTitle(e.target.value)}
                  aria-label={`${sec.label} heading`}
                  className="mt-2.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#2563EB]"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Homepage Promo Card ───────────────────────── */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Homepage Promo Card
              </h2>
              <p className="text-xs text-slate-500">
                Shown beside Featured Products on the homepage.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Promo Title
                </label>
                <input
                  type="text"
                  required
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Promo Subtitle
                </label>
                <textarea
                  rows={2}
                  required
                  value={promoSubtitle}
                  onChange={(e) => setPromoSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={promoCtaLabel}
                    onChange={(e) => setPromoCtaLabel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={promoCtaHref}
                    onChange={(e) => setPromoCtaHref(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Promo Image (optional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    <Upload size={14} />
                    Upload New Image
                  </button>
                  {(existingImageUrl || selectedFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl("");
                        setExistingImageUrl("");
                        setRemovePromoImage(true);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50"
                    >
                      <RotateCcw size={13} />
                      Reset to Default Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-5">
              <p className="mb-2 text-xs font-semibold text-gray-500">
                Live Preview
              </p>
              <div className="relative min-h-[210px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#DCE8FF] via-[#E8F0FF] to-[#C8DBFF]">
                <div className="absolute inset-y-0 right-0 w-[52%]">
                  <Image
                    src={displayedPromoImg}
                    alt={promoTitle}
                    fill
                    unoptimized
                    sizes="260px"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#E2ECFF] to-transparent" />
                </div>
                <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-between p-5">
                  <div>
                    <h3 className="text-lg font-extrabold leading-tight text-[#0A1633]">
                      {promoTitle || "Upgrade Your Everyday"}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {promoSubtitle ||
                        "Discover products that make life better."}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex w-fit items-center rounded-full bg-[#1049C6] px-4 py-1.5 text-xs font-semibold text-white">
                    {promoCtaLabel || "Explore Now"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Storefront Settings"}
          </button>
        </div>
      </form>

      {/* ── Section 4: Quick Product Merchandising & Discounts ───── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              <Tags size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                Product Merchandising &amp; Discounts
              </h2>
              <p className="text-xs text-slate-500">
                Set Compare-at Price for Today&apos;s Best Deals, and toggle
                Featured, Best Seller, and New Arrival flags.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Filter products..."
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs text-gray-900 outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="pb-2.5 pr-3">Product</th>
                <th className="px-2 pb-2.5">Price (LKR)</th>
                <th className="px-2 pb-2.5">Original Price</th>
                <th className="px-2 pb-2.5 text-center">Best Deal</th>
                <th className="px-2 pb-2.5 text-center">Featured</th>
                <th className="px-2 pb-2.5 text-center">Best Seller</th>
                <th className="px-2 pb-2.5 text-center">New Arrival</th>
                <th className="pb-2.5 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <ProductMerchandisingRow
                  key={product.id}
                  product={product}
                  onSaved={(msg, isError) =>
                    setStatus({
                      type: isError ? "error" : "success",
                      message: msg,
                    })
                  }
                />
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs text-slate-400"
                  >
                    No active products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
