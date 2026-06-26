import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mahatathastu.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@mahatathastu.com'

const PREDEFINED_SLOTS = [
  { start: '17:00', end: '17:45' },
  { start: '17:45', end: '18:30' },
  { start: '18:30', end: '19:15' },
  { start: '19:15', end: '20:00' },
  { start: '20:00', end: '20:45' },
  { start: '20:45', end: '21:30' },
  { start: '21:30', end: '22:15' },
  { start: '22:15', end: '23:00' },
]

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'} IST`
}

function formatDate(d: string) {
  const [y, mo, day] = d.split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// POST /api/consultation-booking — book a slot
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, start_time, end_time, specialization, notes } = await req.json()
  if (!date || !start_time || !end_time) {
    return NextResponse.json({ error: 'date, start_time, end_time required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Count booked slots for the day
  const { data: daySlots } = await (admin as any).from('consultation_slots')
    .select('id, is_booked')
    .eq('date', date)
  const bookedCount = (daySlots || []).filter((s: any) => s.is_booked).length
  if (bookedCount >= 5) {
    return NextResponse.json({ error: 'This day is fully booked. Please choose another date.' }, { status: 400 })
  }

  // Find existing slot for this time
  const normStart = start_time.substring(0, 5)
  const normEnd = end_time.substring(0, 5)
  const { data: slot } = await (admin as any).from('consultation_slots')
    .select('id, is_booked, is_blocked, price')
    .eq('date', date)
    .like('start_time', `${normStart}%`)
    .maybeSingle()

  if (slot?.is_blocked) return NextResponse.json({ error: 'This slot is not available.' }, { status: 400 })
  if (slot?.is_booked) return NextResponse.json({ error: 'This slot is already booked.' }, { status: 400 })

  let slotId: string
  let slotPrice = 0

  if (!slot) {
    // Auto-create the slot using admin client (bypasses RLS)
    const { data: expert } = await (admin as any).from('profiles')
      .select('id')
      .or('role.eq.expert,role.eq.admin')
      .limit(1)
      .maybeSingle()

    const { data: newSlot, error: slotErr } = await (admin as any).from('consultation_slots').insert({
      expert_id: expert?.id || null,
      date,
      start_time: normStart,
      end_time: normEnd,
      is_booked: true,
      is_blocked: false,
      duration_minutes: 45,
      specialization: specialization || 'Astrology',
      price: 0,
    }).select('id, price').single()

    if (slotErr || !newSlot) {
      return NextResponse.json({ error: 'Failed to create slot: ' + slotErr?.message }, { status: 500 })
    }
    slotId = newSlot.id
    slotPrice = newSlot.price || 0
  } else {
    await (admin as any).from('consultation_slots').update({ is_booked: true }).eq('id', slot.id)
    slotId = slot.id
    slotPrice = slot.price || 0
  }

  // Create consultation booking
  const { data: booking, error: bookErr } = await (admin as any).from('consultation_bookings').insert({
    user_id: user.id,
    slot_id: slotId,
    status: 'confirmed',
    notes: notes || null,
  }).select('id').single()

  if (bookErr || !booking) {
    await (admin as any).from('consultation_slots').update({ is_booked: false }).eq('id', slotId)
    return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
  }

  // Fetch user profile for email
  const { data: profile } = await (admin as any).from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const userName = profile?.full_name || user.email || 'Devotee'
  const userEmail = user.email || ''
  const priceText = slotPrice > 0 ? `₹${slotPrice.toLocaleString('en-IN')}` : 'Complimentary'
  const dateText = formatDate(date)
  const timeText = `${fmtTime(start_time)} – ${fmtTime(end_time)}`

  // Email to user
  if (userEmail) {
    sendEmail(
      userEmail,
      '✅ Consultation Booked — MahaTathastu',
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
    `📅 New Consultation Booking — ${userName}`,
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

  return NextResponse.json({ success: true, booking_id: booking.id })
}

// GET /api/consultation-booking?date=YYYY-MM-DD — fetch slot status for a date
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  const { data: rawSlots } = await (supabase as any).from('consultation_slots')
    .select('id, start_time, end_time, is_booked, is_blocked, price')
    .eq('date', date)
  const slots: any[] = rawSlots || []

  // Merge predefined slots with DB state
  const merged = PREDEFINED_SLOTS.map(ps => {
    const dbSlot = slots.find(s => s.start_time?.substring(0, 5) === ps.start)
    return {
      start: ps.start,
      end: ps.end,
      is_booked: dbSlot?.is_booked || false,
      is_blocked: dbSlot?.is_blocked || false,
      price: dbSlot?.price || 0,
      slot_id: dbSlot?.id || null,
    }
  })

  return NextResponse.json({ success: true, slots: merged })
}
