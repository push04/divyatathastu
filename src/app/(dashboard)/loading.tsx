export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-[var(--warm-sand)] rounded-xl" />)}
      </div>
      <div className="h-64 bg-[var(--warm-sand)] rounded-xl" />
    </div>
  )
}
