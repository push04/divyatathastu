'use client'

import Link from 'next/link'
import { FileText, Star } from 'lucide-react'
import SudarshanLoader from '@/components/SudarshanLoader'

const CAT_BG: Record<string, string> = {
  Spiritual: '#2A1A0E',
  Wellness: '#0E1F1A',
  Astrology: '#0D1229',
  Numerology: '#0D1229',
  Vastu: '#0E1F1A',
}
const CAT_TEXT: Record<string, string> = {
  Spiritual: 'var(--terracotta)',
  Wellness: '#2D6A4F',
  Astrology: 'var(--indigo-deep)',
  Numerology: 'var(--indigo-deep)',
  Vastu: '#2D6A4F',
}

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

function CoverIllustration({ title }: { title: string }) {
  const isMantras = title.includes('108 Mantras')
  const isChakra = title.includes('Chakra')
  const isPanchang = title.includes('Panchang')
  const isRudraksha = title.includes('Rudraksha')

  if (isMantras) {
    const petals = Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI * 2) / 8
      const px = 50 + 32 * Math.sin(a), py = 50 - 32 * Math.cos(a)
      return `M50,50 Q${px + 12 * Math.cos(a + Math.PI / 2)},${py + 12 * Math.sin(a + Math.PI / 2)} ${px},${py}`
    })
    return (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {petals.map((d, i) => <path key={i} d={d} stroke="white" strokeOpacity="0.2" strokeWidth="1.2" />)}
        <circle cx="50" cy="50" r="8" stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none" />
      </svg>
    )
  }
  if (isChakra) {
    const colors = ['rgba(255,80,80,0.35)', 'rgba(255,140,0,0.3)', 'rgba(255,220,0,0.3)', 'rgba(60,200,80,0.3)', 'rgba(60,120,255,0.3)', 'rgba(100,60,200,0.3)', 'rgba(180,60,200,0.3)']
    return (
      <svg width="50" height="170" viewBox="0 0 50 170" fill="none" xmlns="http://www.w3.org/2000/svg">
        {colors.map((c, i) => <circle key={i} cx="25" cy={15 + i * 24} r="9" stroke={c} strokeWidth="1.5" fill="none" />)}
      </svg>
    )
  }
  if (isPanchang) {
    const spokes = Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI * 2) / 12
      return { x1: 50 + 18 * Math.sin(a), y1: 50 - 18 * Math.cos(a), x2: 50 + 38 * Math.sin(a), y2: 50 - 38 * Math.cos(a) }
    })
    return (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="16" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="none" />
        {spokes.map((s, i) => <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="white" strokeOpacity="0.2" strokeWidth="1" />)}
      </svg>
    )
  }
  if (isRudraksha) {
    const beads = Array.from({ length: 7 }, (_, i) => {
      const a = (i * Math.PI) / 6
      return { cx: 50 + 36 * Math.cos(a - Math.PI / 2), cy: 30 + 28 * Math.sin(a - Math.PI / 2) }
    })
    return (
      <svg width="100" height="70" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        {beads.map((b, i) => <circle key={i} cx={b.cx} cy={b.cy} r="9" stroke="#D4A043" strokeOpacity="0.25" strokeWidth="1.2" fill="none" />)}
      </svg>
    )
  }
  return <SudarshanLoader px={64} spin={false} className="opacity-30" />
}

function EbookCover({ book }: { book: any }) {
  const bg = CAT_BG[book.category] || '#0D1229'
  const isFree = book.price === 0 || book.free
  const coverImg = Array.isArray(book.images) && book.images[0]?.url ? book.images[0].url : null
  return (
    <div className="relative overflow-hidden" style={{ aspectRatio: '3/2', background: bg, backgroundImage: NOISE }}>
      {coverImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImg} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <CoverIllustration title={book.title} />
        </div>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center pl-3"
        style={{ height: '28px', background: `${bg}99` }}
      >
        <span className="text-white text-[9px] uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif" }}>
          {book.category}
        </span>
      </div>
      {isFree && (
        <div
          className="absolute top-2 right-2 font-bold text-[9px] px-2 py-0.5 rounded-sm"
          style={{ background: 'var(--saffron)', color: '#0F1628', fontFamily: "'Sora', sans-serif" }}
        >
          FREE
        </div>
      )}
      {book.bestseller && (
        <div
          className="absolute top-2 left-2 font-bold text-[9px] px-2 py-0.5 rounded-sm"
          style={{ background: 'var(--terracotta)', color: 'white', fontFamily: "'Sora', sans-serif" }}
        >
          Bestseller
        </div>
      )}
    </div>
  )
}

export function EbookCard({ book }: { book: any }) {
  const isFree = book.price === 0 || book.free
  const save = book.original_price > 0 ? book.original_price - book.price : 0
  const catTextColor = CAT_TEXT[book.category] || 'var(--indigo-deep)'

  return (
    <div className="flex flex-col overflow-hidden rounded-xl" style={{ background: 'white', border: '1px solid rgba(200,190,180,0.5)' }}>
      <EbookCover book={book} />
      <div className="p-5 flex flex-col flex-1">
        <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: "'Sora', sans-serif", color: catTextColor }}>
          {book.category}
        </span>
        <h3 className="mt-2 font-semibold leading-snug line-clamp-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: 'var(--indigo-deep)' }}>
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(28,30,74,0.45)' }}>
            by {book.author}
          </p>
        )}
        <p className="mt-2 line-clamp-2 flex-1" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(28,30,74,0.55)' }}>
          {book.description}
        </p>
        {(book.pages || book.rating) && (
          <div className="flex items-center gap-3 mt-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(28,30,74,0.45)' }}>
            {book.pages && <span className="flex items-center gap-1"><FileText size={12} />{book.pages} pages</span>}
            {book.rating && <span className="flex items-center gap-1"><Star size={12} color="var(--saffron)" fill="var(--saffron)" />{book.rating}{book.reviews ? ` (${book.reviews.toLocaleString()})` : ''}</span>}
          </div>
        )}
        <div className="mt-4">
          {isFree ? (
            <span className="font-bold text-sm" style={{ fontFamily: "'Sora', sans-serif", color: 'var(--terracotta)' }}>FREE</span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: 'var(--indigo-deep)' }}>&#8377;{book.price.toLocaleString('en-IN')}</span>
              {book.original_price > 0 && <span style={{ fontSize: '13px', color: 'rgba(28,30,74,0.3)', textDecoration: 'line-through' }}>&#8377;{book.original_price.toLocaleString('en-IN')}</span>}
              {save > 0 && <span style={{ fontSize: '11px', color: 'rgba(198,125,83,0.8)', fontFamily: "'DM Sans', sans-serif" }}>Save &#8377;{save}</span>}
            </div>
          )}
        </div>
        <Link
          href="/shop"
          className="mt-3 w-full font-semibold transition-colors text-center block"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            background: 'var(--indigo-deep)',
            color: 'white',
            borderRadius: '8px',
            padding: '10px',
          }}
        >
          {isFree ? 'Download Free' : 'Get This Book'}
        </Link>
      </div>
    </div>
  )
}
