import { ProductGridSkeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl animate-pulse px-4 pt-6 sm:px-6">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="mt-4 h-40 w-full rounded-[20px] bg-slate-200/80" />

        <div className="mt-8 flex items-start gap-6">
          <div className="hidden w-[260px] shrink-0 rounded-2xl border border-slate-200 bg-white p-5 lg:block">
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-7 rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
