import SudarshanLoader from '@/components/SudarshanLoader'

export default function ReportLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <SudarshanLoader size="lg" />
      <p className="text-sm text-[var(--warm-charcoal)]/50 font-medium">Loading your report…</p>
    </div>
  )
}
