export default function FamilyLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-48 mb-2" />
          <div className="h-4 bg-[var(--warm-sand)] rounded w-64" />
        </div>
        <div className="h-10 w-32 bg-[var(--warm-sand)] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-40" />
        ))}
      </div>
    </div>
  )
}
