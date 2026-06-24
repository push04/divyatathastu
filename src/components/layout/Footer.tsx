import Link from 'next/link'
import SudarshanLoader from '@/components/SudarshanLoader'

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
    { href: '/contact', label: 'Contact Us' },
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/newsletter', label: 'Newsletter' },
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
              <div className="w-9 h-9 flex-shrink-0 group-hover:scale-110 transition-transform"><SudarshanLoader px={36} /></div>
              <span className="font-bold text-xl text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>MahaTathastu</span>
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
                href="mailto:support@mahatathastu.com"
                className="flex items-center gap-2 hover:text-[var(--terracotta)] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
                support@mahatathastu.com
              </a>
            {/* Social media */}
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.instagram.com/mahatathastu" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} title="Instagram">
                <span className="material-symbols-outlined text-white text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              </a>
              <a href="https://www.youtube.com/@mahatathastu" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#FF0000' }} title="YouTube">
                <span className="material-symbols-outlined text-white text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </a>
              <a href="https://www.facebook.com/mahatathastu" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#1877F2' }} title="Facebook">
                <span className="material-symbols-outlined text-white text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </a>
              <a href="https://wa.me/919858784784" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#25D366' }} title="WhatsApp">
                <span className="material-symbols-outlined text-white text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </a>
            </div>
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
          <p className="text-[var(--indigo-deep)]/40 text-sm">© 2025 MahaTathastu · Sacred Geometry in Digital Form.</p>
          <p className="text-[var(--indigo-deep)]/30 text-sm flex items-center gap-1">Made with <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> for Indian families worldwide</p>
        </div>
      </div>
    </footer>
  )
}
