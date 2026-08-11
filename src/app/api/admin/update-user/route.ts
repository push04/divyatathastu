import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Read-only check with anon client (safe — we only read the caller's own profile)
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, role, is_active } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === user.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 })
  }

  // Whitelist only known-safe fields to prevent mass-assignment
  const allowedRoles = ['user', 'admin', 'expert']
  if (role !== undefined && !allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role value' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (role !== undefined) update.role = role
  if (is_active !== undefined) update.is_active = Boolean(is_active)
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // HIGH-3: Use service-role adminClient for writes so RLS cannot interfere
  const admin = await createAdminClient()
  const { error } = await (admin as any).from('profiles').update(update).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
