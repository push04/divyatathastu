export default function ShopLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-40 mb-2" />
      <div className="h-4 bg-[var(--warm-sand)] rounded w-64 mb-6" />
      <div className="flex gap-2 mb-6">
        {[...Array(6)].map((_, i) => <div key={i} className="h-9 w-24 bg-[var(--warm-sand)] rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-64" />
        ))}
      </div>
    </div>
  )
}
