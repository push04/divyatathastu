export default function AdminLoading() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-[var(--warm-sand)] rounded-xl" />)}
      </div>
      <div className="h-80 bg-[var(--warm-sand)] rounded-xl" />
    </div>
  )
}
