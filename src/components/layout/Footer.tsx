import Link from 'next/link'

const footerLinks = {
  Services: [
    { href: '/services/astrology-report', label: 'Astrology Report' },
    { href: '/services/numerology-report', label: 'Numerology Report' },
    { href: '/services/shakti-chakra-report', label: 'Shakti Chakra' },
    { href: '/services/prakriti-report', label: 'Prakriti Report' },
    { href: '/services/full-tathastu-bundle', label: 'Full Tathastu Bundle' },
  ],
  Explore: [
    { href: '/mandir-finder', label: 'Mandir Finder' },
    { href: '/pilgrimage', label: 'Pilgrimage Planner' },
    { href: '/panchang', label: 'Panchang Today' },
    { href: '/ebooks', label: 'Ebooks' },
    { href: '/events', label: 'Events' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/in-media', label: 'In Media' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[var(--kutch-white)] border-t border-[var(--outline-variant)]/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-9 h-9 rounded-full gradient-saffron flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform">ॐ</div>
              <span className="font-bold text-xl text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>DivyaTathastu</span>
            </Link>
            <p className="text-[var(--indigo-deep)]/55 text-sm leading-relaxed mb-6 max-w-xs">
              India's first comprehensive holistic life platform combining Vedic astrology, numerology, psychology, Vastu, chakra science, and Ayurveda.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-[var(--indigo-deep)]/50">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9858784784'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[var(--terracotta)] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp: +91 9858784784
              </a>
              <a
                href="mailto:support@divyatathastu.com"
                className="flex items-center gap-2 hover:text-[var(--terracotta)] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                support@divyatathastu.com
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3
                className="text-[10px] font-semibold text-[var(--terracotta)] mb-4 tracking-widest uppercase"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[var(--indigo-deep)]/50 hover:text-[var(--indigo-deep)] text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-[var(--outline-variant)]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--indigo-deep)]/40 text-sm">© 2025 DivyaTathastu · Sacred Geometry in Digital Form.</p>
          <p className="text-[var(--indigo-deep)]/30 text-sm flex items-center gap-1">Made with <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> for Indian families worldwide</p>
        </div>
      </div>
    </footer>
  )
}
