'use client'

import Link from 'next/link'
import SudarshanLoader from '@/components/SudarshanLoader'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import type { DictKey } from '@/lib/i18n/dictionaries'

import Icon from '@/components/ui/Icon'
const footerLinks: { titleKey: DictKey; links: { href: string; label: string }[] }[] = [
  { titleKey: 'nav.services', links: [
    { href: '/services/astrology-report', label: 'Astrology Report' },
    { href: '/services/numerology-report', label: 'Numerology Report' },
    { href: '/services/shakti-chakra-report', label: 'Shakti Chakra' },
    { href: '/services/prakriti-report', label: 'Prakriti Report' },
    { href: '/services/full-tathastu-bundle', label: 'Full Tathastu Bundle' },
  ] },
  { titleKey: 'footer.explore', links: [
    { href: '/mandir-finder', label: 'Mandir Finder' },
    { href: '/pilgrimage', label: 'Pilgrimage Planner' },
    { href: '/panchang', label: 'Panchang Today' },
    { href: '/ardra-jalam/nakshatra-jal', label: 'Nakshatra Jal' },
    { href: '/ardra-jalam/crystal-manifestation', label: 'Crystal Manifestation' },
    { href: '/ebooks', label: 'Ebooks' },
    { href: '/events', label: 'Events' },
  ] },
  { titleKey: 'footer.company', links: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/newsletter', label: 'Newsletter' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ] },
]

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-[var(--kutch-white)] border-t border-[var(--outline-variant)]/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <div className="w-9 h-9 flex-shrink-0 group-hover:scale-110 transition-transform"><SudarshanLoader px={36} /></div>
              <span className="font-bold text-xl text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>MahaTathastu</span>
            </Link>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 max-w-xs">
              India's first comprehensive holistic life platform combining Vedic astrology, numerology, psychology, Vastu, chakra science, and Ayurveda.
            </p>
            <div className="flex flex-col gap-2.5 text-sm text-[var(--text-muted)]">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '9274815269'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[var(--terracotta)] transition-colors"
              >
                <Icon name="chat" size={16} />
                WhatsApp: +91 92748 15269 / +91 98587 84784
              </a>
              <a
                href="mailto:support@mahatathastu.com"
                className="flex items-center gap-2 hover:text-[var(--terracotta)] transition-colors"
              >
                <Icon name="mail" size={16} />
                support@mahatathastu.com
              </a>
              <div className="flex items-start gap-2 mt-2 text-[var(--text-secondary)]">
                <Icon name="location_on" size={16} className="mt-0.5" />
                <span>
                  FF-108, SIDDHARTH MAGNUM PLUS,<br />
                  TARSALI, VADODARA, GUJARAT
                </span>
              </div>
            {/* Social media */}
            <div className="flex items-center gap-3 mt-5">
              <a href="https://www.instagram.com/mahatathastu" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }} title="Instagram">
                <Icon name="photo_camera" size={15} className="text-white" />
              </a>
              <a href="https://www.youtube.com/@mahatathastu" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#FF0000' }} title="YouTube">
                <Icon name="play_circle" size={15} className="text-white" />
              </a>
              <a href="https://www.facebook.com/mahatathastu" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#1877F2' }} title="Facebook">
                <Icon name="groups" size={15} className="text-white" />
              </a>
              <a href="https://wa.me/919274815269" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#25D366' }} title="WhatsApp">
                <Icon name="chat" size={15} className="text-white" />
              </a>
            </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map(({ titleKey, links }) => (
            <div key={titleKey}>
              <h3
                className="text-[13px] font-semibold text-[var(--terracotta)] mb-4 tracking-widest uppercase"
                style={{ fontFamily: "var(--font-label)" }}
              >
                {t(titleKey)}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[var(--text-muted)] hover:text-[var(--indigo-deep)] text-sm transition-colors"
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
          <p className="text-[var(--text-muted)] text-sm">© 2025 MahaTathastu · Sacred Geometry in Digital Form.</p>
          <p className="text-[var(--text-muted)] text-sm flex items-center gap-1">Made with <Icon name="favorite" size={14} /> for Indian families worldwide</p>
        </div>
      </div>
    </footer>
  )
}
