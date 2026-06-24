export default function AiGuideLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen animate-pulse">
      <div className="p-4 border-b border-[var(--warm-sand)]">
        <div className="h-8 bg-[var(--warm-sand)] rounded-xl w-56 mb-1" />
        <div className="h-4 bg-[var(--warm-sand)] rounded w-80" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <div className="w-9 h-9 rounded-full bg-[var(--warm-sand)] flex-shrink-0" />
            <div className={`rounded-2xl bg-[var(--warm-sand)] h-16 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[var(--warm-sand)]">
        <div className="h-14 bg-[var(--warm-sand)] rounded-2xl" />
      </div>
    </div>
  )
}
