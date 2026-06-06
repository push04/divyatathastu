import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Lazy import to avoid crash when credentials not set
function getRazorpay() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay')
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'create'

  if (action === 'create') {
    const { items, couponCode } = await req.json()

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    let discount = 0

    // Validate coupon
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (coupon && subtotal >= coupon.min_order_amount) {
        discount = coupon.discount_type === 'percentage'
          ? subtotal * coupon.discount_value / 100
          : coupon.discount_value
      }
    }

    const total = Math.max(0, subtotal - discount)
    const orderNumber = `DT-${Date.now()}`

    if (!process.env.RAZORPAY_KEY_ID) {
      // Mock mode — return dummy order for testing
      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        order_number: orderNumber,
        items,
        subtotal,
        discount,
        coupon_code: couponCode || null,
        total,
        status: 'pending',
        payment_method: 'razorpay',
        razorpay_order_id: 'mock_' + Date.now(),
      }).select().single()

      return NextResponse.json({
        success: true,
        order_id: 'mock_' + Date.now(),
        amount: total * 100,
        currency: 'INR',
        db_order_id: order?.id,
        mock: true,
      })
    }

    const razorpay = getRazorpay()
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: orderNumber,
      notes: { user_id: user.id },
    })

    const { data: order } = await supabase.from('orders').insert({
      user_id: user.id,
      order_number: orderNumber,
      items,
      subtotal,
      discount,
      coupon_code: couponCode || null,
      total,
      status: 'pending',
      payment_method: 'razorpay',
      razorpay_order_id: razorpayOrder.id,
    }).select().single()

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      db_order_id: order?.id,
    })
  }

  if (action === 'verify') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = await req.json()

    const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')

    const isValid = expectedSignature === razorpay_signature || razorpay_order_id?.startsWith('mock_')

    if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

    await supabase.from('orders').update({
      status: 'paid' as any,
      razorpay_payment_id,
    }).eq('id', db_order_id)

    // Fulfil ebook purchases — sync ebooks table + ebook_purchases for each ebook item
    const { data: orderRow } = await supabase.from('orders').select('items,user_id').eq('id', db_order_id).single()
    const orderItems: any[] = orderRow?.items || []
    const ebookItems = orderItems.filter((i: any) => i.product_type === 'ebook')
    for (const item of ebookItems) {
      const { data: product } = await supabase
        .from('products')
        .select('ebook_file_url,ebook_download_limit,description,name')
        .eq('id', item.id)
        .single()
      if (!product?.ebook_file_url) continue
      // Ensure ebooks row exists (upsert by product id)
      await supabase.from('ebooks').upsert({
        id: item.id,
        title: product.name,
        file_url: product.ebook_file_url,
        description: product.description || null,
        author: 'MahaTathastu',
        language: null,
        tags: [],
      }, { onConflict: 'id' })
      // Create purchase record (avoid duplicate if retried)
      const { data: existing } = await supabase
        .from('ebook_purchases')
        .select('id')
        .eq('user_id', orderRow.user_id)
        .eq('ebook_id', item.id)
        .maybeSingle()
      if (!existing) {
        await supabase.from('ebook_purchases').insert({
          user_id: orderRow.user_id,
          ebook_id: item.id,
          download_count: 0,
          max_downloads: product.ebook_download_limit ?? 3,
          purchased_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ success: true, verified: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
