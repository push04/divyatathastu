'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Stats { users: number; reports: number; orders: number; revenue: number; activeConsultations: number; openTickets: number; events: number }
interface RecentActivity { type: 'user' | 'report' | 'order'; label: string; time: string; icon: string }

const STAT_ICONS: Record<string, string> = { group: 'group', description: 'description', package_2: 'package_2', payments: 'payments', handshake: 'handshake', mail: 'mail' }

export default function AdminOverviewPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({ users: 0, reports: 0, orders: 0, revenue: 0, activeConsultations: 0, openTickets: 0, events: 0 })
  const [recent, setRecent] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, reportsRes, ordersRes, consultRes, mailRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total,status').eq('status', 'paid'),
        supabase.from('consultation_bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('mail_threads').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_published', true).then(r => r.error ? { count: 0 } : r),
      ])
      const revenue = ordersRes.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
      setStats({ users: usersRes.count || 0, reports: reportsRes.count || 0, orders: ordersRes.data?.length || 0, revenue, activeConsultations: consultRes.count || 0, openTickets: mailRes.count || 0, events: eventsRes.count || 0 })
      const [recentUsers, recentReports, recentOrders] = await Promise.all([
        supabase.from('profiles').select('full_name,created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('reports').select('report_type,created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('orders').select('order_number,created_at,total').order('created_at', { ascending: false }).limit(3),
      ])
      const acts: RecentActivity[] = [
        ...(recentUsers.data || []).map(u => ({ type: 'user' as const, label: `New user: ${u.full_name}`, time: u.created_at, icon: 'person' })),
        ...(recentReports.data || []).map(r => ({ type: 'report' as const, label: `Report: ${r.report_type.replace(/_/g, ' ')}`, time: r.created_at, icon: 'description' })),
        ...(recentOrders.data || []).map(o => ({ type: 'order' as const, label: `Order ${o.order_number} · ₹${o.total?.toLocaleString('en-IN')}`, time: o.created_at, icon: 'package_2' })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)
      setRecent(acts)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.users, icon: 'group', color: 'bg-[var(--indigo-deep)]', href: '/admin/users' },
    { label: 'Reports Generated', value: stats.reports, icon: 'description', color: 'bg-[var(--plum)]', href: '/admin/reports' },
    { label: 'Paid Orders', value: stats.orders, icon: 'package_2', color: 'bg-emerald-600', href: '/admin/orders' },
    { label: 'Revenue (₹)', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: 'payments', color: 'bg-[var(--saffron)]', href: '/admin/orders' },
    { label: 'Active Consultations', value: stats.activeConsultations, icon: 'handshake', color: 'bg-teal-600', href: '/admin/consultations' },
    { label: 'Open Tickets', value: stats.openTickets, icon: 'mail', color: stats.openTickets > 0 ? 'bg-[var(--terracotta)]' : 'bg-[var(--warm-charcoal)]/40', href: '/admin/mailbox' },
    { label: 'Live Events', value: stats.events, icon: 'event_note', color: 'bg-violet-600', href: '/admin/events' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--indigo-deep)]">Admin Overview</h1>
        <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(s => (
          <Link key={s.label} href={s.href} className="card-divine p-4 hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-sm`}>
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--indigo-deep)]">{s.value}</div>
            <div className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: 'group' },
          { href: '/admin/products', label: 'Manage Products', icon: 'shopping_bag' },
          { href: '/admin/coupons', label: 'Create Coupon', icon: 'redeem' },
          { href: '/admin/blog', label: 'Write Blog', icon: 'edit' },
          { href: '/admin/events', label: 'Manage Events', icon: 'event_note' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="card-divine p-4 hover:shadow-sm transition-all text-center">
            <span className="material-symbols-outlined text-[24px] text-[var(--indigo-deep)] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>{l.icon}</span>
            <p className="text-sm font-medium text-[var(--warm-charcoal)]">{l.label}</p>
          </Link>
        ))}
      </div>

      <div className="card-divine p-5">
        <h2 className="font-bold text-[var(--indigo-deep)] mb-4">Recent Activity</h2>
        <div className="space-y-1">
          {recent.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[var(--warm-sand)]/60 last:border-0">
              <span className="material-symbols-outlined text-[18px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
              <p className="text-sm text-[var(--warm-charcoal)] flex-1">{a.label}</p>
              <span className="text-xs text-[var(--warm-charcoal)]/40">{new Date(a.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-[var(--warm-charcoal)]/40">No activity yet</p>}
        </div>
      </div>
    </div>
  )
}
