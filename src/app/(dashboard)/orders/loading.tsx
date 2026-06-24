export default function OrdersLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-36 mb-2" />
      <div className="h-4 bg-[var(--warm-sand)] rounded w-56 mb-6" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-20" />
        ))}
      </div>
    </div>
  )
}
