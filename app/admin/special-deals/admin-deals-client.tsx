"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit,
  Eye,
  Flame,
  Pause,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import {
  deleteDealAction,
  duplicateDealAction,
  togglePauseDealAction,
} from "@/app/admin/special-deals/actions";
import type { DealCampaignStatus } from "@/lib/deals";
import { cn } from "@/lib/utils";

export type AdminDealRow = {
  id: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  productCount: number;
  discountSummary: string;
  startAt: string;
  endAt: string;
  rawStatus: DealCampaignStatus;
  effectiveStatus: DealCampaignStatus;
  isFeatured: boolean;
  showOnHomepage: boolean;
  displayPriority: number;
};

const PAGE_SIZE = 10;

export default function AdminDealsClient({
  deals,
}: {
  deals: AdminDealRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | DealCampaignStatus
  >("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d">("all");
  const [referenceNow] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const total = deals.length;
    const active = deals.filter((d) => d.effectiveStatus === "active").length;
    const scheduled = deals.filter(
      (d) => d.effectiveStatus === "scheduled",
    ).length;
    const expired = deals.filter((d) => d.effectiveStatus === "expired").length;
    const paused = deals.filter((d) => d.effectiveStatus === "paused").length;
    const productsOnOffer = deals
      .filter((d) => d.effectiveStatus === "active")
      .reduce((sum, d) => sum + d.productCount, 0);
    return { total, active, scheduled, expired, paused, productsOnOffer };
  }, [deals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && d.effectiveStatus !== statusFilter)
        return false;
      if (dateFilter !== "all") {
        const days = dateFilter === "7d" ? 7 : 30;
        const diff = referenceNow - new Date(d.startAt).getTime();
        if (Math.abs(diff) > days * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [deals, search, statusFilter, dateFilter, referenceNow]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Action failed.");
        return;
      }
      router.refresh();
    });
  }

  function statusBadgeClass(status: DealCampaignStatus) {
    switch (status) {
      case "active":
        return "bg-green-50 text-[#16A34A] border-green-200";
      case "scheduled":
        return "bg-[#EFF6FF] text-[#2563EB] border-blue-200";
      case "paused":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "expired":
        return "bg-red-50 text-[#DC2626] border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            Promotions
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
            Special Deals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, schedule, and manage promotional campaigns across ZicZo Mart.
          </p>
        </div>

        <Link
          href="/admin/special-deals/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1D4ED8]"
        >
          <Plus size={16} /> Create Special Deal
        </Link>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Deals", value: stats.total, color: "text-[#0F172A]" },
          { label: "Active Deals", value: stats.active, color: "text-[#16A34A]" },
          {
            label: "Scheduled Deals",
            value: stats.scheduled,
            color: "text-[#2563EB]",
          },
          {
            label: "Expired Deals",
            value: stats.expired,
            color: "text-[#DC2626]",
          },
          {
            label: "Paused Deals",
            value: stats.paused,
            color: "text-amber-600",
          },
          {
            label: "Products on Offer",
            value: stats.productsOnOffer,
            color: "text-[#0F172A]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {card.label}
            </p>
            <p className={cn("mt-1.5 text-2xl font-extrabold", card.color)}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search campaigns..."
            className="w-full rounded-xl border border-[#E2E8F0] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as typeof dateFilter);
              setPage(1);
            }}
            aria-label="Filter by date"
            className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Dates</option>
            <option value="7d">Within 7 Days</option>
            <option value="30d">Within 30 Days</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-[#DC2626]">
          {error}
        </div>
      )}

      {/* Deals Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Flame size={32} className="text-slate-300" />
            <p className="mt-3 text-sm font-bold text-[#0F172A]">
              No promotional campaigns found
            </p>
            <Link
              href="/admin/special-deals/new"
              className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white"
            >
              Create Your First Deal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Deal Name</th>
                  <th className="px-4 py-3.5">Banner</th>
                  <th className="px-4 py-3.5">Products</th>
                  <th className="px-4 py-3.5">Discount</th>
                  <th className="px-4 py-3.5">Start Date</th>
                  <th className="px-4 py-3.5">End Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Featured</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {paginated.map((deal) => (
                  <tr key={deal.id} className="hover:bg-[#F8FAFC]/80">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#0F172A]">{deal.name}</p>
                      {deal.showOnHomepage && (
                        <span className="mt-0.5 inline-block rounded bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#2563EB]">
                          Homepage
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {deal.bannerUrl ? (
                        <div className="relative h-9 w-16 overflow-hidden rounded-lg border border-[#E2E8F0]">
                          <Image
                            src={deal.bannerUrl}
                            alt={deal.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#0F172A]">
                      {deal.productCount}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-[#2563EB]">
                      {deal.discountSummary}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                      {new Date(deal.startAt).toLocaleString("en-LK", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                      {new Date(deal.endAt).toLocaleString("en-LK", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize",
                          statusBadgeClass(deal.effectiveStatus),
                        )}
                      >
                        {deal.effectiveStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {deal.isFeatured ? (
                        <Star
                          size={15}
                          className="fill-amber-400 text-amber-400"
                        />
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {deal.effectiveStatus === "active" && (
                          <Link
                            href="/products?deals=true"
                            target="_blank"
                            title="View on storefront"
                            className="rounded-lg border border-[#E2E8F0] p-1.5 text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB]"
                          >
                            <Eye size={14} />
                          </Link>
                        )}
                        <Link
                          href={`/admin/special-deals/${deal.id}/edit`}
                          title="Edit deal"
                          className="rounded-lg border border-[#E2E8F0] p-1.5 text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB]"
                        >
                          <Edit size={14} />
                        </Link>
                        {deal.effectiveStatus === "paused" ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              runAction(() =>
                                togglePauseDealAction(deal.id, "resume"),
                              )
                            }
                            title="Resume deal"
                            className="rounded-lg border border-green-200 bg-green-50 p-1.5 text-[#16A34A] hover:bg-green-100"
                          >
                            <Play size={14} />
                          </button>
                        ) : (
                          deal.effectiveStatus !== "expired" &&
                          deal.effectiveStatus !== "draft" && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                runAction(() =>
                                  togglePauseDealAction(deal.id, "pause"),
                                )
                              }
                              title="Pause deal"
                              className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"
                            >
                              <Pause size={14} />
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => duplicateDealAction(deal.id))
                          }
                          title="Duplicate deal"
                          className="rounded-lg border border-[#E2E8F0] p-1.5 text-slate-600 hover:border-[#2563EB] hover:text-[#2563EB]"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => deleteDealAction(deal.id))
                          }
                          title="Delete deal"
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-[#DC2626] hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
