'use client'

import { useState } from 'react'
import Link from 'next/link'

const DEMO_PURCHASES = [
  { id: '1', title: 'Complete Guide to Vedic Astrology', author: 'Dr. Rajesh Sharma', pages: 312, cover_emoji: 'brightness_7', purchased_at: '2025-09-10', progress: 68 },
  { id: '3', title: 'Vastu Shastra for Modern Homes', author: 'Ar. Priya Vastu', pages: 248, cover_emoji: 'house', purchased_at: '2025-09-22', progress: 24 },
  { id: '8', title: 'Sanatan Dharma: Festivals & Rituals', author: 'Acharya Deepak Shastri', pages: 88, cover_emoji: 'local_fire_department', purchased_at: '2025-08-15', progress: 100 },
]

export default function DashboardEbooksPage() {
  const [active, setActive] = useState(DEMO_PURCHASES[0].id)
  const reading = DEMO_PURCHASES.find(b => b.id === active)

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">My Ebook Library</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60">{DEMO_PURCHASES.length} books in your collection</p>
        </div>
        <Link href="/ebooks" className="btn-divine text-sm">Browse More Ebooks</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book list */}
        <div className="lg:col-span-1 space-y-3">
          {DEMO_PURCHASES.map(book => (
            <button
              key={book.id}
              onClick={() => setActive(book.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${active === book.id ? 'border-[var(--indigo-deep)] bg-[var(--indigo-deep)]/5' : 'border-[var(--warm-sand)] bg-white hover:border-[var(--indigo-deep)]/40'}`}
            >
              <div className="flex gap-3 items-start">
                <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-[var(--saffron)] to-[var(--indigo-deep)] flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{book.cover_emoji}</span></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--indigo-deep)] leading-snug line-clamp-2">{book.title}</p>
                  <p className="text-xs text-[var(--warm-charcoal)]/50 mt-0.5">{book.author}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-[var(--warm-charcoal)]/50">Progress</span>
                      <span className={book.progress === 100 ? 'text-emerald-600 font-bold' : 'text-[var(--indigo-deep)] font-bold'}>{book.progress}%</span>
                    </div>
                    <div className="bg-[var(--warm-sand)] rounded-full h-1.5">
                      <div className={`h-full rounded-full ${book.progress === 100 ? 'bg-emerald-500' : 'bg-[var(--terracotta)]'}`} style={{ width: `${book.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Reader panel */}
        {reading && (
          <div className="lg:col-span-2 card-divine p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-[var(--saffron)] to-[var(--indigo-deep)] flex items-center justify-center shadow-lg"><span className="material-symbols-outlined text-[36px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{reading.cover_emoji}</span></div>
              <div>
                <h2 className="text-xl font-bold text-[var(--indigo-deep)]">{reading.title}</h2>
                <p className="text-sm text-[var(--warm-charcoal)]/60">by {reading.author}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/40 mt-1">Purchased {new Date(reading.purchased_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-[var(--kutch-white)] rounded-lg">
                <p className="text-2xl font-bold text-[var(--indigo-deep)]">{reading.pages}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">Total Pages</p>
              </div>
              <div className="text-center p-3 bg-[var(--kutch-white)] rounded-lg">
                <p className="text-2xl font-bold text-[var(--terracotta)]">{Math.round(reading.pages * reading.progress / 100)}</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">Pages Read</p>
              </div>
              <div className="text-center p-3 bg-[var(--kutch-white)] rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{reading.progress}%</p>
                <p className="text-xs text-[var(--warm-charcoal)]/50">Complete</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="btn-divine w-full py-3">
                <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>{reading.progress === 100 ? 'Read Again' : reading.progress === 0 ? 'Start Reading' : 'Continue Reading'}</span>
              </button>
              <button className="w-full py-3 rounded-xl border border-[var(--warm-sand)] text-sm font-medium text-[var(--indigo-deep)] hover:bg-[var(--kutch-white)] transition-colors inline-flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span> Download PDF
              </button>
            </div>

            {reading.progress === 100 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <p className="text-emerald-700 font-semibold text-sm inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span> You've completed this book!</p>
                <button className="text-xs text-emerald-600 underline mt-1">Download Certificate of Completion</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
