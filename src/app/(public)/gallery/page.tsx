import type { Metadata } from 'next'

import Icon from '@/components/ui/Icon'
import GalleryClient from './GalleryClient'

export const metadata: Metadata = {
  title: 'Gallery | MahaTathastu - Moments, Temples & Ceremonies',
  description: 'Photographs from MahaTathastu ceremonies, temple visits, pilgrimages and community gatherings.',
  alternates: { canonical: '/gallery' },
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen">
      <section className="page-banner">
        <div className="page-banner-inner max-w-2xl mx-auto">
          <p className="t-eyebrow t-eyebrow-dark mb-4 inline-block">Media &amp; Gallery</p>
          <h1 className="t-display-2 text-[var(--text-on-dark)] mb-4">Moments in Devotion</h1>
          <div className="ornate-divider">
            <Icon name="yantra" size={16} className="text-[var(--gold-300)]" />
          </div>
          <p className="text-[var(--text-on-dark-secondary)] text-lg leading-relaxed">
            Ceremonies, temples, pilgrimages and the people who make them
          </p>
        </div>
      </section>

      <section className="py-12 px-6 bg-[var(--kutch-white)]">
        <div className="max-w-6xl mx-auto">
          <GalleryClient />
        </div>
      </section>
    </div>
  )
}
