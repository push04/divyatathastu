'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import SudarshanLoader from '@/components/SudarshanLoader'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/events', label: 'Events' },
  { href: '/shop', label: 'Shop' },
  { href: '/ebooks', label: 'Ebooks' },
  { href: '/panchang', label: 'Panchang' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUser(data.user)
        // Fetch name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single()
        if (profile?.full_name) {
          // Show first name only
          setUserName(profile.full_name.split(' ')[0])
        } else {
          setUserName(data.user.email?.split('@')[0] || null)
        }
      }
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0])
        } else {
          setUserName(session.user.email?.split('@')[0] || null)
        }
      } else {
        setUser(null)
        setUserName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-[var(--kutch-white)]/95 backdrop-blur-md border-b border-[var(--outline-variant)]/40 shadow-sm'
        : 'bg-[var(--kutch-white)]/90 backdrop-blur-sm border-b border-[var(--outline-variant)]/20'
    )}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <SudarshanLoader px={32} />
            </div>
            <span
              className="text-[var(--indigo-deep)] font-bold text-lg leading-none tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              MahaTathastu
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-semibold tracking-widest uppercase transition-all duration-200 font-label',
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
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                // Logged-in state: "Hi [Name]" + dashboard link
                <div className="flex items-center gap-2">
                  <Link href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-[var(--warm-sand)]/60"
                    style={{ color: 'var(--indigo-deep)' }}>
                    <div className="w-7 h-7 rounded-full gradient-saffron flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {userName ? userName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Hi, {userName || 'Friend'}
                    </span>
                  </Link>
                  <Link href="/dashboard" className="btn-divine text-xs px-4 py-2">
                    Dashboard
                  </Link>
                </div>
              ) : (
                // Logged-out state
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
              {/* Logged-in greeting on mobile */}
              {user && userName && (
                <div className="flex items-center gap-2.5 px-4 py-3 mb-2 rounded-xl" style={{ background: 'var(--warm-sand)' }}>
                  <div className="w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-white text-sm font-bold">
                    {userName[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--indigo-deep)', fontFamily: "'DM Sans', sans-serif" }}>Hi, {userName}!</p>
                    <p className="text-[10px]" style={{ color: 'rgba(61,52,80,0.5)' }}>Welcome back</p>
                  </div>
                </div>
              )}

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
                    My Dashboard
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
