'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Order {
  id: string
  order_number: string
  items: any
  subtotal: number | null
  discount: number
  total: number
  status: string
  created_at: string
  payment_method: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  delivered: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setOrders(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)] inline-flex items-center gap-2"><span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span> My Orders</h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">{orders.length} orders</p>
        </div>
        <Link href="/shop" className="text-sm text-[var(--terracotta)] font-medium hover:underline">Continue Shopping <span className="material-symbols-outlined text-[14px]">arrow_forward</span></Link>
      </div>

      {orders.length === 0 ? (
        <div className="card-divine p-16 text-center">
          <div className="flex justify-center mb-4"><span className="material-symbols-outlined text-[48px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span></div>
          <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-2">No orders yet</h2>
          <p className="text-[var(--warm-charcoal)]/60 mb-6">Explore our sacred products and reports</p>
          <Link href="/shop" className="btn-divine px-8 py-3">Visit Shop</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card-divine overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center"><span className="material-symbols-outlined text-[24px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span></div>
                  <div>
                    <p className="font-bold text-[var(--indigo-deep)] text-sm">{order.order_number}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/50">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.items?.length || 0} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-[var(--indigo-deep)]">₹{order.total?.toLocaleString('en-IN')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>{order.status}</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/30">{expanded === order.id ? 'expand_less' : 'expand_more'}</span>
                </div>
              </button>

              {expanded === order.id && (
                <div className="px-4 pb-4 border-t border-[var(--warm-sand)]">
                  <div className="pt-3 space-y-2">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[var(--warm-charcoal)]/70">{item.name} �- {item.quantity}</span>
                        <span className="font-medium text-[var(--indigo-deep)]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="border-t border-[var(--warm-sand)] pt-2 mt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-[var(--warm-charcoal)]/60"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
                      {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−₹{order.discount.toLocaleString('en-IN')}</span></div>}
                      <div className="flex justify-between font-bold text-[var(--indigo-deep)]"><span>Total Paid</span><span>₹{order.total?.toLocaleString('en-IN')}</span></div>
                    </div>
                    <p className="text-xs text-[var(--warm-charcoal)]/40 pt-1">Payment: {order.payment_method} · Order ID: {order.order_number}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
