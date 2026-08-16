import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { sendOrderConfirmation, notifyAdmin } from '@/lib/email'
import { requirePaymentGateway, mockPaymentsAllowed, safeError } from '@/lib/security'

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

    // Fetch authoritative report prices from settings - prevents client price tampering
    const hasReportItems = items.some((i: any) => i.product_type === 'report')
    let reportPrices: Record<string, number> = {}
    const { data: setting, error: priceErr } = await (supabase as any)
      .from('settings').select('value').eq('key', 'report_pricing').single()
    if (priceErr) {
      if (hasReportItems) {
        // Refuse to process report orders at client-supplied prices
        console.error('[payment/create] report-pricing fetch failed:', priceErr.message)
        return NextResponse.json({ error: 'Pricing unavailable. Please try again.' }, { status: 503 })
      }
    } else if (setting?.value) {
      reportPrices = setting.value
    }

    // Fetch authoritative prices for every non-report item straight from the products
    // table - the client price was only ever a display value, never trust it for billing.
    const nonReportIds = items.filter((i: any) => i.product_type !== 'report').map((i: any) => i.id)
    let productPrices: Record<string, number> = {}
    if (nonReportIds.length) {
      const { data: productsRows, error: productsErr } = await supabase
        .from('products')
        .select('id,price,sale_price')
        .in('id', nonReportIds)
      if (productsErr || !productsRows || productsRows.length !== new Set(nonReportIds).size) {
        console.error('[payment/create] product price lookup failed or incomplete:', productsErr?.message)
        return NextResponse.json({ error: 'Pricing unavailable. Please try again.' }, { status: 503 })
      }
      productPrices = Object.fromEntries(
        productsRows.map((p: any) => [p.id, p.sale_price ?? p.price])
      )
    }

    // Override every item's price with the server-side authoritative value
    const authoritative = items.map((item: any) => {
      if (item.product_type === 'report' && reportPrices[item.id] !== undefined) {
        return { ...item, price: reportPrices[item.id] }
      }
      if (item.product_type !== 'report' && productPrices[item.id] !== undefined) {
        return { ...item, price: productPrices[item.id] }
      }
      return item
    })

    const subtotal = authoritative.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    let discount = 0

    // Validate coupon.
    // Reward coupons (review thank-you, referral) are personal, single-use and
    // expiring, so ownership, expiry and the use limit all have to be checked
    // here - `is_active` alone let any code be reused by anyone, forever.
    if (couponCode) {
      const { data: coupon } = await (supabase as any)
        .from('coupons')
        .select('*')
        .eq('code', String(couponCode).toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      if (coupon) {
        const isExpired = coupon.expires_at ? new Date(coupon.expires_at).getTime() < Date.now() : false
        const isUsedUp = coupon.max_uses !== null && coupon.max_uses !== undefined
          ? (coupon.used_count ?? 0) >= coupon.max_uses
          : false
        // user_id NULL = public coupon; set = only that user may redeem it.
        const isOwned = !coupon.user_id || coupon.user_id === user.id
        const meetsMin = subtotal >= (coupon.min_order_amount ?? 0)

        if (isExpired || isUsedUp || !isOwned) {
          return NextResponse.json({
            error: isExpired
              ? 'This coupon has expired.'
              : isUsedUp
                ? 'This coupon has already been used.'
                : 'This coupon is not valid for your account.',
          }, { status: 400 })
        }

        if (meetsMin) {
          discount = coupon.discount_type === 'percentage'
            ? subtotal * (coupon.discount_value ?? 0) / 100
            : (coupon.discount_value ?? 0)
          // Never discount below zero, and never above the order value.
          discount = Math.min(Math.max(0, discount), subtotal)
        }
      }
    }

    const total = Math.max(0, subtotal - discount)
    const orderNumber = `DT-${Date.now()}`

    // Mock mode records the order as paid without any money moving. That is
    // only ever acceptable locally: on a deployed environment with an
    // incomplete env - a misconfigured preview, say - it would hand out free
    // products to anyone who found the URL. Refuse rather than fall through.
    const gatewayMissing = requirePaymentGateway()
    if (gatewayMissing) return gatewayMissing

    if (mockPaymentsAllowed()) {
      // Mock mode - return dummy order for testing
      const mockOrderId = 'mock_' + Date.now()
      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        order_number: orderNumber,
        items: authoritative,
        subtotal,
        discount,
        coupon_code: couponCode || null,
        total,
        status: 'pending',
        payment_method: 'razorpay',
        razorpay_order_id: mockOrderId,
      }).select().single()

      return NextResponse.json({
        success: true,
        order_id: mockOrderId,
        amount: total * 100,
        currency: 'INR',
        db_order_id: order?.id,
        mock: true,
      })
    }

    const razorpay = getRazorpay()
    let razorpayOrder: any
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: orderNumber,
        notes: { user_id: user.id },
      })
    } catch (err: any) {
      console.error('[payment/create] Razorpay error:', err?.error?.description || err.message)
      return NextResponse.json({ error: err?.error?.description || 'Payment gateway error. Please try again.' }, { status: 500 })
    }

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      user_id: user.id,
      order_number: orderNumber,
      items: authoritative,
      subtotal,
      discount,
      coupon_code: couponCode || null,
      total,
      status: 'pending',
      payment_method: 'razorpay',
      razorpay_order_id: razorpayOrder.id,
    }).select().single()

    if (orderErr || !order) {
      console.error('[payment/create] DB insert failed:', orderErr?.message)
      return NextResponse.json({ error: 'Order record failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      db_order_id: order.id,
    })
  }

  if (action === 'verify') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = await req.json()

    const isMock = process.env.NODE_ENV === 'development' && process.env.RAZORPAY_MOCK_MODE === 'true'
    if (!isMock) {
      const secret = process.env.RAZORPAY_KEY_SECRET
      if (!secret) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })
      const body = razorpay_order_id + '|' + razorpay_payment_id
      const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    // A client retry after a successful verify (flaky network right after Razorpay's
    // handler fires) must not re-send the customer receipt or the admin alert.
    const { data: priorOrder } = await supabase.from('orders')
      .select('status')
      .eq('id', db_order_id)
      .eq('user_id', user.id)
      .single()
    const alreadyPaid = (priorOrder as any)?.status === 'paid'

    // Ownership guard: only mark the user's own order as paid
    await supabase.from('orders').update({
      status: 'paid' as any,
      razorpay_payment_id,
    }).eq('id', db_order_id).eq('user_id', user.id)

    // Fulfil ebook purchases - sync ebooks table then create ebook_purchases
    // Uses admin client to bypass RLS (ebooks table only allows admin writes via RLS policy)
    const adminSupabase = await createAdminClient()
    const { data: orderRow } = await supabase.from('orders')
      .select('items,user_id,order_number,subtotal,discount,total,razorpay_order_id,coupon_code')
      .eq('id', db_order_id)
      .eq('user_id', user.id)
      .single()

    if (!orderRow) {
      console.error('[payment/verify] Could not re-fetch order:', db_order_id)
      return NextResponse.json({ success: true, verified: true })
    }

    // Consume the coupon exactly once. `used_count` was never incremented at
    // all, so a single-use reward coupon could be redeemed indefinitely.
    // `alreadyPaid` stops a client retry double-counting it, and the write is
    // a compare-and-swap so two concurrent verifies cannot both read the same
    // count and collapse into a single increment.
    const usedCoupon = (orderRow as any)?.coupon_code
    if (!alreadyPaid && usedCoupon) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: couponRow } = await (adminSupabase as any).from('coupons')
          .select('id, used_count')
          .eq('code', String(usedCoupon).toUpperCase())
          .maybeSingle()
        if (!couponRow) break

        const current = couponRow.used_count ?? 0
        const { data: bumped } = await (adminSupabase as any).from('coupons')
          .update({ used_count: current + 1 })
          .eq('id', couponRow.id)
          .eq('used_count', current)      // only if nobody moved it meanwhile
          .select('id')
          .maybeSingle()
        if (bumped) break
      }
    }
    const orderItems: any[] = (orderRow?.items as any[]) || []
    const ebookItems = orderItems.filter((i: any) => i.product_type === 'ebook')
    const unfulfilledEbooks: string[] = []
    for (const item of ebookItems) {
      const { data: product } = await supabase
        .from('products')
        .select('ebook_file_url,ebook_download_limit,description,name,slug,price')
        .eq('id', item.id)
        .single()
      if (!product?.ebook_file_url) {
        console.warn(`[payment/verify] Product ${item.id} has no PDF - admin must upload via Admin > Ebooks first.`)
        unfulfilledEbooks.push(product?.name || item.name || item.id)
        continue
      }
      // Ensure ebooks record exists - uses admin client because RLS blocks user writes to ebooks table
      const { error: upsertErr } = await (adminSupabase as any).from('ebooks').upsert({
        id: item.id,
        title: product.name,
        slug: product.slug,
        file_url: product.ebook_file_url,
        price: product.price,
        description: product.description || null,
        author: 'MahaTathastu',
        language: 'Hindi',
        tags: [],
      }, { onConflict: 'id' })
      if (upsertErr) {
        console.error(`[payment/verify] ebooks upsert failed for ${item.id}:`, upsertErr.message)
        continue
      }
      // Create purchase record (avoid duplicate on retry) - admin client ensures reliable write
      const { data: existing } = await adminSupabase
        .from('ebook_purchases')
        .select('id')
        .eq('user_id', orderRow.user_id)
        .eq('ebook_id', item.id)
        .maybeSingle()
      if (!existing) {
        const { error: epErr } = await (adminSupabase as any).from('ebook_purchases').insert({
          user_id: orderRow.user_id,
          ebook_id: item.id,
          order_id: db_order_id,
          download_count: 0,
          max_downloads: product.ebook_download_limit ?? 3,
          purchased_at: new Date().toISOString(),
        })
        if (epErr) console.error(`[payment/verify] ebook_purchases insert failed:`, epErr.message)
        else console.log(`[payment/verify] ebook_purchase created for user=${orderRow.user_id} ebook=${item.id}`)
      }
    }

    // Customer paid but at least one ebook couldn't be fulfilled (no file uploaded yet) -
    // flag it on the order so admins see it instead of the failure only reaching server logs.
    if (unfulfilledEbooks.length) {
      await adminSupabase.from('orders').update({
        notes: `⚠ Needs manual fulfillment - no PDF uploaded yet for: ${unfulfilledEbooks.join(', ')}`,
      } as any).eq('id', db_order_id)
    }

    if (alreadyPaid) {
      // Fulfilment above is idempotent and worth re-running; the notifications are not.
      return NextResponse.json({ success: true, verified: true })
    }

    // Send order confirmation email - fire and forget
    try {
      const name = (user.user_metadata?.full_name as string) || (user.email?.split('@')[0] ?? 'Seeker')
      await sendOrderConfirmation(user.email!, name, {
        orderNumber: orderRow?.order_number ?? `#${db_order_id}`,
        items: orderItems.map((i: any) => ({
          name: i.name ?? i.id,
          price: i.price ?? 0,
          quantity: i.quantity ?? 1,
          product_type: i.product_type,
        })),
        subtotal: (orderRow as any)?.subtotal ?? 0,
        discount: (orderRow as any)?.discount ?? 0,
        total: (orderRow as any)?.total ?? 0,
        paymentId: razorpay_payment_id,
      })
    } catch (emailErr: any) {
      console.warn('[Payment] Order email failed:', emailErr.message)
    }

    notifyAdmin({
      event: 'Order Paid',
      summary: `${orderRow?.order_number ?? db_order_id} - ₹${((orderRow as any)?.total ?? 0).toLocaleString('en-IN')}`,
      details: {
        'Order': orderRow?.order_number ?? String(db_order_id),
        'Customer': user.email || user.id,
        'Items': orderItems.map((i: any) => `${i.name ?? i.id} x${i.quantity ?? 1}`).join(', '),
        'Subtotal': `₹${((orderRow as any)?.subtotal ?? 0).toLocaleString('en-IN')}`,
        'Discount': (orderRow as any)?.discount ? `₹${(orderRow as any).discount.toLocaleString('en-IN')}` : '',
        'Total Paid': `₹${((orderRow as any)?.total ?? 0).toLocaleString('en-IN')}`,
        'Payment ID': razorpay_payment_id,
        'Needs Fulfilment': unfulfilledEbooks.length ? unfulfilledEbooks.join(', ') : '',
      },
      adminPath: '/admin/orders',
      accent: '#059669',
    })

    return NextResponse.json({ success: true, verified: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
