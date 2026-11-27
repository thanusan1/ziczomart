export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-28 w-full animate-pulse border-b border-[#E2E8F0] bg-white" />
      <div className="border-b border-[#E2E8F0] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto h-4 w-64 max-w-7xl animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="aspect-square w-full animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-20 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="lg:col-span-3">
            <div className="h-72 w-full animate-pulse rounded-2xl border border-[#E2E8F0] bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
