'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--kutch-white)] px-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="material-symbols-outlined text-[72px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)] mb-2">Something Went Wrong</h1>
        <p className="text-[var(--warm-charcoal)]/60 mb-6 text-sm">
          The cosmic energies encountered a disturbance. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="btn-divine px-6 py-3">Try Again</button>
          <Link href="/" className="px-6 py-3 rounded-xl border border-[var(--indigo-deep)] text-[var(--indigo-deep)] font-medium hover:bg-[var(--indigo-deep)] hover:text-white transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
