import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const caller = await createServerClient()
  const { data: { user: callerUser } } = await caller.auth.getUser()
  if (!callerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await caller.from('profiles').select('role').eq('id', callerUser.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, full_name, phone, role } = await req.json()
  if (!email || !password || !full_name) return NextResponse.json({ error: 'email, password, and full_name are required' }, { status: 400 })

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceKey) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })

  const admin = createClient(serviceUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone: phone || null },
  })

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })

  if (role && role !== 'user') {
    await admin.from('profiles').update({ role, phone: phone || null }).eq('id', newUser.user.id)
  } else if (phone) {
    await admin.from('profiles').update({ phone }).eq('id', newUser.user.id)
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}
