'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/events', label: 'Events' },
  { href: '/ebooks', label: 'Ebooks' },
  { href: '/panchang', label: 'Panchang' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-[var(--kutch-white)]/95 backdrop-blur-md border-b border-[var(--outline-variant)]/40 shadow-sm'
        : 'bg-[var(--kutch-white)]/90 backdrop-blur-sm border-b border-[var(--outline-variant)]/20'
    )}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo — Playfair Display branding */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-300 animate-glow">
              <span className="absolute inset-0 rounded-full gradient-saffron opacity-50 animate-ping-slow" />
              ॐ
            </div>
            <span
              className="text-[var(--indigo-deep)] font-bold text-lg leading-none tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              MahaTathastu
            </span>
          </Link>

          {/* Desktop Nav — Sora label-caps */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-semibold tracking-widest uppercase transition-all duration-200',
                  'font-label',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'text-[var(--terracotta)] bg-[var(--warm-sand)]'
                    : 'text-[var(--indigo-deep)]/60 hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/60'
                )}
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <Link href="/dashboard" className="btn-divine text-xs px-5 py-2.5">
                  My Sanctuary
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[var(--indigo-deep)]/60 hover:text-[var(--indigo-deep)] text-xs font-semibold tracking-widest uppercase transition-colors"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Login
                  </Link>
                  <Link href="/register" className="btn-divine text-xs px-5 py-2.5">
                    Begin Journey
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--warm-sand)] transition-colors"
              aria-label="Menu"
            >
              <div className="w-5 h-3.5 flex flex-col justify-between">
                <span className={cn('block h-0.5 bg-[var(--indigo-deep)] rounded-full transition-all duration-300', mobileOpen && 'rotate-45 translate-y-[7px]')} />
                <span className={cn('block h-0.5 bg-[var(--indigo-deep)] rounded-full transition-all duration-300', mobileOpen && 'opacity-0 scale-x-0')} />
                <span className={cn('block h-0.5 bg-[var(--indigo-deep)] rounded-full transition-all duration-300', mobileOpen && '-rotate-45 -translate-y-[7px]')} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[var(--kutch-white)] border-t border-[var(--outline-variant)]/30"
          >
            <div className="px-6 py-5 space-y-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-xs font-semibold tracking-widest uppercase transition-all',
                    pathname === href
                      ? 'text-[var(--terracotta)] bg-[var(--warm-sand)]'
                      : 'text-[var(--indigo-deep)]/60 hover:text-[var(--indigo-deep)] hover:bg-[var(--warm-sand)]/60'
                  )}
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-4 border-t border-[var(--outline-variant)]/30 flex flex-col gap-2.5">
                {user ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-divine text-center">
                    My Sanctuary
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-outline-divine text-center">
                      Login
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-divine text-center">
                      Begin Journey
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
