'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

declare global {
  interface Window { Razorpay: any }
}

async function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined' || window.Razorpay) return
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load payment gateway'))
    document.head.appendChild(s)
  })
}

export interface ServiceItem {
  id: string
  title: string
  price: number
}

export interface PayOptions {
  notes?: string
  preferredDate?: string
  quantity?: number
  onSuccess?: (itemId: string) => void
}

export function useServicePayment() {
  const [bookingId, setBookingId] = useState<string | null>(null)

  const pay = async (item: ServiceItem, opts?: PayOptions) => {
    setBookingId(item.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login to book this service')
        setBookingId(null)
        return
      }

      const res = await fetch('/api/service-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_item_id: item.id,
          amount: item.price,
          quantity: opts?.quantity || 1,
          notes: opts?.notes || item.title,
          preferred_date: opts?.preferredDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment')

      if (data.mock) {
        toast.success('Booked! Our team will contact you within 24 hours.')
        opts?.onSuccess?.(item.id)
        setBookingId(null)
        return
      }

      await loadRazorpayScript()

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: data.key,
          amount: data.amount,
          currency: 'INR',
          order_id: data.order_id,
          name: 'MahaTathastu',
          description: item.title,
          prefill: {
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
          },
          theme: { color: '#D4A017' },
          handler: async (response: any) => {
            try {
              const vRes = await fetch('/api/service-payment?action=verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  booking_id: data.booking_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
              if (vRes.ok) {
                toast.success('Payment confirmed! Booking is now active.')
                opts?.onSuccess?.(item.id)
                resolve()
              } else {
                toast.error('Payment verification failed. Contact support with payment ID: ' + response.razorpay_payment_id)
                reject(new Error('Verification failed'))
              }
            } catch (e: any) {
              reject(e)
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled.')
              reject(new Error('dismissed'))
            },
          },
        })
        rzp.open()
      })
    } catch (e: any) {
      if (e.message !== 'dismissed') {
        toast.error(e.message || 'Booking failed. Please try again.')
      }
    } finally {
      setBookingId(null)
    }
  }

  return { pay, bookingId }
}
