export default function SubcategoriesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="h-4 w-80 rounded bg-slate-200" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-3 w-28 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-16 rounded-2xl border border-slate-200 bg-white" />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
