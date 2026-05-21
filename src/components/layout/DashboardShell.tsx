'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

// Pages inside (dashboard) route group that should render with public layout
const PUBLIC_IN_DASHBOARD = ['/panchang', '/mandir-finder', '/pilgrimage']

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_IN_DASHBOARD.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    return (
      <>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </>
    )
  }

  return (
    <div className="flex min-h-screen bg-[var(--kutch-white)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
