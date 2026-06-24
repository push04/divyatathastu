export default function PujaLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-48 bg-[var(--warm-sand)] rounded-2xl mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-56" />
        ))}
      </div>
    </div>
  )
}
