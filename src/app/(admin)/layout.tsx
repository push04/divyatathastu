'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

const adminNav = [
  { href: '/admin', label: 'Overview', icon: 'bar_chart' },
  { href: '/admin/users', label: 'Users', icon: 'group' },
  { href: '/admin/reports', label: 'Reports', icon: 'description' },
  { href: '/admin/orders', label: 'Orders', icon: 'package_2' },
  { href: '/admin/products', label: 'Products', icon: 'storefront' },
  { href: '/admin/consultations', label: 'Consultations', icon: 'event' },
  { href: '/admin/mailbox', label: 'Mailbox', icon: 'mail' },
  { href: '/admin/blog', label: 'Blog', icon: 'article' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'redeem' },
  { href: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
]

function AdminSidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white/80">ॐ MahaTathastu</div>
          <div className="text-xs text-white/40 mt-0.5">Admin Panel</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {adminNav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <Link href="/dashboard" className="text-xs text-white/40 hover:text-white flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Back to App
        </Link>
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data?.role !== 'admin') { router.replace('/dashboard'); return }
      setAuthorized(true)
    }
    checkRole()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!authorized) return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--kutch-white)]">
      <div className="text-3xl animate-spin" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--terracotta)' }}>ॐ</div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[var(--kutch-white)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-[var(--indigo-deep)] text-white flex-col flex-shrink-0">
        <AdminSidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[var(--indigo-deep)] text-white flex items-center justify-between px-4">
        <div className="text-sm font-bold text-white/80">ॐ Admin</div>
        <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white p-1">
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-[var(--indigo-deep)] text-white flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <AdminSidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
    </div>
  )
}
