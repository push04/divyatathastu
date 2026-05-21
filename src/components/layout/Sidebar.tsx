'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  { href: '/orders', label: 'Orders', icon: 'package_2' },
  { href: '/consultations', label: 'Consultations', icon: 'event' },
  { href: '/mailbox', label: 'Mailbox', icon: 'mail' },
  { href: '/my-library', label: 'My Ebooks', icon: 'menu_book' },
  { href: '/social', label: 'Social Content', icon: 'share' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

function NavContent({ pathname, onClose, onSignOut }: { pathname: string; onClose: () => void; onSignOut: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[var(--outline-variant)]/30 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">ॐ</div>
          <div>
            <div className="text-[var(--indigo-deep)] font-bold text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>DivyaTathastu</div>
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
  const supabase = createClient()
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
          <div className="w-7 h-7 rounded-full gradient-saffron flex items-center justify-center text-white font-bold text-xs">ॐ</div>
          <span className="font-bold text-sm text-[var(--indigo-deep)]" style={{ fontFamily: "'Playfair Display', serif" }}>DivyaTathastu</span>
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
