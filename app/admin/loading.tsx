export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-64 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
