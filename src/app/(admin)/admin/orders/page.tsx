'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Order {
  id: string
  order_number: string
  items: any
  subtotal: number | null
  discount: number
  total: number
  status: string
  payment_method: string | null
  tracking_number: string | null
  notes: string | null
  created_at: string
  profiles: { full_name: string; phone: string | null } | null
}

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'refunded', 'cancelled']

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-violet-100 text-violet-700',
  completed: 'bg-teal-100 text-teal-700',
  refunded: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60',
}

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ tracking: string; notes: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('orders')
      .select('id,order_number,items,subtotal,discount,total,status,payment_method,tracking_number,notes,created_at,profiles(full_name,phone)')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status: status as any }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    toast.success('Status updated')
  }

  async function saveOrderDetails(id: string) {
    if (!editing) return
    setSaving(true)
    const { error } = await supabase.from('orders').update({
      tracking_number: editing.tracking || null,
      notes: editing.notes || null,
    }).eq('id', id)
    if (error) toast.error('Save failed: ' + error.message)
    else {
      toast.success('Order updated')
      setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_number: editing.tracking || null, notes: editing.notes || null } : o))
      setEditing(null)
    }
    setSaving(false)
  }

  function toggleExpand(id: string, order: Order) {
    if (expanded === id) {
      setExpanded(null)
      setEditing(null)
    } else {
      setExpanded(id)
      setEditing({ tracking: order.tracking_number || '', notes: order.notes || '' })
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm('Delete this order?')) return
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) toast.error('Delete failed')
    else { setOrders(prev => prev.filter(o => o.id !== id)); toast.success('Order deleted') }
  }

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter
    const matchesSearch = !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      (o.profiles as any)?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const revenue = orders.filter(o => ['paid', 'delivered', 'completed'].includes(o.status)).reduce((sum, o) => sum + o.total, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            Orders <span className="text-[var(--warm-charcoal)]/40 font-normal">({orders.length})</span>
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/50 mt-0.5">
            Revenue: <span className="font-semibold text-emerald-600">₹{revenue.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--warm-charcoal)]/40">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Order # or name..."
              className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-xs w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]"
            />
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap flex-shrink-0 transition-all ${filter === s ? 'bg-[var(--indigo-deep)] text-white' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:text-[var(--indigo-deep)]'}`}>
            {s} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {filtered.map(o => (
                <>
                  <tr key={o.id} className={`hover:bg-[var(--warm-sand)]/20 transition-colors ${expanded === o.id ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleExpand(o.id, o)} className="flex items-center gap-1 font-mono font-medium text-[var(--indigo-deep)] text-xs hover:underline">
                        <span className="material-symbols-outlined text-[14px]">{expanded === o.id ? 'expand_less' : 'expand_more'}</span>
                        {o.order_number}
                      </button>
                      {o.tracking_number && (
                        <p className="text-xs text-cyan-600 font-mono mt-0.5">📦 {o.tracking_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--warm-charcoal)]">{(o.profiles as any)?.full_name || '—'}</p>
                      <p className="text-xs text-[var(--warm-charcoal)]/40">{(o.profiles as any)?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--indigo-deep)]">₹{o.total?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[o.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--warm-charcoal)]/40 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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

                  {expanded === o.id && editing && (
                    <tr key={`${o.id}-detail`}>
                      <td colSpan={6} className="px-4 py-4 bg-amber-50/30 border-b border-[var(--warm-sand)]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {/* Items */}
                          <div>
                            <p className="text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-wide mb-2">Order Items</p>
                            {o.items?.length ? (
                              <div className="space-y-1.5">
                                {o.items.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-[var(--warm-charcoal)]">{item.name} × {item.quantity}</span>
                                    <span className="font-medium text-[var(--indigo-deep)]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                                <div className="border-t border-[var(--warm-sand)] pt-2 space-y-1 text-xs">
                                  {o.subtotal != null && <div className="flex justify-between text-[var(--warm-charcoal)]/60"><span>Subtotal</span><span>₹{o.subtotal.toLocaleString('en-IN')}</span></div>}
                                  {o.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−₹{o.discount.toLocaleString('en-IN')}</span></div>}
                                  <div className="flex justify-between font-bold text-[var(--indigo-deep)]"><span>Total</span><span>₹{o.total.toLocaleString('en-IN')}</span></div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-[var(--warm-charcoal)]/40">No item details available</p>
                            )}
                            <p className="text-xs text-[var(--warm-charcoal)]/40 mt-2">Payment: {o.payment_method || 'N/A'}</p>
                          </div>

                          {/* Tracking & Notes */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-wide mb-1">Tracking Number</label>
                              <input
                                type="text"
                                value={editing.tracking}
                                onChange={e => setEditing(ed => ed ? { ...ed, tracking: e.target.value } : ed)}
                                placeholder="e.g. DL12345678901"
                                className="w-full px-3 py-1.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 uppercase tracking-wide mb-1">Admin Notes</label>
                              <textarea
                                value={editing.notes}
                                onChange={e => setEditing(ed => ed ? { ...ed, notes: e.target.value } : ed)}
                                rows={3}
                                placeholder="Internal notes about this order..."
                                className="w-full px-3 py-1.5 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white resize-none"
                              />
                            </div>
                            <button
                              onClick={() => saveOrderDetails(o.id)}
                              disabled={saving}
                              className="btn-divine px-4 py-1.5 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[14px]">{saving ? 'hourglass_empty' : 'save'}</span>
                              {saving ? 'Saving...' : 'Save Details'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
