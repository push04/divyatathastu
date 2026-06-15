import SudarshanLoader from '@/components/SudarshanLoader'

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--kutch-white)]">
      <div className="flex flex-col items-center gap-4">
        <SudarshanLoader size="lg" />
        <div className="flex gap-1 justify-center">
          <span className="w-2 h-2 bg-[var(--terracotta)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[var(--saffron)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[var(--indigo-deep)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
