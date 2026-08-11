import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'
import {
  PREDEFINED_SLOTS,
  CONSULTATION_PRICING_KEY,
  DEFAULT_CONSULTATION_PRICING,
  DEFAULT_SPECIALIZATION,
  isValidSpecialization,
  normalizePricing,
  resolveSlotPrice,
  type ConsultationPricing,
} from '@/lib/constants/consultation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mahatathastu.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@mahatathastu.com'

/**
 * Read the admin-configured price map. Falls back to the seed defaults - it
 * must never fall back to "free", because the price shown on the booking page
 * and the amount charged at Razorpay both derive from this.
 */
async function loadPricing(admin: any): Promise<ConsultationPricing> {
  try {
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('key', CONSULTATION_PRICING_KEY)
      .maybeSingle()
    return normalizePricing(data?.value)
  } catch {
    return { ...DEFAULT_CONSULTATION_PRICING }
  }
}

function fmtTime(t: string) {
  if (!t) return t
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'} IST`
}

function formatDate(d: string) {
  if (!d) return d
  const [y, mo, day] = d.split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function getRazorpay() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay')
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// POST /api/consultation-booking - book a slot
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'create'

  const admin = await createAdminClient()

  if (action === 'create') {
    const { date, start_time, end_time, specialization, notes, expected_price } = await req.json()
    if (!date || !start_time || !end_time) {
      return NextResponse.json({ error: 'date, start_time, end_time required' }, { status: 400 })
    }
    // MED-2: Validate date and time formats to prevent unexpected query injection
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    const TIME_RE = /^\d{2}:\d{2}$/
    if (!DATE_RE.test(date) || !TIME_RE.test(start_time.substring(0, 5)) || !TIME_RE.test(end_time.substring(0, 5))) {
      return NextResponse.json({ error: 'Invalid date or time format' }, { status: 400 })
    }

    // Count booked slots for the day
    const { data: daySlots } = await (admin as any).from('consultation_slots')
      .select('id, is_booked')
      .eq('date', date)
    const bookedCount = (daySlots || []).filter((s: any) => s.is_booked).length
    if (bookedCount >= 5) {
      return NextResponse.json({ error: 'This day is fully booked. Please choose another date.' }, { status: 400 })
    }

    // Find existing slot for this time.
    // `.maybeSingle()` used to error out whenever two rows shared a start time
    // (e.g. two experts), which silently produced a duplicate slot below.
    const normStart = start_time.substring(0, 5)
    const normEnd = end_time.substring(0, 5)
    const { data: slotRows } = await (admin as any).from('consultation_slots')
      .select('id, is_booked, is_blocked, price, specialization')
      .eq('date', date)
      .like('start_time', `${normStart}%`)
      .order('created_at', { ascending: true })
      .limit(1)
    const slot = (slotRows || [])[0] || null

    if (slot?.is_blocked) return NextResponse.json({ error: 'This slot is not available.' }, { status: 400 })
    if (slot?.is_booked) return NextResponse.json({ error: 'This slot is already booked.' }, { status: 400 })

    const requestedSpec = isValidSpecialization(specialization) ? specialization : DEFAULT_SPECIALIZATION
    const pricing = await loadPricing(admin)

    let slotId: string
    let slotPrice: number

    if (!slot) {
      // Auto-create the slot using admin client (bypasses RLS)
      const { data: expert } = await (admin as any).from('profiles')
        .select('id')
        .or('role.eq.expert,role.eq.admin')
        .limit(1)
        .maybeSingle()

      // Price comes from the admin-configured map for the requested
      // specialization - the same value the booking page displayed.
      slotPrice = resolveSlotPrice(null, requestedSpec, pricing)

      const { data: newSlot, error: slotErr } = await (admin as any).from('consultation_slots').insert({
        expert_id: expert?.id || null,
        date,
        start_time: normStart,
        end_time: normEnd,
        is_booked: false, // First payment then booking - don't lock yet!
        is_blocked: false,
        duration_minutes: 45,
        specialization: requestedSpec,
        price: slotPrice,
      }).select('id, price').single()

      if (slotErr || !newSlot) {
        return NextResponse.json({ error: 'Failed to create slot: ' + slotErr?.message }, { status: 500 })
      }
      slotId = newSlot.id
      // Trust what the DB actually stored, but keep 0 as 0.
      slotPrice = resolveSlotPrice(newSlot.price, requestedSpec, pricing)
    } else {
      // Slot exists and is available. We do NOT claim it here to enforce "first payment then booking".
      // We will claim it atomically in the verify step.
      slotId = slot.id
      // `slot.price ?? default` - the old `slot.price || 11000` turned an
      // admin's deliberately free slot (price 0) into an ₹11,000 charge.
      slotPrice = resolveSlotPrice(slot.price, slot.specialization || requestedSpec, pricing)
    }

    // Guard against ever charging something other than what the seeker was
    // shown. The client sends the price it rendered; a mismatch aborts the
    // booking instead of silently billing a different amount.
    if (expected_price !== undefined && expected_price !== null) {
      const shown = Number(expected_price)
      if (!Number.isFinite(shown) || Math.round(shown) !== Math.round(slotPrice)) {
        return NextResponse.json({
          error: 'The price for this slot has changed. Please refresh and try again.',
          price: slotPrice,
          price_changed: true,
        }, { status: 409 })
      }
    }

    if (slotPrice === 0) {
      // Free slot - book immediately (Atomic claim)
      const { data: claimed } = await (admin as any).from('consultation_slots')
        .update({ is_booked: true })
        .eq('id', slotId)
        .eq('is_booked', false)
        .select('id')
        .maybeSingle()
      if (!claimed) return NextResponse.json({ error: 'Slot just got booked' }, { status: 409 })

      const { data: booking, error: bookErr } = await (admin as any).from('consultation_bookings').insert({
        user_id: user.id,
        slot_id: slotId,
        status: 'confirmed',
        payment_status: 'paid',
        notes: notes || null,
      }).select('id').single()

      if (bookErr || !booking) {
        // MED-4: Sanitize — log only error code, not full object
        console.error('Booking insert error (free slot): code=%s', bookErr?.code ?? 'unknown')
        await (admin as any).from('consultation_slots').update({ is_booked: false }).eq('id', slotId)
        return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
      }
      
      await sendConfirmationEmails(admin, user.id, user.email, date, start_time, end_time, slotPrice)
      return NextResponse.json({ success: true, booking_id: booking.id, mock: true })
    }

    // Paid slot - initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID) {
      // Mock mode
      const { data: booking, error: bookErr } = await (admin as any).from('consultation_bookings').insert({
        user_id: user.id,
        slot_id: slotId,
        status: 'confirmed',
        payment_status: 'paid',
        razorpay_order_id: 'mock_' + Date.now(),
        razorpay_payment_id: 'mock_pay_' + Date.now(),
        notes: notes || null,
      }).select('id').single()

      if (bookErr || !booking) {
        // MED-4: Sanitize — log only error code
        console.error('Booking insert error (mock paid slot): code=%s', bookErr?.code ?? 'unknown')
        return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
      }
      await sendConfirmationEmails(admin, user.id, user.email, date, start_time, end_time, slotPrice)
      return NextResponse.json({ success: true, booking_id: booking.id, mock: true })
    }

    const razorpay = getRazorpay()
    let order: any
    try {
      order = await razorpay.orders.create({
        amount: Math.round(slotPrice * 100),
        currency: 'INR',
        receipt: `CONS-${Date.now()}`,
        notes: { user_id: user.id, slot_id: slotId },
      })
    } catch (err: any) {
        return NextResponse.json({ error: err?.error?.description || 'Payment gateway error. Please try again.' }, { status: 500 })
    }

    const { data: booking, error: bookErr } = await (admin as any).from('consultation_bookings').insert({
      user_id: user.id,
      slot_id: slotId,
      status: 'booked', // Changed from 'pending' to satisfy Postgres CHECK constraint
      payment_status: 'pending',
      razorpay_order_id: order.id,
      notes: notes || null,
    }).select('id').single()

    if (bookErr || !booking) {
      // MED-4: Sanitize — log only error code
      console.error('Booking insert error (Razorpay paid slot): code=%s', bookErr?.code ?? 'unknown')
      return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      booking_id: booking.id,
      price: slotPrice,
      // The publishable key. The client used to read `data.key` from this
      // response while the server deliberately omitted it, so `key` was
      // undefined and the Razorpay dialog never opened for paid slots.
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
    })
  }

  if (action === 'verify') {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) return NextResponse.json({ error: 'Payment not configured' }, { status: 503 })

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex')
    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const { data: booking } = await (admin as any).from('consultation_bookings')
      // `notes` is read further down when flagging a double-booking collision -
      // it was not being selected, so the flag was appended to `undefined`.
      .select('user_id, razorpay_order_id, slot_id, notes, consultation_slots(date, start_time, end_time, price)')
      .eq('id', booking_id)
      .single()

    if (!booking || booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    if (booking.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Order mismatch' }, { status: 400 })
    }

    // Atomic claim the slot now that payment is verified!
    const { data: claimedSlot } = await (admin as any).from('consultation_slots')
      .update({ is_booked: true })
      .eq('id', booking.slot_id)
      .eq('is_booked', false)
      .select('id')
      .maybeSingle()

    if (!claimedSlot) {
      // Extremely rare edge case: someone else paid and grabbed it millisecond before us!
      // Since payment is already made, we still mark booking as paid, but need manual resolution
      await (admin as any).from('consultation_bookings').update({
        payment_status: 'paid',
        status: 'booked', // Need to resolve manually
        razorpay_payment_id,
        notes: (booking.notes || '') + ' [ATTENTION: DOUBLE BOOKING COLLISION]'
      }).eq('id', booking_id)
      return NextResponse.json({ success: true, warning: 'Slot was taken concurrently. Admin will reschedule.' })
    }

    await (admin as any).from('consultation_bookings').update({
      payment_status: 'paid',
      status: 'confirmed',
      razorpay_payment_id,
    }).eq('id', booking_id)

    const slotDate = booking.consultation_slots?.date
    const slotStart = booking.consultation_slots?.start_time
    const slotEnd = booking.consultation_slots?.end_time
    const slotPrice = booking.consultation_slots?.price || 0
    await sendConfirmationEmails(admin, user.id, user.email, slotDate, slotStart, slotEnd, slotPrice)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

async function sendConfirmationEmails(admin: any, userId: string, userEmail: string | undefined, date: string, start_time: string, end_time: string, slotPrice: number) {
  // Fetch user profile for email
  const { data: profile } = await admin.from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  const userName = profile?.full_name || userEmail || 'Devotee'
  const priceText = slotPrice > 0 ? `₹${slotPrice.toLocaleString('en-IN')}` : 'Complimentary'
  const dateText = formatDate(date)
  const timeText = `${fmtTime(start_time)} - ${fmtTime(end_time)}`

  // Email to user
  if (userEmail) {
    sendEmail(
      userEmail,
      '✅ Consultation Booked - MahaTathastu',
      `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#2d1b00;background:#fffbf2;padding:32px;border-radius:16px;border:1px solid #e8d5a3">
        <h2 style="color:#6b21a8;font-size:22px;margin-bottom:4px">Consultation Confirmed 🙏</h2>
        <p style="color:#78350f;font-size:14px;margin-bottom:20px">Namaste ${userName}, your session is confirmed.</p>
        <div style="background:#fff;border-radius:12px;border:1px solid #e8d5a3;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:13px;color:#92400e"><strong>Date:</strong> ${dateText}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#92400e"><strong>Time:</strong> ${timeText}</p>
          <p style="margin:0;font-size:13px;color:#92400e"><strong>Amount:</strong> ${priceText}</p>
        </div>
        <p style="font-size:13px;color:#78350f;line-height:1.7">Please be online 2–3 minutes before your session. Join from the <strong>Consultations</strong> page on your dashboard.</p>
        <a href="${APP_URL}/consultations" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#6b21a8;color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:bold">View My Bookings →</a>
        <p style="margin-top:28px;font-size:11px;color:#a78050">MahaTathastu · Vedic Wisdom, Modern Life</p>
      </div>`
    ).catch(() => {})
  }

  // Email to admin
  sendEmail(
    ADMIN_EMAIL,
    `📅 New Consultation Booking - ${userName}`,
    `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#2d1b00;background:#f0fdf4;padding:32px;border-radius:16px;border:1px solid #bbf7d0">
      <h2 style="color:#166534;font-size:20px;margin-bottom:16px">New Consultation Booking</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #bbf7d0;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:13px"><strong>User:</strong> ${userName} (${userEmail})</p>
        <p style="margin:0 0 8px;font-size:13px"><strong>Date:</strong> ${dateText}</p>
        <p style="margin:0 0 8px;font-size:13px"><strong>Time:</strong> ${timeText}</p>
        <p style="margin:0;font-size:13px"><strong>Amount:</strong> ${priceText}</p>
      </div>
      <a href="${APP_URL}/admin/consultations" style="display:inline-block;padding:12px 28px;background:#166534;color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:bold">View in Admin →</a>
    </div>`
  ).catch(() => {})
}

// GET /api/consultation-booking?date=YYYY-MM-DD - fetch slot status for a date
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const specParam = searchParams.get('specialization')
  const requestedSpec = isValidSpecialization(specParam) ? specParam : DEFAULT_SPECIALIZATION

  // Read pricing through whichever client is available. Falling back to the
  // seed defaults is essential: returning 0 here is what made slots read
  // "Complimentary" while the booking endpoint charged full price.
  let pricing: ConsultationPricing
  try {
    pricing = await loadPricing(await createAdminClient())
  } catch {
    pricing = await loadPricing(supabase)
  }

  const { data: rawSlots } = await (supabase as any).from('consultation_slots')
    .select('id, start_time, end_time, is_booked, is_blocked, price, specialization')
    .eq('date', date)
  const slots: any[] = rawSlots || []

  // Merge predefined slots with DB state.
  // A slot with no DB row is NOT free - it resolves to the configured price
  // for the requested specialization, which is exactly what booking it will
  // charge. `price: dbSlot?.price || 0` was the source of the "Complimentary"
  // label on slots that then billed ₹11,000.
  const merged = PREDEFINED_SLOTS.map(ps => {
    const dbSlot = slots.find(s => s.start_time?.substring(0, 5) === ps.start)
    return {
      start: ps.start,
      end: ps.end,
      is_booked: dbSlot?.is_booked || false,
      is_blocked: dbSlot?.is_blocked || false,
      price: resolveSlotPrice(dbSlot?.price, dbSlot?.specialization || requestedSpec, pricing),
      specialization: dbSlot?.specialization || requestedSpec,
      slot_id: dbSlot?.id || null,
    }
  })

  return NextResponse.json({ success: true, slots: merged, pricing, specialization: requestedSpec })
}
