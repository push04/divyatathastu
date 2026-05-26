'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Star, Globe } from 'lucide-react'

const TRUST_BADGES = [
  { Icon: ShieldCheck, label: 'Expert Validated', sub: 'Vedic scholars reviewed' },
  { Icon: Lock, label: 'Privacy First', sub: 'No data sharing or ads' },
  { Icon: Star, label: 'Instant Reports', sub: 'Generated on demand' },
  { Icon: Globe, label: 'NRI Accessible', sub: 'Works worldwide' },
]

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

export default function InMediaSection() {
  return (
    <section className="section-padding bg-[var(--warm-sand)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* ── Left column ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2
              className="text-[var(--indigo-deep)] mb-4 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 600 }}
            >
              Trusted by families across India
            </h2>
            <p
              className="text-sm leading-relaxed mb-8"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--indigo-deep)', opacity: 0.6 }}
            >
              MahaTathastu is independently expert-validated, privacy-first, and built on genuine Vedic scholarship.
            </p>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9858784784'}?text=Hi%2C%20I%20have%20a%20question%20about%20MahaTathastu`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 text-white font-semibold text-sm px-5 py-3 transition-opacity hover:opacity-90"
              style={{
                background: '#25D366',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <WhatsAppIcon />
              Message us on WhatsApp
            </a>

            <p
              className="mt-3 text-[13px]"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--indigo-deep)', opacity: 0.4 }}
            >
              +91 9858784784 · support@mahatathastu.com
            </p>
          </motion.div>

          {/* ── Right column — 2×2 trust badge grid ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {TRUST_BADGES.map(({ Icon, label, sub }) => (
              <div
                key={label}
                className="bg-white border border-[var(--outline-variant)]/40 rounded-xl p-4 flex items-start gap-3"
              >
                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                  <Icon size={28} color="var(--terracotta)" strokeWidth={1.5} />
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-sm text-[var(--indigo-deep)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                  <p className="text-xs text-[var(--indigo-deep)]/50 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
