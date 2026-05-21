'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Order {
  id: string
  order_number: string
  total: number
  status: string
  payment_method: string
  created_at: string
  profiles: { full_name: string } | null
}

const STATUSES = ['pending', 'paid', 'processing', 'completed', 'refunded', 'cancelled']

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-violet-100 text-violet-700',
  refunded: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60',
}

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function load() {
    const { data } = await supabase.from('orders').select('id,order_number,total,status,payment_method,created_at,profiles(full_name)').order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status: status as any }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    toast.success('Status updated')
  }

  async function deleteOrder(id: string) {
    if (!confirm('Delete this order?')) return
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setOrders(prev => prev.filter(o => o.id !== id)); toast.success('Order deleted') }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const revenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            Orders <span className="text-[var(--warm-charcoal)]/40 font-normal">({orders.length})</span>
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">Revenue: <span className="font-semibold text-emerald-600">₹{revenue.toLocaleString('en-IN')}</span></p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap flex-shrink-0 transition-all ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-[var(--indigo-deep)] text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--warm-charcoal)]">{(o.profiles as any)?.full_name || '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--indigo-deep)]">₹{o.total?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]/40 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[o.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                        className="text-xs border border-[var(--warm-sand)] rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteOrder(o.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              <p className="text-[var(--warm-charcoal)]/40 text-sm">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
