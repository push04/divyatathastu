export default function PanchangLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-44 mb-2" />
      <div className="h-4 bg-[var(--warm-sand)] rounded w-72 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-[var(--warm-sand)] h-96" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-20" />
          ))}
        </div>
      </div>
    </div>
  )
}
