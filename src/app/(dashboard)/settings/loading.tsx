export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-32 mb-2" />
      <div className="h-4 bg-[var(--warm-sand)] rounded w-56 mb-8" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-[var(--warm-sand)] h-28" />
        ))}
      </div>
    </div>
  )
}
