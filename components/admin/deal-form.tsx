"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  saveSpecialDealAction,
  type DealProductInput,
} from "@/app/admin/special-deals/actions";
import { formatPrice } from "@/lib/utils";

export type SelectableDealProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  imageUrl: string | null;
};

export type InitialDealData = {
  id: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  startAt: string;
  endAt: string;
  status: "draft" | "scheduled" | "active" | "paused" | "expired";
  isFeatured: boolean;
  showOnHomepage: boolean;
  displayPriority: number;
  products: DealProductInput[];
};

interface DealFormProps {
  allProducts: SelectableDealProduct[];
  initialDeal?: InitialDealData;
}

function toLocalDateInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTimeInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export default function DealForm({ allProducts, initialDeal }: DealFormProps) {
  const router = useRouter();
  const productMap = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  );

  const [name, setName] = useState(initialDeal?.name ?? "");
  const [description, setDescription] = useState(
    initialDeal?.description ?? "",
  );
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    initialDeal?.bannerUrl ?? null,
  );
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [startDate, setStartDate] = useState(() =>
    toLocalDateInput(initialDeal?.startAt),
  );
  const [startTime, setStartTime] = useState(() =>
    toLocalTimeInput(initialDeal?.startAt),
  );
  const [endDate, setEndDate] = useState(() => {
    if (initialDeal?.endAt) return toLocalDateInput(initialDeal.endAt);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return toLocalDateInput(nextWeek.toISOString());
  });
  const [endTime, setEndTime] = useState(() =>
    initialDeal?.endAt ? toLocalTimeInput(initialDeal.endAt) : "23:59",
  );

  const [isFeatured, setIsFeatured] = useState(
    initialDeal?.isFeatured ?? false,
  );
  const [showOnHomepage, setShowOnHomepage] = useState(
    initialDeal?.showOnHomepage ?? false,
  );
  const [displayPriority, setDisplayPriority] = useState(
    String(initialDeal?.displayPriority ?? 10),
  );

  const [selectedProducts, setSelectedProducts] = useState<DealProductInput[]>(
    initialDeal?.products ?? [],
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedIds = useMemo(
    () => new Set(selectedProducts.map((p) => p.productId)),
    [selectedProducts],
  );

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allProducts
      .filter((p) => !selectedIds.has(p.id))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [allProducts, selectedIds, searchQuery]);

  function addProduct(prod: SelectableDealProduct) {
    if (selectedIds.has(prod.id)) return;
    const defaultPct = 15;
    const dealPrice = Number((prod.price * (1 - defaultPct / 100)).toFixed(2));
    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: prod.id,
        discountType: "percentage",
        discountValue: defaultPct,
        dealPrice,
      },
    ]);
  }

  function removeProduct(productId: string) {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.productId !== productId),
    );
  }

  function updateProductDiscount(
    productId: string,
    discountType: "percentage" | "fixed",
    rawValue: number,
  ) {
    const prod = productMap.get(productId);
    if (!prod) return;

    const val = Number.isFinite(rawValue) ? rawValue : 0;

    setSelectedProducts((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        if (discountType === "percentage") {
          const pct = Math.max(0, Math.min(99, val));
          const dealPrice = Number((prod.price * (1 - pct / 100)).toFixed(2));
          return {
            productId,
            discountType: "percentage",
            discountValue: pct,
            dealPrice,
          };
        } else {
          const dealPrice = Math.max(0, val);
          return {
            productId,
            discountType: "fixed",
            discountValue: dealPrice,
            dealPrice,
          };
        }
      }),
    );
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Banner must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image must be 5 MB or smaller.");
      return;
    }

    setUploadingBanner(true);
    setError("");

    try {
      const supabase = createClient();
      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
      const filePath = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("deal-banners")
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadErr) {
        throw new Error(
          uploadErr.message.includes("Bucket not found")
            ? "Deal banner bucket is not created yet. Run 006_special_deals.sql in Supabase first."
            : uploadErr.message,
        );
      }

      const { data } = supabase.storage
        .from("deal-banners")
        .getPublicUrl(filePath);
      setBannerUrl(data.publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload banner.",
      );
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleSave(targetStatus: "draft" | "scheduled" | "active") {
    setError("");
    const startAt = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endAt = new Date(`${endDate}T${endTime}:00`).toISOString();

    setSaving(true);
    try {
      const res = await saveSpecialDealAction({
        id: initialDeal?.id,
        name,
        description,
        bannerUrl,
        startAt,
        endAt,
        status: targetStatus,
        isFeatured,
        showOnHomepage,
        displayPriority: Number(displayPriority) || 0,
        products: selectedProducts,
      });

      if (!res.ok) {
        setError(res.error ?? "Could not save deal.");
        return;
      }

      router.push("/admin/special-deals");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/special-deals"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#2563EB]"
      >
        <ArrowLeft size={15} /> Back to Special Deals
      </Link>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-[#DC2626]">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Campaign Details + Product Selection */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Deal Details */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Campaign Information
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Deal Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Electronics Weekend Sale"
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exclusive discounts on selected products..."
                  className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </section>

          {/* 2. Banner Upload */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Promotional Banner
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Optional wide banner displayed on the Special Deals page.
            </p>

            {bannerUrl ? (
              <div className="mt-4 space-y-3">
                <div className="relative aspect-[16/5] w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                  <Image
                    src={bannerUrl}
                    alt="Deal banner preview"
                    fill
                    sizes="800px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs font-bold text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB]">
                    Replace Banner
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setBannerUrl(null)}
                    className="rounded-xl border border-red-200 px-3.5 py-2 text-xs font-bold text-[#DC2626] hover:bg-red-50"
                  >
                    Remove Banner
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-6 py-10 text-center transition hover:border-[#2563EB] hover:bg-[#EFF6FF]/40">
                {uploadingBanner ? (
                  <Loader2 size={24} className="animate-spin text-[#2563EB]" />
                ) : (
                  <ImagePlus size={26} className="text-[#2563EB]" />
                )}
                <span className="mt-2 text-xs font-bold text-[#0F172A]">
                  {uploadingBanner ? "Uploading banner..." : "Upload Banner Image"}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  JPG, PNG, or WebP · Max 5 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="hidden"
                />
              </label>
            )}
          </section>

          {/* 3. Product Selection & Discounts */}
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Products &amp; Discounts ({selectedProducts.length} selected)
            </h2>

            {/* Search existing products */}
            <div className="relative mt-4">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search existing products by name or SKU..."
                className="w-full rounded-xl border border-[#E2E8F0] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Catalog Picker List */}
            {filteredCatalog.length > 0 && (
              <div className="mt-3 max-h-56 divide-y divide-[#E2E8F0] overflow-y-auto rounded-xl border border-[#E2E8F0]">
                {filteredCatalog.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-[#F8FAFC]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                        {prod.imageUrl ? (
                          <Image
                            src={prod.imageUrl}
                            alt={prod.name}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#0F172A]">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {prod.sku ? `SKU: ${prod.sku} · ` : ""}
                          {formatPrice(prod.price)} · Stock: {prod.stock_quantity}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProduct(prod)}
                      className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-[#EFF6FF] px-3 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-[#2563EB] hover:text-white"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Deal Products */}
            {selectedProducts.length > 0 && (
              <div className="mt-5 space-y-3">
                {selectedProducts.map((item) => {
                  const prod = productMap.get(item.productId);
                  if (!prod) return null;
                  const savings = Math.max(0, prod.price - item.dealPrice);
                  const calcPct =
                    prod.price > 0
                      ? Math.round(((prod.price - item.dealPrice) / prod.price) * 100)
                      : 0;
                  const invalid =
                    item.dealPrice <= 0 || item.dealPrice >= prod.price;

                  return (
                    <div
                      key={item.productId}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                            {prod.imageUrl ? (
                              <Image
                                src={prod.imageUrl}
                                alt={prod.name}
                                fill
                                sizes="44px"
                                className="object-contain p-0.5"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0F172A]">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Regular Price: {formatPrice(prod.price)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(item.productId)}
                          aria-label="Remove product"
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-[#DC2626]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                            Discount Type
                          </label>
                          <select
                            value={item.discountType}
                            onChange={(e) =>
                              updateProductDiscount(
                                item.productId,
                                e.target.value as "percentage" | "fixed",
                                e.target.value === "percentage"
                                  ? Math.max(1, calcPct)
                                  : item.dealPrice,
                              )
                            }
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-[#2563EB]"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Deal Price (Rs.)</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                            {item.discountType === "percentage"
                              ? "Discount (%)"
                              : "Deal Price (Rs.)"}
                          </label>
                          <input
                            type="number"
                            min={1}
                            step="0.01"
                            value={
                              item.discountType === "percentage"
                                ? item.discountValue
                                : item.dealPrice
                            }
                            onChange={(e) =>
                              updateProductDiscount(
                                item.productId,
                                item.discountType,
                                Number(e.target.value),
                              )
                            }
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        <div className="flex flex-col justify-center rounded-lg bg-white px-3 py-1.5 text-xs">
                          <span className="font-bold text-[#2563EB]">
                            Deal: {formatPrice(item.dealPrice)} ({calcPct}% OFF)
                          </span>
                          <span className="text-[11px] text-[#16A34A]">
                            Savings: {formatPrice(savings)}
                          </span>
                        </div>
                      </div>

                      {invalid && (
                        <p className="mt-2 text-[11px] font-semibold text-[#DC2626]">
                          Deal price must be greater than 0 and lower than{" "}
                          {formatPrice(prod.price)}.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: Schedule, Featured Settings & Actions */}
        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Schedule
            </h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-xs outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-xs outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-xs outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] px-2.5 py-2 text-xs outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-[#0F172A]">
              Featured Settings
            </h2>
            <div className="mt-4 space-y-3.5 text-sm">
              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="font-semibold text-[#0F172A]">
                  Featured Campaign
                </span>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#2563EB]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-2">
                <span className="font-semibold text-[#0F172A]">
                  Show on Homepage
                </span>
                <input
                  type="checkbox"
                  checked={showOnHomepage}
                  onChange={(e) => setShowOnHomepage(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#2563EB]"
                />
              </label>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Display Priority
                </label>
                <input
                  type="number"
                  value={displayPriority}
                  onChange={(e) => setDisplayPriority(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Higher priority wins if a product is in multiple active deals.
                </p>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="space-y-2.5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("active")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Publish Deal
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("scheduled")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#1E293B] disabled:opacity-60"
            >
              Schedule Deal
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave("draft")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-bold text-[#0F172A] transition hover:bg-[#F8FAFC] disabled:opacity-60"
            >
              Save Draft
            </button>

            <Link
              href="/admin/special-deals"
              className="flex w-full items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-[#DC2626]"
            >
              <X size={13} /> Cancel
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
