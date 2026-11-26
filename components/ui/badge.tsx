import { cn } from "@/lib/utils";

/* ── Discount / Sale Badge ──────────────────────────────── */
interface DiscountBadgeProps {
  price: number;
  compareAtPrice: number | null | undefined;
  className?: string;
}

export function DiscountBadge({
  price,
  compareAtPrice,
  className,
}: DiscountBadgeProps) {
  if (!compareAtPrice || compareAtPrice <= price) return null;

  const pct = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-red-500 px-2 py-0.5 text-xs font-bold text-white",
        className,
      )}
    >
      -{pct}%
    </span>
  );
}

/* ── Stock Badge ─────────────────────────────────────────── */
interface StockBadgeProps {
  quantity: number;
  className?: string;
}

export function StockBadge({ quantity, className }: StockBadgeProps) {
  if (quantity > 10) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-green-600",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        In Stock
      </span>
    );
  }

  if (quantity > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-amber-600",
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Only {quantity} left
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-red-600",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Out of Stock
    </span>
  );
}

/* ── Order Status Badge ──────────────────────────────────── */
const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  shipped: "bg-purple-50 text-purple-700 border border-purple-200",
  delivered: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  refunded: "bg-gray-50 text-gray-700 border border-gray-200",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: StatusBadgeProps) {
  const styles =
    ORDER_STATUS_STYLES[status.toLowerCase()] ??
    "bg-gray-50 text-gray-700 border border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        styles,
        className,
      )}
    >
      {status}
    </span>
  );
}

/* ── Payment Status Badge ────────────────────────────────── */
const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  paid: "bg-green-50 text-green-700 border border-green-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  refunded: "bg-gray-50 text-gray-700 border border-gray-200",
};

export function PaymentStatusBadge({ status, className }: StatusBadgeProps) {
  const styles =
    PAYMENT_STATUS_STYLES[status.toLowerCase()] ??
    "bg-gray-50 text-gray-700 border border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        styles,
        className,
      )}
    >
      {status}
    </span>
  );
}

/* ── Featured Badge ──────────────────────────────────────── */
export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-orange-500 px-2 py-0.5 text-xs font-bold text-white",
        className,
      )}
    >
      Featured
    </span>
  );
}
