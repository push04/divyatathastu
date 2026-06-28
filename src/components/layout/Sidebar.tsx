'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/family', label: 'Family Circle', icon: 'family_restroom' },
  { href: '/reports', label: 'Reports', icon: 'description' },
  { href: '/reports/generate', label: 'Generate Report', icon: 'auto_awesome' },
  { href: '/ai-guide', label: 'AI Spiritual Guide', icon: 'psychology' },
  { href: '/panchang', label: 'Panchang', icon: 'calendar_today' },
  { href: '/mandir-finder', label: 'Mandir Finder', icon: 'temple_hindu' },
  { href: '/pilgrimage', label: 'Pilgrimage', icon: 'travel_explore' },
  { href: '/shop', label: 'Shop', icon: 'storefront' },
  { href: '/handwritten-report', label: 'Handwritten Report', icon: 'draw' },
  { href: '/orders', label: 'Orders', icon: 'package_2' },
  { href: '/consultations', label: 'Consultations', icon: 'event' },
  { href: '/mailbox', label: 'Mailbox', icon: 'mail' },
  { href: '/my-courses', label: 'My Courses', icon: 'school' },
  { href: '/webinars', label: 'Live Webinars', icon: 'live_tv' },
  { href: '/my-library', label: 'My Ebooks', icon: 'menu_book' },
  { href: '/social', label: 'Social Content', icon: 'share' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

const divineServiceItems = [
  { href: '/divine-services', label: 'All Divine Services', icon: 'auto_awesome' },
  { href: '/puja', label: 'Pooja & Rituals', icon: 'local_fire_department' },
  { href: '/sadhana', label: 'Saadhana', icon: 'self_improvement' },
  { href: '/mahaganpati', label: 'Mahaganpati', icon: 'brightness_5' },
  { href: '/gyanampeetham', label: 'Gyanampeetham', icon: 'school' },
  { href: '/ayurveda', label: 'Ayurveda', icon: 'spa' },
  { href: '/ardra-jalam', label: 'Ardra Jalam', icon: 'water_drop' },
  { href: '/courses', label: 'Courses', icon: 'menu_book' },
]

function NavContent({ pathname, onClose, onSignOut }: { pathname: string; onClose: () => void; onSignOut: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--outline-variant)]/30 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 flex-shrink-0 group-hover:scale-110 transition-transform"><SudarshanLoader px={32} /></div>
          <div>
            <div className="text-[var(--indigo-deep)] font-bold text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>MahaTathastu</div>
            <div className="text-[var(--terracotta)] text-[9px] tracking-[0.15em] uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>My Sanctuary</div>
          </div>
        </Link>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-[var(--indigo-deep)]/50 hover:bg-[var(--warm-sand)] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'bg-[var(--warm-sand)] text-[var(--terracotta)] border-l-2 border-[var(--terracotta)]'
                  : 'text-[var(--indigo-deep)]/50 hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 border-l-2 border-transparent'
              )}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className="font-medium text-[13px]">{label}</span>
            </Link>
          )
        })}

        {/* ── Divine Services Section ── */}
        <div className="pt-3 pb-1">
          <div className="mx-1 rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #D4A017', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
            {/* Section header */}
            <div className="px-3 pt-3 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]" style={{ color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: '#92400e', fontFamily: "'Sora', sans-serif" }}>
                Divine Services
              </span>
            </div>
            {/* Service links */}
            <div className="pb-2 px-1 space-y-0.5">
              {divineServiceItems.map(({ href, label, icon }) => {
                const isAll    = href === '/divine-services'
                const active   = pathname === href || (!isAll && href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition-all duration-200',
                      isAll
                        ? active
                          ? 'bg-[#D4A017] text-white font-bold'
                          : 'bg-[#D4A01715] text-[#92400e] font-bold hover:bg-[#D4A01725] border border-[#D4A01740]'
                        : active
                        ? 'bg-[#92400e]/15 text-[#92400e] font-semibold border-l-2 border-[#D4A017]'
                        : 'text-[#78350f]/60 hover:text-[#92400e] hover:bg-[#D4A01710] border-l-2 border-transparent'
                    )}
                  >
                    <span
                      className="material-symbols-outlined text-[15px]"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", color: active ? 'inherit' : '#D4A017' }}
                    >
                      {icon}
                    </span>
                    <span className={isAll ? 'font-bold' : 'font-medium'}>{label}</span>
                    {isAll && <span className="ml-auto material-symbols-outlined text-[12px] opacity-60">arrow_forward</span>}
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
          <span className="material-symbols-outlined text-[14px] text-[var(--saffron)]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--saffron)]" style={{ fontFamily: "'Sora', sans-serif" }}>Vedic Security</span>
        </div>
        <p className="text-[11px] text-[var(--indigo-deep)]/50 leading-relaxed">Your family data is end-to-end encrypted.</p>
      </div>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-[var(--outline-variant)]/30 pt-3">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--indigo-deep)]/40 hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/50 transition-all border-l-2 border-transparent"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out
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
          <span className="font-bold text-sm text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>MahaTathastu</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[var(--indigo-deep)]/60 hover:bg-[var(--warm-sand)] transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
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
