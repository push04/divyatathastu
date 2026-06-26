import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, role, is_active } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === user.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (role !== undefined) update.role = role
  if (is_active !== undefined) update.is_active = is_active
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await (supabase as any).from('profiles').update(update).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
