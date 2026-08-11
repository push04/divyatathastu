import Icon from '@/components/ui/Icon'
﻿import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--kutch-white)] px-6">
      <div className="text-center max-w-md">
        <Icon name="self_improvement" size={80} className="text-[var(--text-muted)] mb-6 block" />
        <h1 className="text-6xl font-bold text-[var(--indigo-deep)] mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--indigo-deep)] mb-3">This Path Does Not Exist</h2>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          Like the cosmic void before creation, this page is yet to manifest. Perhaps the universe is guiding you elsewhere.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn-divine px-6 py-3">Return Home</Link>
          <Link href="/dashboard" className="px-6 py-3 rounded-xl border border-[var(--indigo-deep)] text-[var(--indigo-deep)] font-medium hover:bg-[var(--indigo-deep)] hover:text-white transition-colors">
            My Dashboard
          </Link>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-8">"The soul which is eternal never goes astray" - Bhagavad Gita</p>
      </div>
    </div>
  )
}
