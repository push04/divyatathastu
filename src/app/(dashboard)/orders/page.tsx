'use client'

import SudarshanLoader from '@/components/SudarshanLoader'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  created_at: string
  payment_method: string | null
  tracking_number: string | null
  notes: string | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-teal-100 text-teal-700',
  completed: 'bg-teal-100 text-teal-700',
  refunded: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60',
}

const DELIVERY_STEPS = [
  { key: 'ordered', label: 'Order Placed', icon: 'receipt_long', statuses: ['pending', 'paid'] },
  { key: 'processing', label: 'Processing', icon: 'manufacturing', statuses: ['processing'] },
  { key: 'shipped', label: 'Shipped', icon: 'local_shipping', statuses: ['shipped'] },
  { key: 'delivered', label: 'Delivered', icon: 'task_alt', statuses: ['delivered', 'completed'] },
]

function getDeliveryStep(status: string): number {
  if (['delivered', 'completed'].includes(status)) return 4
  if (status === 'shipped') return 3
  if (status === 'processing') return 2
  if (['pending', 'paid'].includes(status)) return 1
  return 0
}

function DeliveryTracker({ status, trackingNumber }: { status: string; trackingNumber: string | null }) {
  const isCancelled = ['cancelled', 'refunded', 'failed'].includes(status)
  const currentStep = getDeliveryStep(status)

  function copyTracking() {
    if (!trackingNumber) return
    navigator.clipboard.writeText(trackingNumber).then(() => toast.success('Tracking number copied!'))
  }

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-red-50 border border-red-100">
        <span className="material-symbols-outlined text-[18px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
        <span className="text-sm font-medium text-red-600 capitalize">{status}</span>
        <span className="text-xs text-red-400">— This order was {status}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress stepper */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-[var(--warm-sand)]" style={{ zIndex: 0 }} />
        <div
          className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-[var(--saffron)] to-[var(--terracotta)] transition-all duration-700"
          style={{
            zIndex: 0,
            width: currentStep > 0 ? `${Math.min(((currentStep - 1) / 3) * (100 - (10 / (DELIVERY_STEPS.length))), 100)}%` : '0%',
          }}
        />
        <div className="relative flex justify-between" style={{ zIndex: 1 }}>
          {DELIVERY_STEPS.map((step, idx) => {
            const stepNum = idx + 1
            const isDone = currentStep >= stepNum
            const isActive = currentStep === stepNum
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isDone
                    ? 'bg-gradient-to-br from-[var(--saffron)] to-[var(--terracotta)] shadow-md'
                    : 'bg-white border-2 border-[var(--warm-sand)]'
                } ${isActive ? 'scale-110 ring-4 ring-[var(--saffron)]/20' : ''}`}>
                  <span className={`material-symbols-outlined text-[18px] ${isDone ? 'text-white' : 'text-[var(--warm-charcoal)]/30'}`}
                    style={{ fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}>
                    {step.icon}
                  </span>
                </div>
                <p className={`text-[10px] text-center leading-tight font-medium ${isDone ? 'text-[var(--terracotta)]' : 'text-[var(--warm-charcoal)]/40'}`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tracking number */}
      {trackingNumber && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-50 border border-cyan-100">
          <span className="material-symbols-outlined text-[20px] text-cyan-600" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-cyan-500 uppercase tracking-wide">Tracking Number</p>
            <p className="font-mono font-bold text-cyan-800 text-sm truncate">{trackingNumber}</p>
          </div>
          <button
            onClick={copyTracking}
            className="flex-shrink-0 p-1.5 rounded-lg bg-white border border-cyan-200 text-cyan-600 hover:bg-cyan-100 transition-colors"
            title="Copy tracking number"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
        </div>
      )}
    </div>
  )
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
      const { data } = await supabase
        .from('orders')
        .select('id,order_number,items,subtotal,discount,total,status,created_at,payment_method,tracking_number,notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setOrders(data as Order[])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--indigo-deep)] inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
            My Orders
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/shop" className="text-sm text-[var(--terracotta)] font-semibold hover:underline inline-flex items-center gap-1">
          Continue Shopping
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card-divine p-16 text-center">
          <div className="flex justify-center mb-4">
            <span className="material-symbols-outlined text-[48px] text-[var(--indigo-deep)]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--indigo-deep)] mb-2">No orders yet</h2>
          <p className="text-[var(--warm-charcoal)]/60 mb-6">Explore our sacred products and reports</p>
          <Link href="/shop" className="btn-divine px-8 py-3">Visit Shop</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card-divine overflow-hidden">
              {/* Order header row */}
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--warm-sand)]/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    ['delivered', 'completed'].includes(order.status) ? 'bg-teal-50' :
                    order.status === 'shipped' ? 'bg-cyan-50' :
                    order.status === 'processing' ? 'bg-blue-50' :
                    'bg-[var(--warm-sand)]/40'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${
                      ['delivered', 'completed'].includes(order.status) ? 'text-teal-500' :
                      order.status === 'shipped' ? 'text-cyan-500' :
                      order.status === 'processing' ? 'text-blue-500' :
                      'text-[var(--indigo-deep)]'
                    }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {['delivered', 'completed'].includes(order.status) ? 'task_alt' :
                       order.status === 'shipped' ? 'local_shipping' :
                       order.status === 'processing' ? 'manufacturing' : 'package_2'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--indigo-deep)] text-sm">{order.order_number}</p>
                    <p className="text-xs text-[var(--warm-charcoal)]/50">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      {order.tracking_number && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-cyan-600">
                          <span className="material-symbols-outlined text-[11px]">local_shipping</span>
                          Tracking available
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-[var(--indigo-deep)]">₹{order.total?.toLocaleString('en-IN')}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[order.status] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[var(--warm-charcoal)]/30">
                    {expanded === order.id ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-[var(--warm-sand)]">
                  {/* Delivery tracking */}
                  <div className="px-4 pt-4 pb-3">
                    <p className="text-[10px] font-semibold text-[var(--warm-charcoal)]/50 uppercase tracking-wide mb-3">Delivery Status</p>
                    <DeliveryTracker status={order.status} trackingNumber={order.tracking_number} />
                  </div>

                  {/* Admin note */}
                  {order.notes && (
                    <div className="mx-4 mb-3 flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="material-symbols-outlined text-[20px] text-amber-500 flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                      <div>
                        <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Message from our Team</p>
                        <p className="text-sm text-amber-900">{order.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Order items */}
                  <div className="px-4 pb-4">
                    <p className="text-[10px] font-semibold text-[var(--warm-charcoal)]/50 uppercase tracking-wide mb-2">Order Items</p>
                    <div className="space-y-2">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-[var(--warm-charcoal)]/70">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-[var(--indigo-deep)]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="border-t border-[var(--warm-sand)] pt-2 mt-2 space-y-1 text-sm">
                        {order.subtotal != null && (
                          <div className="flex justify-between text-[var(--warm-charcoal)]/60">
                            <span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount</span><span>−₹{order.discount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-[var(--indigo-deep)]">
                          <span>Total Paid</span><span>₹{order.total?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--warm-charcoal)]/40 pt-1">
                        Payment: {order.payment_method || 'N/A'} · Order: {order.order_number}
                      </p>
                    </div>
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
