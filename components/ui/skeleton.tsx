import { cn } from "@/lib/utils";

/* ── Base Skeleton ───────────────────────────────────────── */
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gray-200",
        className,
      )}
    />
  );
}

/* ── Product Card Skeleton ───────────────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-none" />
      {/* Content */}
      <div className="p-4">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="mt-2.5 h-4 w-full rounded" />
        <Skeleton className="mt-1.5 h-4 w-3/4 rounded" />
        <Skeleton className="mt-3 h-5 w-24 rounded" />
        <Skeleton className="mt-4 h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

/* ── Category Card Skeleton ──────────────────────────────── */
export function CategoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}

/* ── Product Grid Skeleton ───────────────────────────────── */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Page Header Skeleton ────────────────────────────────── */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-10">
      <Skeleton className="h-3 w-28 rounded" />
      <Skeleton className="mt-3 h-8 w-64 rounded" />
      <Skeleton className="mt-2.5 h-4 w-80 rounded" />
    </div>
  );
}

/* ── Table Row Skeleton ──────────────────────────────────── */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton className="h-4 w-full max-w-32 rounded" />
        </td>
      ))}
    </tr>
  );
}
