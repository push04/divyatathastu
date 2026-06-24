export default function ReportsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-40 mb-2" />
      <div className="h-4 bg-[var(--warm-sand)] rounded w-72 mb-6" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-20" />
        ))}
      </div>
    </div>
  )
}
