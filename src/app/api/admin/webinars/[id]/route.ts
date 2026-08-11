import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getRole(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role ?? null
}

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  return (await getRole(supabase)) === 'admin'
}

const ADMIN_ONLY_FIELDS = ['title', 'description', 'host_name', 'scheduled_at', 'duration_minutes', 'max_participants', 'price']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const role = await getRole(supabase)
  // Experts host sessions, so they may start and end one from the webinar
  // page. Everything else - pricing, schedule, capacity - stays admin-only.
  const isAdmin = role === 'admin'
  const isHost = isAdmin || role === 'expert'
  if (!isHost) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const allowed = ['status', ...ADMIN_ONLY_FIELDS]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (!(key in body)) continue
    if (!isAdmin && ADMIN_ONLY_FIELDS.includes(key)) {
      return NextResponse.json({ error: `Only an admin can change ${key}` }, { status: 403 })
    }
    updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }
  if ('status' in updates && !['upcoming', 'live', 'ended'].includes(String(updates.status))) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data, error } = await (supabase as any)
    .from('webinars')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ webinar: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  if (!(await assertAdmin(supabase))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await (supabase as any).from('webinars').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
