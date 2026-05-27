import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: NextRequest) {
  const caller = await createServerClient()
  const { data: { user: callerUser } } = await caller.auth.getUser()
  if (!callerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await caller.from('profiles').select('role').eq('id', callerUser.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  if (user_id === callerUser.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceKey) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Nullify orders user_id (no FK cascade on orders)
  await admin.from('orders').update({ user_id: null }).eq('user_id', user_id)

  // Hard delete auth user (cascades to profiles → families → family_members → reports via FK)
  const { error } = await admin.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
