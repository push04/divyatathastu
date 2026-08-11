'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'
import LanguageSelector from '@/components/i18n/LanguageSelector'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import type { DictKey } from '@/lib/i18n/dictionaries'

import Icon from '@/components/ui/Icon'

/* Labels are dictionary KEYS, not English strings. The sidebar used to hold
   hardcoded English, so switching language left the whole dashboard in
   English and the selector looked broken. */
const navItems: { href: string; labelKey: DictKey; icon: string }[] = [
  { href: '/dashboard', labelKey: 'side.dashboard', icon: 'dashboard' },
  { href: '/family', labelKey: 'side.family', icon: 'family_restroom' },
  { href: '/reports', labelKey: 'side.reports', icon: 'description' },
  { href: '/reports/generate', labelKey: 'side.generate', icon: 'brightness_7' },
  { href: '/ai-guide', labelKey: 'side.guide', icon: 'psychology' },
  { href: '/panchang', labelKey: 'side.panchang', icon: 'calendar_today' },
  { href: '/mandir-finder', labelKey: 'side.mandir', icon: 'temple_hindu' },
  { href: '/pilgrimage', labelKey: 'side.pilgrimage', icon: 'travel_explore' },
  { href: '/shop', labelKey: 'side.shop', icon: 'storefront' },
  { href: '/handwritten-report', labelKey: 'side.handwritten', icon: 'draw' },
  { href: '/orders', labelKey: 'side.orders', icon: 'package_2' },
  { href: '/consultations', labelKey: 'side.consultations', icon: 'event' },
  { href: '/refer', labelKey: 'side.refer', icon: 'group_add' },
  { href: '/reviews', labelKey: 'side.reviews', icon: 'rate_review' },
  { href: '/mailbox', labelKey: 'side.mailbox', icon: 'mail' },
  { href: '/my-courses', labelKey: 'side.myCourses', icon: 'school' },
  { href: '/webinars', labelKey: 'side.webinars', icon: 'live_tv' },
  { href: '/my-library', labelKey: 'side.ebooks', icon: 'menu_book' },
  { href: '/social', labelKey: 'side.social', icon: 'share' },
  { href: '/settings', labelKey: 'side.settings', icon: 'settings' },
]

const divineServiceItems: { href: string; labelKey: DictKey; icon: string; exact?: boolean }[] = [
  { href: '/divine-services', labelKey: 'side.allDivine', icon: 'brightness_7' },
  { href: '/puja', labelKey: 'side.puja', icon: 'local_fire_department' },
  { href: '/sadhana', labelKey: 'side.sadhana', icon: 'self_improvement' },
  { href: '/mahaganpati', labelKey: 'side.mahaganpati', icon: 'brightness_5' },
  { href: '/gyanampeetham', labelKey: 'side.gyanampeetham', icon: 'school' },
  { href: '/ayurveda', labelKey: 'side.ayurveda', icon: 'spa' },
  { href: '/ardra-jalam', labelKey: 'side.ardraJalam', icon: 'water_drop', exact: true },
  { href: '/ardra-jalam/nakshatra-jal', labelKey: 'side.nakshatraJal', icon: 'water_drop' },
  { href: '/ardra-jalam/crystal-manifestation', labelKey: 'side.crystal', icon: 'diamond' },
  { href: '/courses', labelKey: 'side.courses', icon: 'menu_book' },
]

function NavContent({ pathname, onClose, onSignOut }: { pathname: string; onClose: () => void; onSignOut: () => void }) {
  const { t } = useLanguage()
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--outline-variant)]/30 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 flex-shrink-0 group-hover:scale-110 transition-transform"><SudarshanLoader px={32} /></div>
          <div>
            <div className="text-[var(--indigo-deep)] font-bold text-sm leading-tight" style={{ fontFamily: "var(--font-display)" }}>MahaTathastu</div>
            <div className="text-[var(--terracotta)] text-[12px] tracking-[0.15em] uppercase" style={{ fontFamily: "var(--font-label)" }}>{t('side.tagline')}</div>
          </div>
        </Link>
        {/* Close button (mobile only) */}
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--warm-sand)] transition-colors"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, labelKey, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'bg-[var(--warm-sand)] text-[var(--terracotta)] border-l-2 border-[var(--terracotta)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 border-l-2 border-transparent'
              )}
            >
              <Icon name={icon} size={18} />
              <span className="font-medium text-[14px]">{t(labelKey)}</span>
            </Link>
          )
        })}

        {/* ── Divine Services Section ── */}
        <div className="pt-3 pb-1">
          <div className="mx-1 rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #C9992E', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
            {/* Section header */}
            <div className="px-3 pt-3 pb-2 flex items-center gap-2">
              <Icon name="brightness_7" size={16} style={{ color: '#C9992E' }} />
              <span className="text-[12px] font-black tracking-[0.2em] uppercase" style={{ color: '#92400e', fontFamily: "var(--font-label)" }}>
                {t('side.divineServices')}
              </span>
            </div>
            {/* Service links */}
            <div className="pb-2 px-1 space-y-0.5">
              {divineServiceItems.map(({ href, labelKey, icon, exact }) => {
                const isAll    = href === '/divine-services'
                const active   = pathname === href || (!isAll && !exact && href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200',
                      isAll
                        ? active
                          ? 'bg-[#C9992E] text-white font-bold'
                          : 'bg-[#D4A01715] text-[#92400e] font-bold hover:bg-[#D4A01725] border border-[#D4A01740]'
                        : active
                        ? 'bg-[#92400e]/15 text-[#92400e] font-semibold border-l-2 border-[#C9992E]'
                        : 'text-[#78350f]/60 hover:text-[#92400e] hover:bg-[#D4A01710] border-l-2 border-transparent'
                    )}
                  >
                    <Icon name={icon} size={15} style={{ color: active ? 'inherit' : '#C9992E'  }} />
                    <span className={isAll ? 'font-bold' : 'font-medium'}>{t(labelKey)}</span>
                    {isAll && <Icon name="arrow_forward" size={13} className="ml-auto opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Security badge */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-[var(--warm-sand)] border border-[var(--outline-variant)]/30">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="lock" size={14} className="text-[var(--saffron)]" />
          <span className="text-[12px] font-semibold tracking-widest uppercase text-[var(--saffron)]" style={{ fontFamily: "var(--font-label)" }}>{t('side.security')}</span>
        </div>
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">{t('side.securityDesc')}</p>
      </div>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-[var(--outline-variant)]/30 pt-3">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-all border-l-2 border-transparent"
        >
          <Icon name="logout" size={18} />
          {t('side.signOut')}
        </button>
      </div>
    </>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), [])
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-[var(--kutch-white)] flex-col border-r border-[var(--outline-variant)]/40">
        <NavContent pathname={pathname} onClose={() => setMobileOpen(false)} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--kutch-white)] border-b border-[var(--outline-variant)]/30 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 flex-shrink-0"><SudarshanLoader px={28} /></div>
          <span className="font-bold text-sm text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>MahaTathastu</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--warm-sand)] transition-colors"
        >
          <Icon name="menu" size={22} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[var(--kutch-white)] flex flex-col border-r border-[var(--outline-variant)]/40 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent pathname={pathname} onClose={() => setMobileOpen(false)} onSignOut={handleSignOut} />
      </aside>
    </>
  )
}
