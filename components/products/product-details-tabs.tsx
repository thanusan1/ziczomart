"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductSpecRow = {
  label: string;
  value: string;
};

interface ProductDetailsTabsProps {
  description: string | null;
  specifications: ProductSpecRow[];
  reviewCount: number;
  activeTab?: "description" | "specifications";
}

export default function ProductDetailsTabs({
  description,
  specifications,
  reviewCount,
  activeTab: initialTab = "description",
}: ProductDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "specifications">(
    initialTab,
  );
  const [expanded, setExpanded] = useState(false);

  const trimmedDescription = description?.trim() ?? "";
  const isLongDescription = trimmedDescription.length > 340;
  const displayedDescription =
    isLongDescription && !expanded
      ? `${trimmedDescription.slice(0, 340).trimEnd()}…`
      : trimmedDescription;

  function scrollToReviews() {
    const el = document.getElementById("reviews");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToRelated() {
    const el = document.getElementById("related-products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
      {/* Tab Headers */}
      <div
        role="tablist"
        aria-label="Product information tabs"
        className="flex flex-wrap items-center gap-1 border-b border-[#E2E8F0] px-4 pt-3 sm:px-6"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "description"}
          onClick={() => setActiveTab("description")}
          className={cn(
            "relative border-b-2 px-3 py-3 text-sm font-semibold transition",
            activeTab === "description"
              ? "border-[#2563EB] text-[#2563EB]"
              : "border-transparent text-slate-500 hover:text-[#0F172A]",
          )}
        >
          Description
        </button>

        {specifications.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "specifications"}
            onClick={() => setActiveTab("specifications")}
            className={cn(
              "relative border-b-2 px-3 py-3 text-sm font-semibold transition",
              activeTab === "specifications"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-slate-500 hover:text-[#0F172A]",
            )}
          >
            Specifications
          </button>
        )}

        <button
          type="button"
          onClick={scrollToReviews}
          className="border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 transition hover:text-[#0F172A]"
        >
          Reviews ({reviewCount})
        </button>

        <button
          type="button"
          onClick={scrollToRelated}
          className="hidden border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 transition hover:text-[#0F172A] sm:inline-flex"
        >
          Related Products
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6">
        {activeTab === "description" ? (
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">
              About This Product
            </h2>
            {trimmedDescription ? (
              <div className="mt-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {displayedDescription}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    {expanded ? (
                      <>
                        Read Less <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No additional description provided for this product.
              </p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-base font-bold text-[#0F172A]">
              Product Specifications
            </h2>
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-[#E2E8F0]">
                  {specifications.map((spec, idx) => (
                    <tr
                      key={spec.label}
                      className={idx % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white"}
                    >
                      <th
                        scope="row"
                        className="w-2/5 px-4 py-3 font-semibold text-[#0F172A]"
                      >
                        {spec.label}
                      </th>
                      <td className="px-4 py-3 text-slate-600">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
