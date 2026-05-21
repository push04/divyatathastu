export default function PublicLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-56 bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)]" />
      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-[var(--warm-sand)] rounded-xl" />)}
      </div>
    </div>
  )
}
