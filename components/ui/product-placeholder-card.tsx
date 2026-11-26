import { Package } from "lucide-react";

interface ProductPlaceholderCardProps {
  variant?: "deal" | "compact";
  message?: string;
}

export default function ProductPlaceholderCard({
  variant = "compact",
  message = "Coming Soon",
}: ProductPlaceholderCardProps) {
  if (variant === "compact") {
    return (
      <div
        aria-hidden="true"
        className="flex h-full flex-col overflow-hidden rounded-xl border border-dashed border-gray-200 bg-white"
      >
        {/* Subtle image placeholder matching compact aspect-square */}
        <div className="flex aspect-square w-full items-center justify-center bg-gray-50/90">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-gray-100">
            <Package size={20} className="text-gray-300" />
          </div>
        </div>

        {/* Clean honest coming soon label */}
        <div className="flex flex-1 flex-col justify-center p-3 text-center">
          <p className="text-xs font-semibold text-gray-400">{message}</p>
          <p className="mt-1 text-[11px] text-gray-300">
            New Products Coming Soon
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-dashed border-gray-200 bg-white"
    >
      {/* Subtle image placeholder matching deal card */}
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-50/90 sm:aspect-square">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-gray-100">
          <Package size={24} className="text-gray-300" />
        </div>
      </div>

      {/* Matching body height */}
      <div className="flex flex-1 flex-col justify-between p-3.5 text-center">
        <div>
          <p className="text-sm font-semibold text-gray-400">{message}</p>
          <p className="mt-1 text-xs text-gray-300">
            New Products Coming Soon
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 py-2 text-xs font-medium text-gray-400">
          Stay Tuned
        </div>
      </div>
    </div>
  );
}
